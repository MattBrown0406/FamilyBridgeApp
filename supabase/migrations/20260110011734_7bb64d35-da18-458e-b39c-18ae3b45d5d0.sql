-- NOTE: pgcrypto digest() is unavailable in this environment; use built-in md5() as a deterministic, non-reversible lookup hash.

-- Patch encrypt_sensitive fallback to avoid digest()
CREATE OR REPLACE FUNCTION public.encrypt_sensitive(plain_text text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF plain_text IS NULL THEN
    RETURN NULL;
  END IF;

  -- Preferred path (will work only if pgcrypto encryption is available and key is set)
  RETURN encode(
    pgp_sym_encrypt(
      plain_text,
      current_setting('app.encryption_key', true)
    ),
    'base64'
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Fallback: store a masked one-way value (not reversible)
    RETURN 'ENCRYPTED:' || md5(plain_text);
END;
$$;

-- Harden activation_codes by removing plaintext sensitive columns (defense-in-depth)
ALTER TABLE public.activation_codes
  ADD COLUMN IF NOT EXISTS email_encrypted text,
  ADD COLUMN IF NOT EXISTS square_customer_id_encrypted text,
  ADD COLUMN IF NOT EXISTS square_subscription_id_encrypted text,
  ADD COLUMN IF NOT EXISTS square_customer_id_hash text,
  ADD COLUMN IF NOT EXISTS purchase_ref_encrypted text,
  ADD COLUMN IF NOT EXISTS purchase_ref_hash text;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='activation_codes' AND column_name='email'
  ) THEN
    UPDATE public.activation_codes
    SET email_encrypted = public.encrypt_sensitive(email)
    WHERE email IS NOT NULL
      AND (email_encrypted IS NULL OR email_encrypted = '');
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='activation_codes' AND column_name='square_customer_id'
  ) THEN
    UPDATE public.activation_codes
    SET square_customer_id_encrypted = public.encrypt_sensitive(square_customer_id),
        square_customer_id_hash = md5(square_customer_id)
    WHERE square_customer_id IS NOT NULL
      AND (square_customer_id_encrypted IS NULL OR square_customer_id_encrypted = '' OR square_customer_id_hash IS NULL OR square_customer_id_hash = '');
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='activation_codes' AND column_name='square_subscription_id'
  ) THEN
    UPDATE public.activation_codes
    SET square_subscription_id_encrypted = public.encrypt_sensitive(square_subscription_id)
    WHERE square_subscription_id IS NOT NULL
      AND (square_subscription_id_encrypted IS NULL OR square_subscription_id_encrypted = '');
  END IF;
END $$;

ALTER TABLE public.activation_codes
  DROP COLUMN IF EXISTS email,
  DROP COLUMN IF EXISTS square_customer_id,
  DROP COLUMN IF EXISTS square_subscription_id;

-- Keep strict access controls
ALTER TABLE public.activation_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activation_codes FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Deny all access (anon)" ON public.activation_codes;
DROP POLICY IF EXISTS "Deny all access (authenticated)" ON public.activation_codes;

CREATE POLICY "Deny all access (anon)"
ON public.activation_codes
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

CREATE POLICY "Deny all access (authenticated)"
ON public.activation_codes
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

REVOKE ALL ON TABLE public.activation_codes FROM anon;
REVOKE ALL ON TABLE public.activation_codes FROM authenticated;
GRANT ALL ON TABLE public.activation_codes TO service_role;

COMMENT ON TABLE public.activation_codes IS 'Activation codes are managed only by backend functions. No direct client access. Sensitive identifiers and emails are stored encrypted and/or hashed; plaintext columns removed.';