-- ============================================================================
-- Messages table — threaded conversations per ticket (ADDITIVE)
-- ----------------------------------------------------------------------------
-- Each ticket becomes a thread of messages (customer + agent). Replaces the
-- broken pattern of writing to non-existent tickets.reply / replied_at columns.
-- Membership-scoped RLS mirrors tickets/integrations.
-- ============================================================================

create table if not exists public.messages (
  id           uuid primary key default gen_random_uuid(),
  ticket_id    uuid not null references public.tickets(id)    on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  sender_type  text not null check (sender_type in ('customer', 'agent')),
  sender_name  text,
  sender_email text,
  body         text not null,
  channel      text,
  created_at   timestamptz not null default now()
);

create index if not exists messages_ticket_idx    on public.messages(ticket_id);
create index if not exists messages_workspace_idx on public.messages(workspace_id);

alter table public.messages enable row level security;

drop policy if exists admin_all_messages      on public.messages;
drop policy if exists members_select_messages on public.messages;
drop policy if exists members_write_messages  on public.messages;

create policy admin_all_messages on public.messages
  for all using (auth.email() = 'admin@credly.com');

create policy members_select_messages on public.messages
  for select using (public.is_workspace_member(workspace_id));

create policy members_write_messages on public.messages
  for all
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));
