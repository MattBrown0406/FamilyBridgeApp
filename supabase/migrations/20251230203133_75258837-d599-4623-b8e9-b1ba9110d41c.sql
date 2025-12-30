-- Ensure RLS is enabled on activation_codes table
ALTER TABLE public.activation_codes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can view their own used activation codes" ON public.activation_codes;

-- Users can only view activation codes they have used (linked to their account)
CREATE POLICY "Users can view their own used activation codes" 
ON public.activation_codes 
FOR SELECT 
TO authenticated
USING (used_by = auth.uid() AND is_used = true);

-- No public access - all other operations (INSERT, UPDATE, DELETE) are handled by service role in edge functions