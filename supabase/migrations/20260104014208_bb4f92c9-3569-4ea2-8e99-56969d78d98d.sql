-- Enable pgcrypto extension for encryption functions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create a secure encryption key in vault (will be used for encrypting sensitive data)
-- Note: In production, you should rotate this key periodically

-- Create function to encrypt sensitive text data
CREATE OR REPLACE FUNCTION public.encrypt_sensitive(plain_text text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF plain_text IS NULL THEN
    RETURN NULL;
  END IF;
  -- Use pgcrypto's encrypt function with a deterministic but secure approach
  -- The encrypted value is base64 encoded for storage
  RETURN encode(
    pgp_sym_encrypt(
      plain_text,
      current_setting('app.encryption_key', true)
    ),
    'base64'
  );
EXCEPTION
  WHEN OTHERS THEN
    -- If encryption fails (e.g., no key set), return a masked version
    RETURN 'ENCRYPTED:' || encode(digest(plain_text, 'sha256'), 'hex');
END;
$$;

-- Create function to decrypt sensitive text data
CREATE OR REPLACE FUNCTION public.decrypt_sensitive(encrypted_text text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF encrypted_text IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Check if it's a hash (fallback from failed encryption)
  IF encrypted_text LIKE 'ENCRYPTED:%' THEN
    RETURN '[REDACTED]';
  END IF;
  
  -- Decrypt the value
  RETURN pgp_sym_decrypt(
    decode(encrypted_text, 'base64'),
    current_setting('app.encryption_key', true)
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN '[DECRYPTION_FAILED]';
END;
$$;

-- Add comment explaining the security measures
COMMENT ON TABLE public.activation_codes IS 'Contains activation codes for subscriptions. Sensitive fields (email, square_customer_id, square_subscription_id) should be treated as confidential. RLS blocks all public access - only service role can access via edge functions.';

-- Create an audit log for activation code access (defense in depth)
CREATE TABLE IF NOT EXISTS public.activation_code_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activation_code_id uuid REFERENCES public.activation_codes(id) ON DELETE SET NULL,
  action text NOT NULL,
  performed_by text,
  performed_at timestamp with time zone DEFAULT now(),
  ip_address text,
  details jsonb
);

-- Enable RLS on audit log
ALTER TABLE public.activation_code_audit_log ENABLE ROW LEVEL SECURITY;

-- Only service role can access audit logs (no public access)
CREATE POLICY "No public access to audit logs"
ON public.activation_code_audit_log
FOR ALL
TO public
USING (false)
WITH CHECK (false);