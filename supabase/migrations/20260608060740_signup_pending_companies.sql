-- Allow 'pending' as a company status (new self-serve signups await admin approval).
ALTER TABLE public.companies DROP CONSTRAINT companies_status_check;
ALTER TABLE public.companies ADD CONSTRAINT companies_status_check
  CHECK (status = ANY (ARRAY['pending'::text, 'active'::text, 'suspended'::text]));

-- Let an authenticated user create their OWN company row, pending approval.
-- Email must match their identity, and status is forced to 'pending' so a user
-- cannot self-activate. Admin keeps full control via admin_all_companies; the
-- flip to 'active' stays admin-only (regular users have no UPDATE policy).
CREATE POLICY users_insert_own_pending_company ON public.companies
  FOR INSERT TO authenticated
  WITH CHECK (email = auth.email() AND status = 'pending');
