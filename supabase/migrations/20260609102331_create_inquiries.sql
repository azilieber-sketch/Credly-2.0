-- Prospect inquiries from the public landing-page "Talk to us" form.
-- Companies are NOT self-serve: a prospect leaves an email here, and the admin
-- follows up and manually provisions the company account later.
CREATE TABLE IF NOT EXISTS public.inquiries (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email      text NOT NULL,
  message    text,
  status     text NOT NULL DEFAULT 'new' CHECK (status = ANY (ARRAY['new'::text, 'contacted'::text])),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- Public form submits with the anon key (no session). Allow anonymous INSERT,
-- but pin status to 'new' so a submitter cannot pre-mark themselves contacted.
CREATE POLICY inquiries_anon_insert ON public.inquiries
  FOR INSERT TO anon, authenticated
  WITH CHECK (status = 'new');

-- Only the admin can read inquiries and mark them contacted. Mirrors the
-- admin_all_* pattern used on companies/tickets/integrations.
CREATE POLICY inquiries_admin_all ON public.inquiries
  FOR ALL TO public
  USING (auth.email() = 'admin@credly.com')
  WITH CHECK (auth.email() = 'admin@credly.com');
