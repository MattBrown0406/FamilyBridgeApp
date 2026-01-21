-- Drop the existing INSERT policy that doesn't verify family membership
DROP POLICY IF EXISTS "Users can sign their own HIPAA releases" ON public.hipaa_releases;

-- Create a more secure INSERT policy that requires:
-- 1. User is signing for themselves (auth.uid() = user_id)
-- 2. User is a member of the family they're signing for
CREATE POLICY "Users can sign HIPAA releases for their own families"
ON public.hipaa_releases
FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND public.is_family_member(family_id, auth.uid())
);

-- Add a comment explaining the security model
COMMENT ON TABLE public.hipaa_releases IS 'HIPAA medical release signatures. Direct SELECT/UPDATE/DELETE blocked. INSERT requires user to be a family member signing for themselves. All reads via security-definer views that mask signature_data.';