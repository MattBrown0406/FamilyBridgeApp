-- 1) Add server-side rate limit table (service-only)
CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  key text NOT NULL,
  window_start timestamptz NOT NULL,
  count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, key, window_start)
);

ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_rate_limits FORCE ROW LEVEL SECURITY;

-- deny all direct access from clients; backend functions use service role.
DROP POLICY IF EXISTS "No access" ON public.api_rate_limits;
CREATE POLICY "No access"
ON public.api_rate_limits
FOR ALL
TO public
USING (false)
WITH CHECK (false);

-- Ensure updated_at trigger function exists (use different dollar quote to avoid nesting issues)
DO $do$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_proc
    WHERE proname = 'update_updated_at_column'
      AND pronamespace = 'public'::regnamespace
  ) THEN
    CREATE OR REPLACE FUNCTION public.update_updated_at_column()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    SET search_path = public
    AS $fn$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $fn$;
  END IF;
END
$do$;

DROP TRIGGER IF EXISTS update_api_rate_limits_updated_at ON public.api_rate_limits;
CREATE TRIGGER update_api_rate_limits_updated_at
BEFORE UPDATE ON public.api_rate_limits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Tighten profiles SELECT policy to necessary contexts
DROP POLICY IF EXISTS "Users can view profiles they have access to" ON public.profiles;

CREATE POLICY "Profiles visible to related users"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = id
  OR is_super_admin(auth.uid())
  -- direct family member (same family)
  OR EXISTS (
    SELECT 1
    FROM public.family_members fm_me
    JOIN public.family_members fm_them
      ON fm_me.family_id = fm_them.family_id
    WHERE fm_me.user_id = auth.uid()
      AND fm_them.user_id = profiles.id
  )
  -- org colleague (both are organization members of same org)
  OR EXISTS (
    SELECT 1
    FROM public.organization_members om_me
    JOIN public.organization_members om_them
      ON om_me.organization_id = om_them.organization_id
    WHERE om_me.user_id = auth.uid()
      AND om_them.user_id = profiles.id
  )
  -- active temporary moderator assigned to a family containing the target user
  OR EXISTS (
    SELECT 1
    FROM public.temporary_moderator_requests tmr
    JOIN public.family_members fm
      ON fm.family_id = tmr.family_id
    WHERE tmr.assigned_moderator_id = auth.uid()
      AND tmr.status = 'active'
      AND tmr.expires_at > now()
      AND fm.user_id = profiles.id
  )
  -- active paid moderator assigned to a family containing the target user
  OR EXISTS (
    SELECT 1
    FROM public.paid_moderator_requests pmr
    JOIN public.family_members fm
      ON fm.family_id = pmr.family_id
    WHERE pmr.assigned_moderator_id = auth.uid()
      AND pmr.status = 'active'
      AND (pmr.expires_at IS NULL OR pmr.expires_at > now())
      AND fm.user_id = profiles.id
  )
);
