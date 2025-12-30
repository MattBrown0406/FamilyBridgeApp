-- Add explicit policy to block anonymous/unauthenticated access to profiles
CREATE POLICY "Block anonymous access" 
ON public.profiles 
FOR SELECT 
TO anon 
USING (false);

-- Add explicit policy to block anonymous/unauthenticated access to activation_codes
CREATE POLICY "Block anonymous access" 
ON public.activation_codes 
FOR SELECT 
TO anon 
USING (false);