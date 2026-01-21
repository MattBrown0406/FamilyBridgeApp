-- Strengthen HIPAA release security: Block all direct INSERTs
-- All inserts MUST go through the sign_hipaa_release SECURITY DEFINER function
-- which handles encryption and audit logging

-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Users can sign HIPAA releases for their own families" ON public.hipaa_releases;

-- Create a blocking INSERT policy - no direct inserts allowed
-- The sign_hipaa_release function uses SECURITY DEFINER and bypasses RLS
CREATE POLICY "No direct inserts - use sign_hipaa_release function"
ON public.hipaa_releases
FOR INSERT
WITH CHECK (false);

-- Add comment explaining the security model
COMMENT ON TABLE public.hipaa_releases IS 
'HIPAA release signatures table. SECURITY: Direct INSERT/SELECT/UPDATE/DELETE blocked via RLS. 
All inserts MUST use sign_hipaa_release() RPC which encrypts signatures server-side. 
All reads MUST use hipaa_releases_user_view or hipaa_releases_admin_view which mask signature data.
Signature data is encrypted using encrypt_sensitive() and stored in signature_data_encrypted column.
Legacy signature_data column only stores [ENCRYPTED] placeholder per check constraint.';