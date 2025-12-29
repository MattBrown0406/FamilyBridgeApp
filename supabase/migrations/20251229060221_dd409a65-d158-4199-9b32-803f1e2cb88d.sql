-- Create a separate table for sensitive payment information
CREATE TABLE public.payment_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  paypal_username text,
  venmo_username text,
  cashapp_username text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_info ENABLE ROW LEVEL SECURITY;

-- Users can view their own payment info
CREATE POLICY "Users can view own payment info"
ON public.payment_info
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own payment info
CREATE POLICY "Users can insert own payment info"
ON public.payment_info
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own payment info
CREATE POLICY "Users can update own payment info"
ON public.payment_info
FOR UPDATE
USING (auth.uid() = user_id);

-- Family members can view payment info ONLY for approved financial requests where they might need to pay
CREATE POLICY "Payers can view requester payment info for approved requests"
ON public.payment_info
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.financial_requests fr
    JOIN public.family_members fm ON fm.family_id = fr.family_id
    WHERE fr.requester_id = payment_info.user_id
      AND fr.status = 'approved'
      AND fm.user_id = auth.uid()
  )
);

-- Moderators can update payment info for family members (for admin purposes)
CREATE POLICY "Moderators can update family member payment info"
ON public.payment_info
FOR UPDATE
USING (is_moderator_of_family_member(auth.uid(), user_id))
WITH CHECK (is_moderator_of_family_member(auth.uid(), user_id));

-- Migrate existing payment data from profiles to payment_info
INSERT INTO public.payment_info (user_id, paypal_username, venmo_username, cashapp_username)
SELECT id, paypal_username, venmo_username, cashapp_username
FROM public.profiles
WHERE paypal_username IS NOT NULL 
   OR venmo_username IS NOT NULL 
   OR cashapp_username IS NOT NULL;

-- Remove payment columns from profiles table
ALTER TABLE public.profiles DROP COLUMN IF EXISTS paypal_username;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS venmo_username;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS cashapp_username;

-- Add trigger for updated_at
CREATE TRIGGER update_payment_info_updated_at
BEFORE UPDATE ON public.payment_info
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();