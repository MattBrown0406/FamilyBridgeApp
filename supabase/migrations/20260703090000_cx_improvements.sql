-- CX improvements (3.1-3.3): family journey stage, tiered escalation cadence,
-- and the weekly family report cron.

-- ============================================================
-- 1) Family journey stage (3.1 stage-based onboarding)
-- ============================================================
ALTER TABLE public.families
  ADD COLUMN IF NOT EXISTS journey_stage TEXT
  CHECK (journey_stage IN ('considering', 'preparing', 'intervention', 'aftercare'));

COMMENT ON COLUMN public.families.journey_stage IS
  'Where the family is in the intervention journey. NULL = not yet chosen (stage picker shown).';

-- Any family member may set their family''s stage. families UPDATE is otherwise
-- restricted to admins/moderators, so expose a SECURITY DEFINER RPC that
-- enforces membership itself.
CREATE OR REPLACE FUNCTION public.set_family_journey_stage(_family_id uuid, _stage text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _stage NOT IN ('considering', 'preparing', 'intervention', 'aftercare') THEN
    RAISE EXCEPTION 'Invalid journey stage: %', _stage;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.family_members
    WHERE family_id = _family_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not a member of this family';
  END IF;

  UPDATE public.families
  SET journey_stage = _stage, updated_at = now()
  WHERE id = _family_id;
END;
$$;

REVOKE ALL ON FUNCTION public.set_family_journey_stage(uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION public.set_family_journey_stage(uuid, text) TO authenticated;

-- ============================================================
-- 2) Tiered escalation cadence (3.2)
-- Run check-escalations every 15 minutes so crisis alerts are near-immediate.
-- The function itself enforces per-status thresholds (crisis: immediate,
-- concern: 24h, tension: 72h) and re-alert windows, so frequent runs are safe.
-- NOTE: if check-escalations was previously scheduled from the Supabase
-- dashboard under a different job name, remove that job to avoid double runs.
-- ============================================================
SELECT cron.schedule(
  'fb-check-escalations',
  '*/15 * * * *',
  $cron$
  SELECT net.http_post(
    url     := 'https://lljqptscpeamwfkzsezo.supabase.co/functions/v1/check-escalations',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || (
        SELECT decrypted_secret FROM vault.decrypted_secrets
        WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1
      )
    ),
    body    := jsonb_build_object('source', 'pg_cron')
  );
  $cron$
);

-- ============================================================
-- 3) Weekly family report (3.3) — Sundays 16:00 UTC (~9am Pacific)
-- ============================================================
SELECT cron.schedule(
  'fb-weekly-family-report',
  '0 16 * * 0',
  $cron$
  SELECT net.http_post(
    url     := 'https://lljqptscpeamwfkzsezo.supabase.co/functions/v1/weekly-family-report',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || (
        SELECT decrypted_secret FROM vault.decrypted_secrets
        WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1
      )
    ),
    body    := jsonb_build_object('source', 'pg_cron')
  );
  $cron$
);
