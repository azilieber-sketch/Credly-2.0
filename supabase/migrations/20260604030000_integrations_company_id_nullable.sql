-- Workspace-scoped integrations carry workspace_id and no legacy company_id.
-- Relax the NOT NULL so they can be created. Non-destructive: existing rows and
-- the FK to companies are unchanged; this only permits NULL company_id going forward.
alter table public.integrations alter column company_id drop not null;
