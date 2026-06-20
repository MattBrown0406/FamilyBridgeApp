
CREATE TABLE IF NOT EXISTS public.super_admins (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  granted_at timestamptz NOT NULL DEFAULT now(),
  granted_by uuid,
  notes text
);

GRANT SELECT ON public.super_admins TO authenticated;
GRANT ALL ON public.super_admins TO service_role;

ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins can view themselves" ON public.super_admins;
CREATE POLICY "Super admins can view themselves"
  ON public.super_admins
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- No INSERT/UPDATE/DELETE policies: only service_role can modify.

-- Seed existing super admin(s) from legacy 'Freedom Interventions' owners
INSERT INTO public.super_admins (user_id, notes)
SELECT om.user_id, 'Migrated from Freedom Interventions org owner'
FROM public.organization_members om
JOIN public.organizations o ON o.id = om.organization_id
WHERE om.role = 'owner' AND o.name = 'Freedom Interventions'
ON CONFLICT (user_id) DO NOTHING;

-- Replace is_super_admin to use the dedicated table
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.super_admins WHERE user_id = _user_id
  )
$function$;
