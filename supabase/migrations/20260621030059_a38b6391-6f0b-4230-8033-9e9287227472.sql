ALTER TABLE public.native_push_tokens
  ADD COLUMN IF NOT EXISTS token_provider text NOT NULL DEFAULT 'fcm',
  ADD COLUMN IF NOT EXISTS environment text NOT NULL DEFAULT 'production';

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'native_push_tokens_token_provider_check') THEN
    ALTER TABLE public.native_push_tokens
      ADD CONSTRAINT native_push_tokens_token_provider_check CHECK (token_provider IN ('apns','fcm'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'native_push_tokens_environment_check') THEN
    ALTER TABLE public.native_push_tokens
      ADD CONSTRAINT native_push_tokens_environment_check CHECK (environment IN ('sandbox','production'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_native_push_tokens_apns_enabled
  ON public.native_push_tokens (user_id)
  WHERE enabled = true AND platform = 'ios' AND token_provider = 'apns';