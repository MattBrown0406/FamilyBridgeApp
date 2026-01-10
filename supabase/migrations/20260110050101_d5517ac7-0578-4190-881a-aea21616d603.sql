-- Enable Row Level Security on activation_codes table
ALTER TABLE public.activation_codes ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only view their own used activation codes
-- This allows users to see codes they've redeemed, but not others
CREATE POLICY "Users can view their own used activation codes"
ON public.activation_codes
FOR SELECT
TO authenticated
USING (used_by = auth.uid());

-- No INSERT policy for regular users - codes are created via edge functions with service role
-- No UPDATE policy for regular users - codes are validated/used via edge functions with service role
-- No DELETE policy - codes should never be deleted by regular users

-- Note: Edge functions using service role key bypass RLS, so they can still
-- create, validate, and manage activation codes as needed