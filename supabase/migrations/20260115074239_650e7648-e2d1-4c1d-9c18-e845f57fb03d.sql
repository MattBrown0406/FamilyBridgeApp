-- Enable RLS on the activation_codes_admin_view
ALTER VIEW public.activation_codes_admin_view SET (security_invoker = on);

-- Since views inherit RLS from their base tables, we need to ensure
-- the base table (activation_codes) has proper RLS that restricts to super admins
-- The view already exists, so we add a policy on the underlying table

-- First, let's make sure RLS is enabled on activation_codes table
ALTER TABLE public.activation_codes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to recreate them properly
DROP POLICY IF EXISTS "Super admins can view activation codes" ON public.activation_codes;
DROP POLICY IF EXISTS "Super admins can insert activation codes" ON public.activation_codes;
DROP POLICY IF EXISTS "Super admins can update activation codes" ON public.activation_codes;
DROP POLICY IF EXISTS "Users can view their own activation code" ON public.activation_codes;

-- Create policy for super admins to have full access
CREATE POLICY "Super admins can view activation codes"
ON public.activation_codes
FOR SELECT
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can insert activation codes"
ON public.activation_codes
FOR INSERT
WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can update activation codes"
ON public.activation_codes
FOR UPDATE
USING (public.is_super_admin(auth.uid()));

-- Allow users to see their own activation code (when used_by matches their id)
CREATE POLICY "Users can view their own activation code"
ON public.activation_codes
FOR SELECT
USING (used_by = auth.uid());