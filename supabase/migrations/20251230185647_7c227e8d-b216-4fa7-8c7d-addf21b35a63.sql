-- Drop the existing SELECT policy
DROP POLICY IF EXISTS "Users can view their own activation codes" ON public.activation_codes;

-- Create a more restrictive SELECT policy - users can ONLY see their own used codes
CREATE POLICY "Users can only view their own used activation codes"
ON public.activation_codes
FOR SELECT
TO authenticated
USING (used_by = auth.uid() AND is_used = true);

-- No INSERT/UPDATE/DELETE policies for authenticated users
-- Edge functions use service role which bypasses RLS