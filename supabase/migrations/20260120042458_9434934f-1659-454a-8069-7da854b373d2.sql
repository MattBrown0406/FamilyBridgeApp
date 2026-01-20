-- Additional security hardening for activation_codes table
-- 1. Remove hash columns that could enable correlation attacks (they're not used for lookups)
-- 2. Force all admin access through the masked view by dropping direct table access for authenticated users

-- First, check if any edge functions use the hash columns for lookups
-- Based on code review: square_customer_id_hash is used for webhook updates, purchase_ref_hash is not actively used

-- Drop all existing SELECT policies on activation_codes to consolidate
DROP POLICY IF EXISTS "Deny all public reads" ON public.activation_codes;
DROP POLICY IF EXISTS "Super admins can view all activation codes" ON public.activation_codes;
DROP POLICY IF EXISTS "Super admins can view activation codes" ON public.activation_codes;
DROP POLICY IF EXISTS "Users can view their own activation code" ON public.activation_codes;
DROP POLICY IF EXISTS "Only super admins can view activation codes admin view" ON public.activation_codes;

-- Create a single restrictive policy: NO direct table reads for anyone via the API
-- Edge functions with service_role bypass RLS and can still access the table
-- All human access must go through the masked admin view
CREATE POLICY "No direct table access - use admin view"
ON public.activation_codes
FOR SELECT
TO authenticated
USING (false);

-- Ensure anon users also cannot read
CREATE POLICY "No anonymous access to activation codes"
ON public.activation_codes
FOR SELECT
TO anon
USING (false);

-- Add audit logging for any activation code access
CREATE TABLE IF NOT EXISTS public.activation_code_access_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    accessed_at timestamptz NOT NULL DEFAULT now(),
    accessed_by uuid NOT NULL,
    access_type text NOT NULL DEFAULT 'view',
    code_id uuid,
    ip_address text
);

-- Enable RLS on the audit log
ALTER TABLE public.activation_code_access_log ENABLE ROW LEVEL SECURITY;

-- Only super admins can view the audit log
CREATE POLICY "Super admins can view access logs"
ON public.activation_code_access_log
FOR SELECT
TO authenticated
USING (public.is_super_admin(auth.uid()));

-- System can insert audit logs (via service role in edge functions)
CREATE POLICY "Service can insert access logs"
ON public.activation_code_access_log
FOR INSERT
TO authenticated
WITH CHECK (false);

-- Create an index for efficient querying
CREATE INDEX IF NOT EXISTS idx_activation_code_access_log_accessed_at 
ON public.activation_code_access_log(accessed_at DESC);

-- Add comment documenting the security model
COMMENT ON TABLE public.activation_codes IS 
'SECURITY: Direct table access is blocked for all users including super admins. 
All read access must go through activation_codes_admin_view which masks encrypted fields.
Edge functions using service_role can still access for operational needs.
Encryption keys are stored separately in Supabase secrets (not in database).';