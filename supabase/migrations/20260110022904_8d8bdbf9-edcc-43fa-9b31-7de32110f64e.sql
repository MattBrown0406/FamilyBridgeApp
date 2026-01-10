-- Update the get_payment_links_for_request function to use 5-minute window instead of 1 hour
CREATE OR REPLACE FUNCTION public.get_payment_links_for_request(_request_id uuid)
 RETURNS TABLE(paypal_link text, venmo_link text, cashapp_link text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $$
DECLARE
  v_requester_id uuid;
  v_paypal text;
  v_venmo text;
  v_cashapp text;
BEGIN
  -- Verify the caller is a payer for this approved request within the 5-minute window
  SELECT fr.requester_id INTO v_requester_id
  FROM public.financial_requests fr
  WHERE fr.id = _request_id
    AND fr.status = 'approved'
    AND fr.paid_by_user_id = auth.uid()
    AND fr.paid_at IS NOT NULL
    AND fr.payment_confirmed_at IS NULL
    -- Reduced from 1 hour to 5 minutes to minimize exposure window
    AND fr.paid_at > (now() - interval '5 minutes');
  
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
  
  -- Log the access for audit purposes
  INSERT INTO public.payment_info_access_audit (accessed_by, payment_info_user_id, financial_request_id, access_type)
  VALUES (auth.uid(), v_requester_id, _request_id, 'payment_links_request');
  
  -- Return deep links (not raw usernames)
  RETURN QUERY SELECT
    CASE WHEN v_paypal IS NOT NULL THEN 'https://paypal.me/' || v_paypal ELSE NULL END,
    CASE WHEN v_venmo IS NOT NULL THEN 'https://venmo.com/' || v_venmo ELSE NULL END,
    CASE WHEN v_cashapp IS NOT NULL THEN 'https://cash.app/$' || v_cashapp ELSE NULL END;
END;
$$;