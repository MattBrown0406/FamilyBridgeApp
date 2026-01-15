-- Enable security_invoker on the payment_info_masked view so it respects RLS
ALTER VIEW public.payment_info_masked SET (security_invoker = on);

-- Ensure RLS is enabled on the payment_info table (the base table)
ALTER TABLE public.payment_info ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can view own payment info" ON public.payment_info;
DROP POLICY IF EXISTS "Users can insert own payment info" ON public.payment_info;
DROP POLICY IF EXISTS "Users can update own payment info" ON public.payment_info;
DROP POLICY IF EXISTS "Users can delete own payment info" ON public.payment_info;
DROP POLICY IF EXISTS "Family members can view payment info" ON public.payment_info;
DROP POLICY IF EXISTS "Super admins can view all payment info" ON public.payment_info;

-- Users can always view their own payment info
CREATE POLICY "Users can view own payment info"
ON public.payment_info
FOR SELECT
USING (user_id = auth.uid());

-- Users can insert their own payment info
CREATE POLICY "Users can insert own payment info"
ON public.payment_info
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Users can update their own payment info
CREATE POLICY "Users can update own payment info"
ON public.payment_info
FOR UPDATE
USING (user_id = auth.uid());

-- Users can delete their own payment info
CREATE POLICY "Users can delete own payment info"
ON public.payment_info
FOR DELETE
USING (user_id = auth.uid());

-- Family members can view payment info of other family members (for financial requests)
CREATE POLICY "Family members can view payment info"
ON public.payment_info
FOR SELECT
USING (public.shares_family_with(auth.uid(), user_id));

-- Super admins can view all payment info
CREATE POLICY "Super admins can view all payment info"
ON public.payment_info
FOR SELECT
USING (public.is_super_admin(auth.uid()));