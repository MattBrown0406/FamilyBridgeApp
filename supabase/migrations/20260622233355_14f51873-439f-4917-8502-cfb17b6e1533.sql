CREATE TABLE IF NOT EXISTS public.spine_outbox (
  id          bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event_name  text        NOT NULL,
  payload     jsonb       NOT NULL DEFAULT '{}',
  status      text        NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'sent', 'failed')),
  attempts    int         NOT NULL DEFAULT 0,
  last_error  text,
  sent_at     timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS spine_outbox_pending_idx ON public.spine_outbox (status, created_at)
  WHERE status IN ('pending', 'failed');

GRANT ALL ON public.spine_outbox TO service_role;

ALTER TABLE public.spine_outbox ENABLE ROW LEVEL SECURITY;

SELECT cron.schedule(
  'fb-drain-spine-outbox',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url     := 'https://lljqptscpeamwfkzsezo.supabase.co/functions/v1/drain-spine-outbox',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || (
        SELECT decrypted_secret FROM vault.decrypted_secrets
        WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1
      )
    ),
    body    := jsonb_build_object('source', 'pg_cron')
  );
  $$
);