-- Drop existing policy and recreate with explicit authentication requirement
DROP POLICY IF EXISTS "Users can view their own used activation codes" ON public.activation_codes;

-- Recreate with explicit TO authenticated clause
CREATE POLICY "Users can view their own used activation codes" 
ON public.activation_codes 
FOR SELECT 
TO authenticated
USING (used_by = auth.uid() AND is_used = true);