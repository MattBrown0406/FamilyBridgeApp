-- Ensure profiles is not publicly readable via grants
REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.profiles FROM public;

-- Ensure RLS is enabled and forced
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;

-- Drop any existing SELECT policies to avoid overlaps
DROP POLICY IF EXISTS "Users can view profiles in same family or org" ON public.profiles;
DROP POLICY IF EXISTS "Users can view related profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

-- Tighten: only self, same-family members, or super admins
CREATE POLICY "Profiles visible to self or same family"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = id
  OR public.is_in_same_family(auth.uid(), id)
  OR public.is_super_admin(auth.uid())
);

COMMENT ON POLICY "Profiles visible to self or same family" ON public.profiles IS 'Limits profile visibility to self, members of the same family, or super admins; denies broad org-wide scraping.';