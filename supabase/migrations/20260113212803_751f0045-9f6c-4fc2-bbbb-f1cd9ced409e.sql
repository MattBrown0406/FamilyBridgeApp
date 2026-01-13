-- Add policy to block anonymous/unauthenticated access to profiles
-- This ensures only authenticated users can read profile data

CREATE POLICY "Block anonymous access to profiles"
ON public.profiles
FOR SELECT
TO anon
USING (false);

-- Also add explicit policy for authenticated users if not already present
-- This ensures authenticated users can only see profiles of users they share a family with
-- or their own profile

DO $$
BEGIN
  -- Drop existing permissive SELECT policies if they allow too broad access
  DROP POLICY IF EXISTS "Users can read all profiles" ON public.profiles;
  DROP POLICY IF EXISTS "Anyone can read profiles" ON public.profiles;
  DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
  DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create restrictive policy for authenticated users
CREATE POLICY "Authenticated users can view profiles in their families"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  -- Users can always see their own profile
  id = auth.uid()
  OR
  -- Users can see profiles of people they share a family with
  public.shares_family_with(auth.uid(), id)
  OR
  -- Super admins can see all profiles
  public.is_super_admin(auth.uid())
  OR
  -- Organization members can see profiles of users in families their org manages
  EXISTS (
    SELECT 1 FROM public.organization_members om
    JOIN public.families f ON f.organization_id = om.organization_id
    JOIN public.family_members fm ON fm.family_id = f.id
    WHERE om.user_id = auth.uid()
    AND fm.user_id = profiles.id
  )
);