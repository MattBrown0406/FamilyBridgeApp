ALTER TABLE public.native_push_tokens
  ADD COLUMN IF NOT EXISTS token_provider text NOT NULL DEFAULT 'fcm',
  ADD COLUMN IF NOT EXISTS environment text NOT NULL DEFAULT 'production';

ALTER TABLE public.native_push_tokens
  DROP CONSTRAINT IF EXISTS native_push_tokens_token_provider_check;
ALTER TABLE public.native_push_tokens
  ADD CONSTRAINT native_push_tokens_token_provider_check
  CHECK (token_provider IN ('apns', 'fcm'));

ALTER TABLE public.native_push_tokens
  DROP CONSTRAINT IF EXISTS native_push_tokens_environment_check;
ALTER TABLE public.native_push_tokens
  ADD CONSTRAINT native_push_tokens_environment_check
  CHECK (environment IN ('sandbox', 'production'));

CREATE INDEX IF NOT EXISTS idx_native_push_tokens_apns_enabled
  ON public.native_push_tokens (user_id, environment)
  WHERE enabled = true AND platform = 'ios' AND token_provider = 'apns';
