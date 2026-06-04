-- Allow workspace-scoped upserts (onConflict workspace_id,channel) and prevent
-- duplicate channel rows per workspace.
--
-- NOTE: this is a NON-partial unique index on purpose. supabase-js upserts emit
-- `ON CONFLICT (workspace_id, channel)` with no WHERE predicate, so a partial
-- index could not be inferred. A full unique index is safe here because Postgres
-- treats NULLs as distinct, so legacy null-workspace rows never collide.
create unique index if not exists integrations_workspace_channel_key
  on public.integrations (workspace_id, channel);
