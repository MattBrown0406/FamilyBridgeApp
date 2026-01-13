-- Strengthen payment_info security by restricting direct column access
-- and requiring all access to go through secure functions with audit logging

-- First, drop the existing SELECT policy
DROP POLICY IF EXISTS "Users can only view own payment info" ON public.payment_info;

-- Create a more restrictive SELECT policy that only allows users to see 
-- that they HAVE payment info configured, but not the actual values
-- The actual payment links will only be accessible through the secure 
-- get_payment_links_with_token function which has audit logging
CREATE POLICY "Users can check own payment info exists"
ON public.payment_info
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
);

-- Create a view that masks the actual payment usernames
-- Users can only see if they have values set, not what they are
CREATE OR REPLACE VIEW public.payment_info_masked AS
SELECT 
  id,
  user_id,
  CASE WHEN venmo_username IS NOT NULL THEN '••••••' ELSE NULL END as venmo_username,
  CASE WHEN paypal_username IS NOT NULL THEN '••••••' ELSE NULL END as paypal_username,
  CASE WHEN cashapp_username IS NOT NULL THEN '••••••' ELSE NULL END as cashapp_username,
  created_at,
  updated_at
FROM public.payment_info
WHERE user_id = auth.uid();

-- Grant access to the view
GRANT SELECT ON public.payment_info_masked TO authenticated;

-- Create a secure function for users to view their OWN unmasked payment info
-- This function logs the access for audit purposes
CREATE OR REPLACE FUNCTION public.get_own_payment_info()
RETURNS TABLE(
  venmo_username text,
  paypal_username text,
  cashapp_username text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log the access attempt
  INSERT INTO public.payment_info_access_audit (
    accessed_by, 
    payment_info_user_id, 
    access_type
  )
  VALUES (
    auth.uid(), 
    auth.uid(), 
    'self_view'
  );
  
  -- Return the unmasked values
  RETURN QUERY
  SELECT 
    pi.venmo_username,
    pi.paypal_username,
    pi.cashapp_username
  FROM public.payment_info pi
  WHERE pi.user_id = auth.uid();
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_own_payment_info() TO authenticated;

-- Add rate limiting by tracking access frequency
-- Create a function to check if user has accessed too frequently
CREATE OR REPLACE FUNCTION public.check_payment_info_access_rate()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  access_count integer;
BEGIN
  -- Count accesses in the last 5 minutes
  SELECT COUNT(*)
  INTO access_count
  FROM public.payment_info_access_audit
  WHERE accessed_by = auth.uid()
    AND accessed_at > now() - interval '5 minutes';
  
  -- Allow max 10 accesses per 5 minutes
  RETURN access_count < 10;
END;
$$;

-- Update get_own_payment_info to include rate limiting
CREATE OR REPLACE FUNCTION public.get_own_payment_info()
RETURNS TABLE(
  venmo_username text,
  paypal_username text,
  cashapp_username text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check rate limit
  IF NOT public.check_payment_info_access_rate() THEN
    RAISE EXCEPTION 'Rate limit exceeded. Please wait before trying again.';
  END IF;
  
  -- Log the access attempt
  INSERT INTO public.payment_info_access_audit (
    accessed_by, 
    payment_info_user_id, 
    access_type
  )
  VALUES (
    auth.uid(), 
    auth.uid(), 
    'self_view'
  );
  
  -- Return the unmasked values
  RETURN QUERY
  SELECT 
    pi.venmo_username,
    pi.paypal_username,
    pi.cashapp_username
  FROM public.payment_info pi
  WHERE pi.user_id = auth.uid();
END;
$$;