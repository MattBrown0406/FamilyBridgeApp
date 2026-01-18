-- Revoke anon access from hipaa_releases base table
REVOKE ALL ON public.hipaa_releases FROM anon;

-- Revoke anon access from the admin view
REVOKE ALL ON public.hipaa_releases_admin_view FROM anon;

-- Ensure the base table has proper RLS (it should, but let's verify)
ALTER TABLE public.hipaa_releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hipaa_releases FORCE ROW LEVEL SECURITY;

-- Also revoke anon from profiles table to be safe
REVOKE SELECT ON public.profiles FROM anon;