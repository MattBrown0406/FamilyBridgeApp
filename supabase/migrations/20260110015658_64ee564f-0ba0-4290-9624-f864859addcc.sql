-- Fix activation_codes RLS: Allow users to read their own activation codes

-- Drop existing overly-restrictive policies
DROP POLICY IF EXISTS "Block all client access (anon)" ON public.activation_codes;
DROP POLICY IF EXISTS "Block all client access (authenticated)" ON public.activation_codes;

-- Block all access for anonymous users
CREATE POLICY "Deny all anon access"
ON public.activation_codes
AS PERMISSIVE
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Allow authenticated users to SELECT only their own used activation codes
CREATE POLICY "Users can view their own activation codes"
ON public.activation_codes
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (used_by = auth.uid());

-- Block INSERT/UPDATE/DELETE for authenticated users (only service_role can modify)
CREATE POLICY "Block client writes"
ON public.activation_codes
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (false);

CREATE POLICY "Block client updates"
ON public.activation_codes
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (false)
WITH CHECK (false);

CREATE POLICY "Block client deletes"
ON public.activation_codes
AS PERMISSIVE
FOR DELETE
TO authenticated
USING (false);

COMMENT ON TABLE public.activation_codes IS 'Activation codes - users can only view their own (used_by = auth.uid). Writes are service_role only.';