-- Drop the existing SELECT policy that exposes all columns including encrypted data
DROP POLICY IF EXISTS "Users can view their own activation codes" ON public.activation_codes;

-- Create a new restrictive policy that blocks ALL client SELECT operations
-- Activation code validation is done server-side via edge functions with service role
-- Users don't need direct access to this table
CREATE POLICY "Block all client reads" 
ON public.activation_codes 
FOR SELECT 
TO authenticated
USING (false);