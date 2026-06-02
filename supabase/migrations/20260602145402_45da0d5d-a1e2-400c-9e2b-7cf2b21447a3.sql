INSERT INTO public.organization_members (organization_id, user_id, role)
SELECT '48bce09d-2f38-4651-b289-0cbc14910bf2', id, 'owner'
FROM auth.users
WHERE email = 'matt@freedominterventions.com'
ON CONFLICT (organization_id, user_id) DO NOTHING;

UPDATE public.families
SET organization_id = '48bce09d-2f38-4651-b289-0cbc14910bf2'
WHERE organization_id IS NULL
  AND id IN (
    SELECT DISTINCT family_id FROM public.family_members
    WHERE user_id = (SELECT id FROM auth.users WHERE email = 'matt@freedominterventions.com')
  );