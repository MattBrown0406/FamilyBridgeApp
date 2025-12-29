-- Drop the overly permissive INSERT policy
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;

-- Notifications are now ONLY created via SECURITY DEFINER triggers:
-- - notify_family_on_message()
-- - notify_family_on_financial_request()
-- - notify_family_on_checkin()
-- These triggers run with elevated privileges and bypass RLS, which is secure
-- because they contain the business logic for who gets notified.

-- Add a comment explaining the security model
COMMENT ON TABLE public.notifications IS 'Notifications are created only via SECURITY DEFINER triggers. Direct inserts are not allowed.';