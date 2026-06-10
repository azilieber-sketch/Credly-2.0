-- New ticket status model. Replying no longer auto-resolves:
--   new (created) → read (admin opened) → answered (admin replied)
--   → customer-replied (inbound appended) → resolved (MANUAL only).
-- Value remap, no data loss: open→new, in-progress→read, resolved kept.
-- The priority column is intentionally NOT dropped here (destructive —
-- pending explicit approval); the UI no longer uses it.

ALTER TABLE public.tickets DROP CONSTRAINT tickets_status_check;

UPDATE public.tickets SET status = CASE status
  WHEN 'open'        THEN 'new'
  WHEN 'in-progress' THEN 'read'
  ELSE status
END;

ALTER TABLE public.tickets ALTER COLUMN status SET DEFAULT 'new';

ALTER TABLE public.tickets ADD CONSTRAINT tickets_status_check
  CHECK (status IN ('new', 'read', 'answered', 'customer-replied', 'resolved'));
