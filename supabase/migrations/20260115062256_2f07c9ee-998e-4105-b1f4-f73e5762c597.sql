-- Ensure RLS is enabled and forced on activation_codes
ALTER TABLE public.activation_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activation_codes FORCE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Super admins have full access to activation codes" ON public.activation_codes;
DROP POLICY IF EXISTS "Super admins can view activation codes with audit" ON public.activation_codes;
DROP POLICY IF EXISTS "Super admins can insert activation codes" ON public.activation_codes;
DROP POLICY IF EXISTS "Super admins can update activation codes" ON public.activation_codes;
DROP POLICY IF EXISTS "Super admins can delete activation codes" ON public.activation_codes;
DROP POLICY IF EXISTS "Block anon access to activation_codes" ON public.activation_codes;
DROP POLICY IF EXISTS "Only super admins can view activation codes" ON public.activation_codes;

-- Create comprehensive policies for super admin only access
CREATE POLICY "activation_codes_super_admin_select"
ON public.activation_codes
FOR SELECT
TO authenticated
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "activation_codes_super_admin_insert"
ON public.activation_codes
FOR INSERT
TO authenticated
WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "activation_codes_super_admin_update"
ON public.activation_codes
FOR UPDATE
TO authenticated
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "activation_codes_super_admin_delete"
ON public.activation_codes
FOR DELETE
TO authenticated
USING (public.is_super_admin(auth.uid()));

-- Explicitly deny anonymous access
CREATE POLICY "activation_codes_deny_anon"
ON public.activation_codes
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Revoke any direct grants that might bypass RLS
REVOKE ALL ON public.activation_codes FROM anon;
REVOKE ALL ON public.activation_codes FROM public;