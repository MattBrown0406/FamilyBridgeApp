-- Add explicit deny policy for all SELECT operations on activation_codes
-- This ensures no one can read activation codes via the public API
-- Edge functions using service role will still work (bypasses RLS)

CREATE POLICY "Deny all public reads"
ON public.activation_codes
FOR SELECT
TO public
USING (false);