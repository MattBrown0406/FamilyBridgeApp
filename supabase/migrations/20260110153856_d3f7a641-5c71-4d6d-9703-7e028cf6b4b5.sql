-- Drop the existing org policy that uses 'public' role
DROP POLICY IF EXISTS "Only org owners and admins can view HIPAA releases" ON public.hipaa_releases;

-- Recreate with authenticated role and more explicit org verification
CREATE POLICY "Only org owners and admins can view HIPAA releases" 
ON public.hipaa_releases 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM families f
    INNER JOIN organization_members om ON om.organization_id = f.organization_id
    WHERE f.id = hipaa_releases.family_id 
      AND f.organization_id IS NOT NULL
      AND om.user_id = auth.uid() 
      AND om.role IN ('owner', 'admin')
  )
);

-- Also update the user's own view policy to use authenticated role explicitly  
DROP POLICY IF EXISTS "Users can view their own HIPAA releases" ON public.hipaa_releases;

CREATE POLICY "Users can view their own HIPAA releases" 
ON public.hipaa_releases 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);