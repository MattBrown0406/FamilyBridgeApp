-- Drop existing function first to allow signature change
DROP FUNCTION IF EXISTS public.get_activation_code_secure(uuid);

-- Remove the direct SELECT policy for super admins that bypasses audit trail
DROP POLICY IF EXISTS "activation_codes_select_super_admin" ON public.activation_codes;

-- Create a secure function that REQUIRES audit logging before returning data
-- This replaces direct table access with mandatory audit trail
CREATE OR REPLACE FUNCTION public.get_activation_code_secure(_code_id uuid)
RETURNS TABLE (
  id uuid,
  code text,
  is_used boolean,
  used_at timestamptz,
  used_by uuid,
  expires_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only super admins can access
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Super admin privileges required';
  END IF;
  
  -- Check rate limit (50 requests per 15 minutes for full code access)
  IF NOT public.check_super_admin_rate_limit('activation_code_full_access', 50, 15) THEN
    RAISE EXCEPTION 'Rate limit exceeded. Please wait before accessing more activation codes.';
  END IF;
  
  -- MANDATORY audit log entry BEFORE returning any data
  INSERT INTO public.activation_code_audit_log (
    activation_code_id,
    action,
    performed_by,
    performed_at,
    ip_address,
    details
  ) VALUES (
    _code_id,
    'secure_function_access',
    auth.uid()::text,
    now(),
    current_setting('request.headers', true)::json->>'x-forwarded-for',
    jsonb_build_object(
      'access_type', 'get_activation_code_secure',
      'session_id', current_setting('request.jwt.claims', true)::json->>'session_id',
      'timestamp', now()
    )
  );
  
  -- Return the data only after audit log is created
  RETURN QUERY
  SELECT 
    ac.id,
    ac.code,
    ac.is_used,
    ac.used_at,
    ac.used_by,
    ac.expires_at,
    ac.created_at,
    ac.updated_at
  FROM public.activation_codes ac
  WHERE ac.id = _code_id;
END;
$$;

-- Clean up old rate limit entries periodically
CREATE OR REPLACE FUNCTION public.cleanup_super_admin_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.super_admin_rate_limits
  WHERE window_start < now() - interval '1 hour';
END;
$$;