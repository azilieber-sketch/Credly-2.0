-- ============================================================================
-- Multi-tenant foundation (DATABASE ONLY)
-- ----------------------------------------------------------------------------
-- Adds a workspace/membership layer on top of the existing schema WITHOUT
-- deleting or destructively altering any existing table, column, or row.
--
-- What it does:
--   1. workspaces            — one isolated tenant space (TEAMS model)
--   2. workspace_members     — agents/owners that belong to a workspace
--   3. workspace_id FKs      — added (nullable) to tickets + integrations
--   4. data backfill         — every existing company -> its own workspace,
--                              tickets/integrations linked, memberships for
--                              any auth user whose email matches a company
--   5. signup bootstrap      — auth.users INSERT trigger auto-creates a
--                              workspace + 'owner' membership
--   6. RLS                   — scope by workspace MEMBERSHIP; drop the open
--                              anon policies; keep admin@credly.com staff access
--
-- The legacy `companies` table and all of its rows are left in place.
-- ============================================================================


-- ─── 1. WORKSPACES ──────────────────────────────────────────────────────────
create table if not exists public.workspaces (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  -- placeholder columns for brand voice / company details (filled later)
  brand_voice       text,
  company_details   jsonb not null default '{}'::jsonb,
  industry          text,
  website           text,
  support_email     text,
  -- lineage back to the demo company this workspace was migrated from (nullable)
  legacy_company_id uuid references public.companies(id),
  created_at        timestamptz not null default now()
);


-- ─── 2. WORKSPACE MEMBERSHIP ────────────────────────────────────────────────
create table if not exists public.workspace_members (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  role         text not null default 'agent' check (role in ('owner', 'agent')),
  created_at   timestamptz not null default now(),
  unique (workspace_id, user_id)
);

create index if not exists workspace_members_user_idx      on public.workspace_members(user_id);
create index if not exists workspace_members_workspace_idx on public.workspace_members(workspace_id);


-- ─── 3. TENANT KEYS on existing tables (nullable, non-destructive) ──────────
alter table public.tickets       add column if not exists workspace_id uuid references public.workspaces(id);
alter table public.integrations  add column if not exists workspace_id uuid references public.workspaces(id);

create index if not exists tickets_workspace_idx      on public.tickets(workspace_id);
create index if not exists integrations_workspace_idx on public.integrations(workspace_id);


-- ─── 4. BACKFILL existing demo data ─────────────────────────────────────────
-- 4a. One workspace per existing company (idempotent: skip if already migrated)
insert into public.workspaces (name, legacy_company_id, industry, support_email, created_at)
select c.name, c.id, c.industry, c.email, c.created_at
from public.companies c
where not exists (
  select 1 from public.workspaces w where w.legacy_company_id = c.id
);

-- 4b. Link tickets to the workspace migrated from their company
update public.tickets t
set workspace_id = w.id
from public.workspaces w
where w.legacy_company_id = t.company_id
  and t.workspace_id is null;

-- 4c. Link integrations to the workspace migrated from their company
update public.integrations i
set workspace_id = w.id
from public.workspaces w
where w.legacy_company_id = i.company_id
  and i.workspace_id is null;

-- 4d. Backfill memberships for any auth user whose email matches a demo company
--     (gives existing demo logins ownership of their migrated workspace)
insert into public.workspace_members (workspace_id, user_id, role)
select w.id, u.id, 'owner'
from public.workspaces w
join public.companies c on c.id = w.legacy_company_id
join auth.users u       on lower(u.email) = lower(c.email)
on conflict (workspace_id, user_id) do nothing;


-- ─── 5. SIGNUP BOOTSTRAP (auth.users trigger) ───────────────────────────────
-- SECURITY DEFINER so it can write to public tables during signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_ws_id uuid;
  ws_name   text;
begin
  ws_name := coalesce(nullif(split_part(new.email, '@', 1), ''), 'My') || '''s workspace';

  insert into public.workspaces (name, support_email)
  values (ws_name, new.email)
  returning id into new_ws_id;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (new_ws_id, new.id, 'owner');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ─── 6. RLS ─────────────────────────────────────────────────────────────────
-- Helper: is the current user a member of this workspace?
-- SECURITY DEFINER (owned by postgres) => bypasses RLS => no policy recursion.
create or replace function public.is_workspace_member(ws_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members m
    where m.workspace_id = ws_id
      and m.user_id = auth.uid()
  );
$$;

alter table public.workspaces       enable row level security;
alter table public.workspace_members enable row level security;

-- workspaces ---------------------------------------------------------------
drop policy if exists admin_all_workspaces      on public.workspaces;
drop policy if exists members_select_workspaces on public.workspaces;
drop policy if exists members_update_workspaces on public.workspaces;

create policy admin_all_workspaces on public.workspaces
  for all using (auth.email() = 'admin@credly.com');

create policy members_select_workspaces on public.workspaces
  for select using (public.is_workspace_member(id));

create policy members_update_workspaces on public.workspaces
  for update using (public.is_workspace_member(id))
  with check (public.is_workspace_member(id));

-- workspace_members --------------------------------------------------------
drop policy if exists admin_all_members   on public.workspace_members;
drop policy if exists select_own_member   on public.workspace_members;
drop policy if exists select_ws_members   on public.workspace_members;
drop policy if exists members_insert      on public.workspace_members;

create policy admin_all_members on public.workspace_members
  for all using (auth.email() = 'admin@credly.com');

-- a user can always see their own membership rows...
create policy select_own_member on public.workspace_members
  for select using (user_id = auth.uid());

-- ...and the membership of any workspace they belong to (for the team roster)
create policy select_ws_members on public.workspace_members
  for select using (public.is_workspace_member(workspace_id));

-- existing members (e.g. owners) can add teammates to their workspace
create policy members_insert on public.workspace_members
  for insert with check (public.is_workspace_member(workspace_id));

-- tickets ------------------------------------------------------------------
-- Remove the DANGEROUS open anon policies (anyone with the public key could
-- read/insert all tickets).
drop policy if exists anon_select on public.tickets;
drop policy if exists anon_insert on public.tickets;

-- Add workspace-membership scoping. (admin_all_tickets + companies_own_tickets
-- are intentionally left in place so the still-email-based client portal keeps
-- working until the app code is migrated in a later step.)
drop policy if exists members_select_tickets on public.tickets;
drop policy if exists members_write_tickets  on public.tickets;

create policy members_select_tickets on public.tickets
  for select using (public.is_workspace_member(workspace_id));

create policy members_write_tickets on public.tickets
  for all
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

-- integrations -------------------------------------------------------------
-- Replace the email-based policy with workspace-membership scoping.
drop policy if exists users_own_integrations       on public.integrations;
drop policy if exists members_all_integrations      on public.integrations;

create policy members_all_integrations on public.integrations
  for all
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

-- companies ----------------------------------------------------------------
-- Remove the DANGEROUS open anon policies. Keep admin + own-company (email)
-- SELECT so the existing admin/detail + client portal keep working for now.
drop policy if exists anon_select on public.companies;
drop policy if exists anon_insert on public.companies;
drop policy if exists anon_update on public.companies;


-- ─── 7. HARDEN new SECURITY DEFINER functions (least privilege) ─────────────
-- handle_new_user only ever fires via the auth.users trigger -> no direct EXECUTE.
revoke all on function public.handle_new_user() from public, anon, authenticated;
-- is_workspace_member is an RLS helper -> only signed-in users need it.
revoke all on function public.is_workspace_member(uuid) from public, anon;
grant execute on function public.is_workspace_member(uuid) to authenticated;
