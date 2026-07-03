
-- 1) Family journey stage
ALTER TABLE public.families
  ADD COLUMN IF NOT EXISTS journey_stage TEXT
  CHECK (journey_stage IN ('considering', 'preparing', 'intervention', 'aftercare'));

-- 2) RPC to set journey stage
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

-- 3) Unschedule prior hourly escalation job (different name)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'check-moderator-escalations') THEN
    PERFORM cron.unschedule('check-moderator-escalations');
  END IF;
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'fb-check-escalations') THEN
    PERFORM cron.unschedule('fb-check-escalations');
  END IF;
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'fb-weekly-family-report') THEN
    PERFORM cron.unschedule('fb-weekly-family-report');
  END IF;
END $$;

-- 4) Schedule check-escalations every 15 minutes
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

-- 5) Weekly family report — Sundays 16:00 UTC
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
