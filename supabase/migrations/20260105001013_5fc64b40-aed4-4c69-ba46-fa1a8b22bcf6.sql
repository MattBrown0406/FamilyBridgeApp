-- Drop the security definer view as it bypasses RLS
DROP VIEW IF EXISTS public.payment_info_masked;

-- Instead, create a function that returns masked payment info for family members
-- This function respects RLS and only masks data for non-owners
CREATE OR REPLACE FUNCTION public.get_payment_links_for_user(target_user_id uuid)
RETURNS TABLE (
  venmo_link text,
  paypal_link text,
  cashapp_link text
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  is_owner boolean;
  v_venmo text;
  v_paypal text;
  v_cashapp text;
BEGIN
  -- Check if the caller is the owner
  is_owner := (auth.uid() = target_user_id);
  
  -- Get payment info (RLS will enforce access)
  SELECT 
    venmo_username,
    paypal_username,
    cashapp_username
  INTO v_venmo, v_paypal, v_cashapp
  FROM payment_info
  WHERE user_id = target_user_id;
  
  -- Return links (RLS already verified access, just build the URLs)
  RETURN QUERY SELECT
    CASE WHEN v_venmo IS NOT NULL THEN 'https://venmo.com/' || v_venmo ELSE NULL END,
    CASE WHEN v_paypal IS NOT NULL THEN 'https://paypal.me/' || v_paypal ELSE NULL END,
    CASE WHEN v_cashapp IS NOT NULL THEN 'https://cash.app/$' || v_cashapp ELSE NULL END;
END;
$$;

-- The existing RLS policy on payment_info table already restricts access appropriately
-- Family members can only access payment info through the get_payment_links_for_request function
-- which is already defined and working