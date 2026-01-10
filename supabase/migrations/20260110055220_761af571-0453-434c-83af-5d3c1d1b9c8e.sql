-- Drop the overly permissive policies
DROP POLICY IF EXISTS "Moderators can view HIPAA releases for their families" ON public.hipaa_releases;
DROP POLICY IF EXISTS "Organization members can view HIPAA releases for org families" ON public.hipaa_releases;

-- Create more restrictive policy: Only organization owners/admins can view HIPAA releases (not staff)
-- These are more likely to be compliance officers or authorized personnel
CREATE POLICY "Only org owners and admins can view HIPAA releases" 
ON public.hipaa_releases 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM families f
    JOIN organization_members om ON om.organization_id = f.organization_id
    WHERE f.id = hipaa_releases.family_id 
    AND om.user_id = auth.uid()
    AND om.role IN ('owner', 'admin')
  )
);

-- Create audit table for HIPAA access logging
CREATE TABLE IF NOT EXISTS public.hipaa_access_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hipaa_release_id uuid NOT NULL REFERENCES public.hipaa_releases(id) ON DELETE CASCADE,
  accessed_by uuid NOT NULL,
  accessed_at timestamptz NOT NULL DEFAULT now(),
  access_type text NOT NULL DEFAULT 'view',
  ip_address text
);

-- Enable RLS on audit table
ALTER TABLE public.hipaa_access_audit ENABLE ROW LEVEL SECURITY;

-- Block all client access to audit logs - only service role can insert
CREATE POLICY "Block client access to HIPAA audit logs" 
ON public.hipaa_access_audit 
FOR ALL 
USING (false) 
WITH CHECK (false);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_hipaa_access_audit_release_id ON public.hipaa_access_audit(hipaa_release_id);
CREATE INDEX IF NOT EXISTS idx_hipaa_access_audit_accessed_by ON public.hipaa_access_audit(accessed_by);

-- Add comment explaining the security model
COMMENT ON TABLE public.hipaa_releases IS 'HIPAA consent forms - access restricted to document owners and authorized org admins/owners only';