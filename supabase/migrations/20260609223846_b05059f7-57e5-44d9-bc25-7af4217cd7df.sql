CREATE TABLE public.native_push_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('ios','android')),
  token text NOT NULL,
  device_id text,
  app_version text,
  enabled boolean NOT NULL DEFAULT true,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, platform, token)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.native_push_tokens TO authenticated;
GRANT ALL ON public.native_push_tokens TO service_role;

ALTER TABLE public.native_push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users select own native tokens"
  ON public.native_push_tokens FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own native tokens"
  ON public.native_push_tokens FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own native tokens"
  ON public.native_push_tokens FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own native tokens"
  ON public.native_push_tokens FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_native_push_tokens_user_enabled
  ON public.native_push_tokens (user_id) WHERE enabled = true;

CREATE OR REPLACE FUNCTION public.update_native_push_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_native_push_tokens_updated_at
  BEFORE UPDATE ON public.native_push_tokens
  FOR EACH ROW EXECUTE FUNCTION public.update_native_push_tokens_updated_at();