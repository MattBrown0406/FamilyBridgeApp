-- Fix payment_info RLS policies to require authentication
-- Remove overly permissive 'public' role policies and consolidate to 'authenticated' role only

-- Drop the problematic public role SELECT policies
DROP POLICY IF EXISTS "Users can view own payment info" ON public.payment_info;
DROP POLICY IF EXISTS "Super admins can view all payment info" ON public.payment_info;

-- Drop duplicate public role policies for INSERT, UPDATE, DELETE
DROP POLICY IF EXISTS "Users can insert own payment info" ON public.payment_info;
DROP POLICY IF EXISTS "Users can update own payment info" ON public.payment_info;
DROP POLICY IF EXISTS "Users can delete own payment info" ON public.payment_info;

-- Create proper authenticated-only SELECT policy for super admins
CREATE POLICY "Super admins can view all payment info"
ON public.payment_info
FOR SELECT
TO authenticated
USING (public.is_super_admin(auth.uid()));

-- Note: The existing authenticated policies remain:
-- - "No direct SELECT on payment_info" (blocks direct access)
-- - "Users can only view their own payment info" (self-access)
-- - "Users can insert their own payment info"
-- - "Users can update their own payment info"  
-- - "Users can delete their own payment info"

COMMENT ON TABLE public.payment_info IS 'Payment method storage. Direct access blocked via RLS. Use get_payment_links_with_token() RPC for accessing payment links with proper audit logging.';