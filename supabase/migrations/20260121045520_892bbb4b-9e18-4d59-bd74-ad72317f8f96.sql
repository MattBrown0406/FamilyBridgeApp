-- Ensure any legacy unencrypted signature_data values are cleared
-- and prevent future unencrypted storage by setting a constraint
UPDATE public.hipaa_releases 
SET signature_data = '[ENCRYPTED]' 
WHERE signature_data IS NOT NULL 
  AND signature_data != '[ENCRYPTED]'
  AND signature_data NOT LIKE 'ENCRYPTED:%';

-- Add a check constraint to ensure signature_data column only stores the placeholder
-- This prevents any code from accidentally storing unencrypted signatures
ALTER TABLE public.hipaa_releases
ADD CONSTRAINT signature_data_must_be_placeholder 
CHECK (signature_data IS NULL OR signature_data = '[ENCRYPTED]');

-- Add a comment documenting the encryption requirement
COMMENT ON COLUMN public.hipaa_releases.signature_data IS 'DEPRECATED: Legacy column. All signatures must use signature_data_encrypted. This column only stores placeholder [ENCRYPTED].';
COMMENT ON COLUMN public.hipaa_releases.signature_data_encrypted IS 'Encrypted signature data using pgp_sym_encrypt. Decrypt only via get_hipaa_signature() RPC which is restricted to super admins and audited.';