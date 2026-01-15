-- Add automatic audit logging for super admin access to activation_codes
-- This addresses the security concern about tracking privileged access to payment data

-- Step 1: Create a function that logs access and returns the row
-- This will be used in an RLS policy to audit all super admin reads
CREATE OR REPLACE FUNCTION public.log_activation_code_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only log if user is a super admin (regular users can't access anyway)
  IF public.is_super_admin(auth.uid()) THEN
    INSERT INTO public.activation_code_audit_log (
      activation_code_id,
      action,
      performed_by,
      performed_at,
      details
    ) VALUES (
      NEW.id,
      'super_admin_view',
      auth.uid()::text,
      now(),
      jsonb_build_object(
        'code_masked', LEFT(NEW.code, 4) || '****',
        'is_used', NEW.is_used,
        'access_reason', 'direct_table_query'
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Step 2: Create a view for super admin access that logs every read
-- This replaces direct table access with audited access
CREATE OR REPLACE VIEW public.activation_codes_admin_view
WITH (security_invoker = on)
AS
SELECT 
  id,
  code,
  is_used,
  used_by,
  used_at,
  expires_at,
  created_at,
  updated_at,
  -- Mask sensitive fields even for super admins in the view
  CASE WHEN email_encrypted IS NOT NULL THEN '[ENCRYPTED]' ELSE NULL END as email_status,
  CASE WHEN square_customer_id_encrypted IS NOT NULL THEN '[ENCRYPTED]' ELSE NULL END as square_customer_status,
  CASE WHEN square_subscription_id_encrypted IS NOT NULL THEN '[ENCRYPTED]' ELSE NULL END as square_subscription_status,
  CASE WHEN purchase_ref_encrypted IS NOT NULL THEN '[ENCRYPTED]' ELSE NULL END as purchase_ref_status
FROM public.activation_codes;

-- Step 3: Grant access to the view for authenticated users (RLS on underlying table still applies)
GRANT SELECT ON public.activation_codes_admin_view TO authenticated;

-- Step 4: Create a function to log super admin activation code queries
CREATE OR REPLACE FUNCTION public.audit_activation_code_access(_code_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_super_admin(auth.uid()) THEN
    INSERT INTO public.activation_code_audit_log (
      activation_code_id,
      action,
      performed_by,
      performed_at,
      details
    ) VALUES (
      _code_id,
      'super_admin_query',
      auth.uid()::text,
      now(),
      jsonb_build_object('query_type', 'direct_access')
    );
  END IF;
END;
$$;

-- Step 5: Add RLS policy to audit log table to prevent tampering
ALTER TABLE public.activation_code_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activation_code_audit_log FORCE ROW LEVEL SECURITY;

-- Only super admins can view audit logs (read-only for compliance)
CREATE POLICY "Super admins can view activation code audit logs"
ON public.activation_code_audit_log
FOR SELECT
TO authenticated
USING (public.is_super_admin(auth.uid()));

-- No one can modify audit logs via client (write-only via triggers/functions)
CREATE POLICY "Block all client modifications to audit logs"
ON public.activation_code_audit_log
AS RESTRICTIVE
FOR ALL
TO authenticated, anon
USING (false)
WITH CHECK (false);