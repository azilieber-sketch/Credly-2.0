-- Add reply persistence columns to tickets.
-- Agent replies (and the resolved status timestamp) need to survive a reload,
-- and the client dashboard reads replied_at. Both nullable: a ticket has no
-- reply until an agent answers it.
ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS reply text,
  ADD COLUMN IF NOT EXISTS replied_at timestamptz;
