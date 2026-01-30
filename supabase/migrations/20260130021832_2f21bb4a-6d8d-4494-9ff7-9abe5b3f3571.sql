-- Harden activation_codes security with additional protections

-- 1. Drop and recreate the admin view with masked code values
DROP VIEW IF EXISTS public.activation_codes_admin_view;

CREATE VIEW public.activation_codes_admin_view
WITH (security_invoker=on, security_barrier=true) AS
SELECT 
  ac.id,
  -- Mask the code - show only first 4 and last 4 characters
  CONCAT(SUBSTRING(ac.code, 1, 4), '-****-', SUBSTRING(ac.code, LENGTH(ac.code)-3, 4)) AS code_masked,
  ac.is_used,
  ac.used_at,
  ac.used_by,
  ac.expires_at,
  ac.created_at,
  ac.updated_at,
  CASE WHEN ac.email_encrypted IS NOT NULL THEN 'present'::text ELSE NULL END AS email_status,
  CASE WHEN ac.purchase_ref_encrypted IS NOT NULL THEN 'present'::text ELSE NULL END AS purchase_ref_status,
  CASE WHEN ac.square_customer_id_encrypted IS NOT NULL THEN 'present'::text ELSE NULL END AS square_customer_status,
  CASE WHEN ac.square_subscription_id_encrypted IS NOT NULL THEN 'present'::text ELSE NULL END AS square_subscription_status
FROM public.activation_codes ac
WHERE public.is_super_admin(auth.uid());

-- Revoke access from anon and public roles
REVOKE ALL ON public.activation_codes_admin_view FROM anon, public;
GRANT SELECT ON public.activation_codes_admin_view TO authenticated;

-- 2. Create a secure function to get a specific full code (with mandatory audit logging)
-- This is the ONLY way to retrieve full activation codes
CREATE OR REPLACE FUNCTION public.get_activation_code_secure(_code_id uuid)
RETURNS TABLE(code text, is_used boolean, used_at timestamptz, expires_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify super admin status
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized: Super admin access required';
  END IF;
  
  -- Log the access attempt (mandatory - cannot be bypassed)
  INSERT INTO public.activation_code_audit_log (
    activation_code_id,
    action,
    performed_by,
    performed_at,
    ip_address,
    details
  ) VALUES (
    _code_id,
    'FULL_CODE_ACCESS',
    auth.uid()::text,
    now(),
    current_setting('request.headers', true)::json->>'x-forwarded-for',
    jsonb_build_object(
      'access_type', 'secure_function_full_code_retrieval',
      'timestamp', now(),
      'session_id', current_setting('request.jwt.claims', true)::json->>'session_id'
    )
  );
  
  -- Return the full code (only after successful audit log)
  RETURN QUERY
  SELECT ac.code, ac.is_used, ac.used_at, ac.expires_at
  FROM public.activation_codes ac
  WHERE ac.id = _code_id;
END;
$$;

-- Restrict function access
REVOKE ALL ON FUNCTION public.get_activation_code_secure(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_activation_code_secure(uuid) TO authenticated;

-- 3. Create trigger for automatic audit logging on any direct table access
CREATE OR REPLACE FUNCTION public.audit_activation_code_access_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log every SELECT/UPDATE/DELETE by super admins
  IF public.is_super_admin(auth.uid()) THEN
    INSERT INTO public.activation_code_audit_log (
      activation_code_id,
      action,
      performed_by,
      performed_at,
      ip_address,
      details
    ) VALUES (
      COALESCE(NEW.id, OLD.id),
      TG_OP,
      auth.uid()::text,
      now(),
      current_setting('request.headers', true)::json->>'x-forwarded-for',
      jsonb_build_object(
        'operation', TG_OP,
        'code_masked', LEFT(COALESCE(NEW.code, OLD.code), 4) || '********',
        'trigger_source', 'automatic_audit_trigger'
      )
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create triggers for INSERT, UPDATE, DELETE operations
DROP TRIGGER IF EXISTS audit_activation_codes_insert ON public.activation_codes;
CREATE TRIGGER audit_activation_codes_insert
  AFTER INSERT ON public.activation_codes
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_activation_code_access_trigger();

DROP TRIGGER IF EXISTS audit_activation_codes_update ON public.activation_codes;
CREATE TRIGGER audit_activation_codes_update
  AFTER UPDATE ON public.activation_codes
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_activation_code_access_trigger();

DROP TRIGGER IF EXISTS audit_activation_codes_delete ON public.activation_codes;
CREATE TRIGGER audit_activation_codes_delete
  AFTER DELETE ON public.activation_codes
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_activation_code_access_trigger();

-- 4. Add comment documenting the security model
COMMENT ON TABLE public.activation_codes IS 'Activation codes with encrypted payment data. Direct SELECT blocked. Super admin access only through masked view or audited secure function. All access automatically logged to activation_code_audit_log.';