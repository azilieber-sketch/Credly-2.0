-- Drop tickets.priority (urgency) — replaced by the status model.
-- Destructive; approved by Azi 2026-06-10. No UI or API reads it anymore.

ALTER TABLE public.tickets DROP COLUMN priority;
