-- Drop the policy that exposes encrypted data
DROP POLICY IF EXISTS "Users can view their own used activation codes" ON public.activation_codes;

-- Create a security definer function that returns only safe, non-sensitive data
CREATE OR REPLACE FUNCTION public.get_user_activation_code_status()
RETURNS TABLE (
  code_used boolean,
  used_at timestamptz,
  expires_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    is_used,
    used_at,
    expires_at
  FROM public.activation_codes
  WHERE used_by = auth.uid()
  LIMIT 1;
$$;

-- Add comment explaining security model
COMMENT ON TABLE public.activation_codes IS 'Activation codes with encrypted PII - no direct client access allowed. Use get_user_activation_code_status() for safe access.';
COMMENT ON FUNCTION public.get_user_activation_code_status IS 'Returns only non-sensitive activation code status for the current user';