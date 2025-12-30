-- Drop existing policies and recreate with explicit authenticated role
DROP POLICY IF EXISTS "Users can view own payment info" ON public.payment_info;
DROP POLICY IF EXISTS "Users can insert own payment info" ON public.payment_info;
DROP POLICY IF EXISTS "Users can update own payment info" ON public.payment_info;

-- Recreate policies targeting only authenticated users explicitly
CREATE POLICY "Users can view own payment info"
ON public.payment_info
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payment info"
ON public.payment_info
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own payment info"
ON public.payment_info
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);