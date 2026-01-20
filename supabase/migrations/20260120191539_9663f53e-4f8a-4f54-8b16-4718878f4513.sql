-- =====================================================
-- CONSOLIDATE activation_codes RLS POLICIES
-- Currently 19 overlapping policies - consolidating to 4 clean policies
-- =====================================================

-- Drop ALL existing policies on activation_codes table
DROP POLICY IF EXISTS "Block anonymous SELECT access" ON public.activation_codes;
DROP POLICY IF EXISTS "Block authenticated non-admin SELECT" ON public.activation_codes;
DROP POLICY IF EXISTS "Deny all DELETE access" ON public.activation_codes;
DROP POLICY IF EXISTS "Deny all INSERT access" ON public.activation_codes;
DROP POLICY IF EXISTS "Deny all UPDATE access" ON public.activation_codes;
DROP POLICY IF EXISTS "No anonymous access to activation codes" ON public.activation_codes;
DROP POLICY IF EXISTS "Only super admins can delete activation codes" ON public.activation_codes;
DROP POLICY IF EXISTS "Only super admins can insert activation codes" ON public.activation_codes;
DROP POLICY IF EXISTS "Only super admins can update activation codes" ON public.activation_codes;
DROP POLICY IF EXISTS "Only super admins can view activation codes" ON public.activation_codes;
DROP POLICY IF EXISTS "Super admins can delete activation codes" ON public.activation_codes;
DROP POLICY IF EXISTS "Super admins can insert activation codes" ON public.activation_codes;
DROP POLICY IF EXISTS "Super admins can read via view" ON public.activation_codes;
DROP POLICY IF EXISTS "Super admins can update activation codes" ON public.activation_codes;
DROP POLICY IF EXISTS "activation_codes_deny_anon" ON public.activation_codes;
DROP POLICY IF EXISTS "activation_codes_super_admin_delete" ON public.activation_codes;
DROP POLICY IF EXISTS "activation_codes_super_admin_insert" ON public.activation_codes;
DROP POLICY IF EXISTS "activation_codes_super_admin_select" ON public.activation_codes;
DROP POLICY IF EXISTS "activation_codes_super_admin_update" ON public.activation_codes;

-- Create 4 consolidated policies - super admin only access
-- SELECT: Only super admins can view activation codes
CREATE POLICY "activation_codes_select_super_admin"
ON public.activation_codes
FOR SELECT
TO authenticated
USING (public.is_super_admin(auth.uid()));

-- INSERT: Only super admins can create activation codes
CREATE POLICY "activation_codes_insert_super_admin"
ON public.activation_codes
FOR INSERT
TO authenticated
WITH CHECK (public.is_super_admin(auth.uid()));

-- UPDATE: Only super admins can modify activation codes
CREATE POLICY "activation_codes_update_super_admin"
ON public.activation_codes
FOR UPDATE
TO authenticated
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));

-- DELETE: Only super admins can delete activation codes
CREATE POLICY "activation_codes_delete_super_admin"
ON public.activation_codes
FOR DELETE
TO authenticated
USING (public.is_super_admin(auth.uid()));

-- Add comment documenting the security model
COMMENT ON TABLE public.activation_codes IS 'Stores activation codes for family subscriptions. Contains encrypted payment data (Square customer IDs, subscription IDs). Access restricted to super admins only via RLS. All sensitive fields use pgcrypto encryption. Direct table access blocked; use activation_codes_admin_view for masked access.';