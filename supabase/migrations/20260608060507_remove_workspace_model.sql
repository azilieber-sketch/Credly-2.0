-- Remove inert workspace/multi-tenant objects left by the reverted pivot.
-- Restores the managed-service schema (companies / tickets / integrations
-- with email-based RLS). Data-safe: all affected tables were empty.

-- GROUP 1 — Kill the signup trigger + its function FIRST.
-- (Auto-created a workspace on every signup; must be gone before the new
--  signup->pending-company logic, or the two collide.)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- GROUP 2 — Remove membership-based RLS policies from the KEPT tables.
-- (Email-based policies are left untouched. Policies on the dropped tables
--  in Group 4 go away automatically with those tables.)
DROP POLICY IF EXISTS members_select_tickets ON public.tickets;
DROP POLICY IF EXISTS members_write_tickets  ON public.tickets;
DROP POLICY IF EXISTS members_all_integrations ON public.integrations;

-- GROUP 3 — Drop the workspace_id columns added to the old tables.
-- (Also auto-drops their indexes and FKs to workspaces.)
ALTER TABLE public.tickets       DROP COLUMN IF EXISTS workspace_id;
ALTER TABLE public.integrations  DROP COLUMN IF EXISTS workspace_id;

-- GROUP 4 — Drop the workspace-model tables entirely.
-- (Takes their RLS policies, indexes, FKs, and workspaces.legacy_company_id
--  with them. Order respects FK dependencies.)
DROP TABLE IF EXISTS public.messages;
DROP TABLE IF EXISTS public.workspace_members;
DROP TABLE IF EXISTS public.workspaces;

-- GROUP 5 — Drop the now-unused membership helper function.
DROP FUNCTION IF EXISTS public.is_workspace_member(uuid);

-- GROUP 6 — Restore the original NOT NULL constraint the pivot relaxed.
ALTER TABLE public.integrations ALTER COLUMN company_id SET NOT NULL;
