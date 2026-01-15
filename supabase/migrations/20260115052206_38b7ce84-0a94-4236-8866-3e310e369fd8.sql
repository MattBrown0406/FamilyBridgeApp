-- Drop the existing function first (return type changed)
DROP FUNCTION IF EXISTS public.get_user_activation_status();

-- Create a more secure function that only returns status info (no encrypted data)
CREATE OR REPLACE FUNCTION public.get_user_activation_status()
RETURNS TABLE(
  code_exists boolean,
  is_used boolean,
  used_at timestamp with time zone,
  expires_at timestamp with time zone,
  is_expired boolean,
  code_masked text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    true as code_exists,
    ac.is_used,
    ac.used_at,
    ac.expires_at,
    (ac.expires_at IS NOT NULL AND ac.expires_at < now()) as is_expired,
    -- Only show first 4 chars of code for identification, rest masked
    LEFT(ac.code, 4) || '-****-****' as code_masked
  FROM public.activation_codes ac
  WHERE ac.used_by = auth.uid()
  LIMIT 1;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_activation_status() TO authenticated;

-- Add comment explaining security design
COMMENT ON FUNCTION public.get_user_activation_status() IS 
'Secure function to retrieve activation code status without exposing encrypted payment data. 
Users should use this function instead of querying the activation_codes table directly.';