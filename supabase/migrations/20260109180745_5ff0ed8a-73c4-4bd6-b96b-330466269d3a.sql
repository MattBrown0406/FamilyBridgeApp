-- Address overly-permissive INSERT policies flagged by the linter

-- 1) Organizations: require authenticated user to set themselves as creator
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON public.organizations;

CREATE POLICY "Authenticated users can create organizations"
ON public.organizations
FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid()
);

-- 2) Premium waitlist: keep public signup, but require a minimally valid email value
DROP POLICY IF EXISTS "Anyone can join the waitlist" ON public.premium_waitlist;

CREATE POLICY "Anyone can join the waitlist"
ON public.premium_waitlist
FOR INSERT
TO public
WITH CHECK (
  email IS NOT NULL
  AND length(email) BETWEEN 3 AND 320
  AND position('@' in email) > 1
);
