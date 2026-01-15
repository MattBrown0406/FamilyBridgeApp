-- For views, we use security_invoker to ensure the view respects the underlying table's RLS
-- and revoke direct access from anon role

-- Set the view to use security invoker (respects caller's permissions on underlying tables)
ALTER VIEW public.payment_info_masked SET (security_invoker = on);

-- Revoke all access from anonymous users
REVOKE ALL ON public.payment_info_masked FROM anon;

-- Grant SELECT only to authenticated users (underlying RLS on payment_info will filter results)
GRANT SELECT ON public.payment_info_masked TO authenticated;

-- Ensure the underlying payment_info table has proper RLS for family sharing
-- Create a policy allowing users to see payment info of family members for financial requests
CREATE POLICY "Users can view payment info of family members for requests"
ON public.payment_info
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id 
  OR public.shares_family_with(auth.uid(), user_id)
);

-- Drop the more restrictive old policy that only allowed viewing own payment info
DROP POLICY IF EXISTS "Users can check own payment info exists" ON public.payment_info;