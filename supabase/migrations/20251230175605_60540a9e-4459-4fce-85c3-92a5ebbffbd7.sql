-- Create a secure function that returns payment deep links without exposing usernames
-- Only returns links for approved financial requests where the caller is a payer
CREATE OR REPLACE FUNCTION public.get_payment_links_for_request(_request_id uuid)
RETURNS TABLE (
  paypal_link text,
  venmo_link text,
  cashapp_link text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_requester_id uuid;
  v_paypal text;
  v_venmo text;
  v_cashapp text;
BEGIN
  -- Verify the caller is a payer for this approved request within the time window
  SELECT fr.requester_id INTO v_requester_id
  FROM public.financial_requests fr
  WHERE fr.id = _request_id
    AND fr.status = 'approved'
    AND fr.paid_by_user_id = auth.uid()
    AND fr.paid_at IS NOT NULL
    AND fr.payment_confirmed_at IS NULL
    AND fr.paid_at > (now() - interval '1 hour');
  
  -- If not authorized, return nulls
  IF v_requester_id IS NULL THEN
    RETURN QUERY SELECT NULL::text, NULL::text, NULL::text;
    RETURN;
  END IF;
  
  -- Get the payment info
  SELECT 
    pi.paypal_username,
    pi.venmo_username,
    pi.cashapp_username
  INTO v_paypal, v_venmo, v_cashapp
  FROM public.payment_info pi
  WHERE pi.user_id = v_requester_id;
  
  -- Return deep links (not raw usernames)
  RETURN QUERY SELECT
    CASE WHEN v_paypal IS NOT NULL THEN 'https://paypal.me/' || v_paypal ELSE NULL END,
    CASE WHEN v_venmo IS NOT NULL THEN 'https://venmo.com/' || v_venmo ELSE NULL END,
    CASE WHEN v_cashapp IS NOT NULL THEN 'https://cash.app/$' || v_cashapp ELSE NULL END;
END;
$$;

-- Drop the vulnerable policy that exposes payment info during payment window
DROP POLICY IF EXISTS "Payer can view payment info during time-limited active payment" ON public.payment_info;