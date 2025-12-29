-- Drop the moderator policy that gives broad access to payment info
DROP POLICY IF EXISTS "Moderators can view payment info for approved requests in their" ON public.payment_info;