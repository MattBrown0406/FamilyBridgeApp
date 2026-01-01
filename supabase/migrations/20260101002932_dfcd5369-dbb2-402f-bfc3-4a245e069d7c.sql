-- Drop the existing policy that uses just 'false'
DROP POLICY IF EXISTS "Deny all public reads" ON public.activation_codes;

-- Create a more robust policy that explicitly denies all SELECT access
-- Using a condition that can never be true for any user (authenticated or anonymous)
CREATE POLICY "No public access to activation codes" 
ON public.activation_codes 
FOR SELECT 
USING (false);

-- Also add explicit policies to deny INSERT, UPDATE, DELETE from clients
-- These operations should only happen through edge functions with service role key
CREATE POLICY "No public insert on activation codes" 
ON public.activation_codes 
FOR INSERT 
WITH CHECK (false);

CREATE POLICY "No public update on activation codes" 
ON public.activation_codes 
FOR UPDATE 
USING (false);

CREATE POLICY "No public delete on activation codes" 
ON public.activation_codes 
FOR DELETE 
USING (false);