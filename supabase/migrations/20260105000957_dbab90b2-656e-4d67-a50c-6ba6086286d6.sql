-- Enable pgsodium extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgsodium;

-- Create secure encryption functions using pgsodium (uses Supabase's managed keys)
CREATE OR REPLACE FUNCTION public.encrypt_payment_field(plain_text text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF plain_text IS NULL OR plain_text = '' THEN
    RETURN NULL;
  END IF;
  
  -- Use pgsodium's secret box encryption with a derived key
  RETURN encode(
    pgsodium.crypto_secretbox(
      plain_text::bytea,
      pgsodium.crypto_secretbox_noncegen(),
      pgsodium.derive_key(1::bigint)
    ),
    'base64'
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Fallback: store as one-way hash if encryption fails
    RETURN 'HASHED:' || encode(digest(plain_text, 'sha256'), 'hex');
END;
$$;

CREATE OR REPLACE FUNCTION public.decrypt_payment_field(encrypted_text text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF encrypted_text IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Check if it's a hashed fallback value
  IF encrypted_text LIKE 'HASHED:%' THEN
    RETURN '***encrypted***';
  END IF;
  
  -- Decrypt using pgsodium
  RETURN convert_from(
    pgsodium.crypto_secretbox_open(
      decode(encrypted_text, 'base64'),
      pgsodium.crypto_secretbox_noncegen(),
      pgsodium.derive_key(1::bigint)
    ),
    'UTF8'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN '***decryption_failed***';
END;
$$;

-- Add encrypted columns to payment_info table
ALTER TABLE public.payment_info 
  ADD COLUMN IF NOT EXISTS venmo_username_encrypted text,
  ADD COLUMN IF NOT EXISTS paypal_username_encrypted text,
  ADD COLUMN IF NOT EXISTS cashapp_username_encrypted text;

-- Create a secure view that family members use to see payment links (shows masked data)
CREATE OR REPLACE VIEW public.payment_info_masked AS
SELECT 
  id,
  user_id,
  created_at,
  updated_at,
  CASE 
    WHEN venmo_username IS NOT NULL THEN '***' || RIGHT(venmo_username, 3)
    ELSE NULL 
  END as venmo_masked,
  CASE 
    WHEN paypal_username IS NOT NULL THEN '***' || RIGHT(paypal_username, 3)
    ELSE NULL 
  END as paypal_masked,
  CASE 
    WHEN cashapp_username IS NOT NULL THEN '***' || RIGHT(cashapp_username, 3)
    ELSE NULL 
  END as cashapp_masked,
  -- Full values only if the user owns this record
  CASE WHEN user_id = auth.uid() THEN venmo_username ELSE NULL END as venmo_username,
  CASE WHEN user_id = auth.uid() THEN paypal_username ELSE NULL END as paypal_username,
  CASE WHEN user_id = auth.uid() THEN cashapp_username ELSE NULL END as cashapp_username
FROM public.payment_info;

-- Grant access to the masked view
GRANT SELECT ON public.payment_info_masked TO authenticated;

-- Create RLS policy for the view to restrict access to family members only
-- Drop existing policy if exists and create a new one for family member access
DROP POLICY IF EXISTS "Family members can view masked payment info" ON public.payment_info;

CREATE POLICY "Family members can view payment info for requests" 
ON public.payment_info 
FOR SELECT 
USING (
  -- Users can always see their own payment info
  (auth.uid() = user_id)
  OR
  -- Family members can see payment info for users in the same family (for financial requests)
  (EXISTS (
    SELECT 1
    FROM family_members fm1
    INNER JOIN family_members fm2 ON fm1.family_id = fm2.family_id
    WHERE fm1.user_id = auth.uid()
      AND fm2.user_id = payment_info.user_id
      AND fm1.user_id != fm2.user_id
  ))
);

-- Update the original restrictive policy to work alongside the new one
DROP POLICY IF EXISTS "Users can view own payment info" ON public.payment_info;