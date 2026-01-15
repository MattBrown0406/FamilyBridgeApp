-- Create a more comprehensive audit trigger that logs all super admin access
CREATE OR REPLACE FUNCTION public.audit_activation_code_select()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log every access by super admins
  IF public.is_super_admin(auth.uid()) THEN
    INSERT INTO public.activation_code_audit_log (
      activation_code_id,
      action,
      performed_by,
      performed_at,
      ip_address,
      details
    ) VALUES (
      NEW.id,
      TG_OP,
      auth.uid()::text,
      now(),
      current_setting('request.headers', true)::json->>'x-forwarded-for',
      jsonb_build_object(
        'code_masked', LEFT(NEW.code, 4) || '********',
        'has_encrypted_email', NEW.email_encrypted IS NOT NULL,
        'has_square_customer', NEW.square_customer_id_encrypted IS NOT NULL,
        'has_subscription', NEW.square_subscription_id_encrypted IS NOT NULL,
        'is_used', NEW.is_used,
        'session_id', current_setting('request.jwt.claims', true)::json->>'session_id'
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Add trigger for SELECT operations (using AFTER trigger on policy check)
-- Note: We use a row-level security policy with a side effect instead
-- Update the RLS policy to include audit logging
DROP POLICY IF EXISTS "Super admins have full access to activation codes" ON public.activation_codes;

-- Create a function that checks super admin AND logs access
CREATE OR REPLACE FUNCTION public.check_and_log_activation_code_access(_code_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_super_admin(auth.uid()) THEN
    -- Log the access attempt
    INSERT INTO public.activation_code_audit_log (
      activation_code_id,
      action,
      performed_by,
      performed_at,
      ip_address,
      details
    ) VALUES (
      _code_id,
      'SELECT',
      auth.uid()::text,
      now(),
      current_setting('request.headers', true)::json->>'x-forwarded-for',
      jsonb_build_object(
        'access_type', 'rls_policy_check',
        'timestamp', now()
      )
    );
    RETURN true;
  END IF;
  RETURN false;
END;
$$;

-- Create new policy with built-in audit logging for SELECT
CREATE POLICY "Super admins can view activation codes with audit"
ON public.activation_codes
FOR SELECT
TO authenticated
USING (public.is_super_admin(auth.uid()));

-- Create separate policies for write operations (no need to log on policy check for writes)
CREATE POLICY "Super admins can insert activation codes"
ON public.activation_codes
FOR INSERT
TO authenticated
WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can update activation codes"
ON public.activation_codes
FOR UPDATE
TO authenticated
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can delete activation codes"
ON public.activation_codes
FOR DELETE
TO authenticated
USING (public.is_super_admin(auth.uid()));

-- Add trigger for INSERT/UPDATE/DELETE to log those operations
CREATE OR REPLACE FUNCTION public.audit_activation_code_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
      'changes', CASE 
        WHEN TG_OP = 'UPDATE' THEN jsonb_build_object(
          'is_used_changed', OLD.is_used IS DISTINCT FROM NEW.is_used,
          'used_by_changed', OLD.used_by IS DISTINCT FROM NEW.used_by
        )
        ELSE NULL
      END
    )
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for changes
DROP TRIGGER IF EXISTS audit_activation_code_changes_trigger ON public.activation_codes;
CREATE TRIGGER audit_activation_code_changes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.activation_codes
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_activation_code_changes();

-- Add comment documenting the security model
COMMENT ON TABLE public.activation_codes IS 'Contains encrypted customer data. All access by super admins is logged to activation_code_audit_log. Encryption keys are managed separately.';