-- Companies are no longer self-serve: prospects submit an inquiry and the admin
-- manually creates the company. Drop the policy that let an authenticated user
-- insert their own 'pending' company on signup. Admin retains full INSERT/UPDATE
-- via admin_all_companies; users_own_company (SELECT) is left intact so a
-- provisioned client can still read their own row.
DROP POLICY IF EXISTS users_insert_own_pending_company ON public.companies;

-- The 'pending' status value is kept in companies_status_check: the admin may
-- still create a company as pending and activate it later. Only the public
-- self-insert path is removed.
