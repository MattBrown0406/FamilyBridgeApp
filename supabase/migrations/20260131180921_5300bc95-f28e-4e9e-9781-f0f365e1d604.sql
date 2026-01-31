-- Secure the emotional_patterns_anonymized view (it's actually a function that returns a table)
-- First check if it's a view or function and secure appropriately

-- Revoke execute from anon/public on the function
REVOKE ALL ON FUNCTION public.get_anonymized_family_patterns(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.get_anonymized_family_patterns(uuid) FROM public;

-- Grant execute only to authenticated users
GRANT EXECUTE ON FUNCTION public.get_anonymized_family_patterns(uuid) TO authenticated;

-- Add security documentation
COMMENT ON FUNCTION public.get_anonymized_family_patterns IS 
'Secure SECURITY DEFINER function for accessing anonymized emotional patterns.
SECURITY: Member names are anonymized as ''A family member''. Only pattern metadata is exposed.
ACCESS: Restricted to authenticated users. Function verifies caller is a family member before returning data.
PERMISSIONS: Explicit REVOKE from anon/public, GRANT EXECUTE only to authenticated.';