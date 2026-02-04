-- Fix: Restrict fiis_calibration_patterns to family moderators and clinical staff only

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can read patterns" ON public.fiis_calibration_patterns;

-- Create policy for family moderators (users who moderate at least one family)
CREATE POLICY "Family moderators can read calibration patterns"
ON public.fiis_calibration_patterns
FOR SELECT
TO authenticated
USING (
  is_active = true
  AND EXISTS (
    SELECT 1 FROM public.family_members fm
    WHERE fm.user_id = auth.uid()
      AND fm.role = 'moderator'
  )
);

-- Create policy for organization clinical staff (org members who work with families)
CREATE POLICY "Organization staff can read calibration patterns"
ON public.fiis_calibration_patterns
FOR SELECT
TO authenticated
USING (
  is_active = true
  AND EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.user_id = auth.uid()
  )
);

-- Create policy for super admins
CREATE POLICY "Super admins can read all calibration patterns"
ON public.fiis_calibration_patterns
FOR SELECT
TO authenticated
USING (
  public.is_super_admin(auth.uid())
);

-- Ensure anon has no access
REVOKE ALL ON public.fiis_calibration_patterns FROM anon;
REVOKE ALL ON public.fiis_calibration_patterns FROM public;
GRANT SELECT ON public.fiis_calibration_patterns TO authenticated;

-- Add comment documenting the security rationale
COMMENT ON TABLE public.fiis_calibration_patterns IS 
'Clinical calibration patterns for FIIS analysis. Access restricted to: family moderators, organization clinical staff, and super admins. Contains sensitive relapse warning signs and treatment protocols.';