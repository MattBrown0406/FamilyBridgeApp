-- Add payment handle fields to profiles
ALTER TABLE public.profiles
ADD COLUMN paypal_username TEXT,
ADD COLUMN venmo_username TEXT,
ADD COLUMN cashapp_username TEXT;

-- Add payment tracking fields to financial_requests
ALTER TABLE public.financial_requests
ADD COLUMN paid_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN paid_by_user_id UUID,
ADD COLUMN payment_method TEXT,
ADD COLUMN payment_confirmed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN payment_confirmed_by_user_id UUID;

-- Allow users to update their own payment tracking (requester can confirm receipt)
CREATE POLICY "Requester can confirm payment receipt"
ON public.financial_requests
FOR UPDATE
USING (auth.uid() = requester_id)
WITH CHECK (auth.uid() = requester_id);

-- Allow family members to mark as paid
CREATE POLICY "Family members can mark requests as paid"
ON public.financial_requests
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.family_id = financial_requests.family_id
    AND fm.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.family_id = financial_requests.family_id
    AND fm.user_id = auth.uid()
  )
);