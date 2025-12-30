-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can only view their own used activation codes" ON public.activation_codes;

-- Create a proper permissive policy that only allows users to see their own used codes
CREATE POLICY "Users can view their own used activation codes" 
ON public.activation_codes 
FOR SELECT 
TO authenticated
USING (used_by = auth.uid() AND is_used = true);