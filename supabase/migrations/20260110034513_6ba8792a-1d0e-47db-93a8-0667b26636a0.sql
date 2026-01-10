-- Create a table for one-time payment access tokens
CREATE TABLE public.payment_access_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  financial_request_id UUID NOT NULL REFERENCES public.financial_requests(id) ON DELETE CASCADE,
  payer_user_id UUID NOT NULL,
  requester_user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '5 minutes'),
  used_at TIMESTAMPTZ,
  is_used BOOLEAN NOT NULL DEFAULT false
);

-- Enable RLS
ALTER TABLE public.payment_access_tokens ENABLE ROW LEVEL SECURITY;

-- Only allow the payer to see their own tokens
CREATE POLICY "Payers can view their own tokens"
ON public.payment_access_tokens
FOR SELECT
USING (payer_user_id = auth.uid());

-- Create index for fast token lookups
CREATE INDEX idx_payment_access_tokens_token ON public.payment_access_tokens(token);
CREATE INDEX idx_payment_access_tokens_request ON public.payment_access_tokens(financial_request_id);

-- Function to generate a one-time access token when marking as paid
CREATE OR REPLACE FUNCTION public.generate_payment_access_token(_request_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token uuid;
  v_requester_id uuid;
  v_family_id uuid;
BEGIN
  -- Verify the request exists, is approved, and caller is a family member
  SELECT fr.requester_id, fr.family_id INTO v_requester_id, v_family_id
  FROM public.financial_requests fr
  WHERE fr.id = _request_id
    AND fr.status = 'approved';
  
  IF v_requester_id IS NULL THEN
    RAISE EXCEPTION 'Request not found or not approved';
  END IF;
  
  -- Verify caller is a family member
  IF NOT public.is_family_member(v_family_id, auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  
  -- Invalidate any existing unused tokens for this request by this payer
  UPDATE public.payment_access_tokens
  SET is_used = true, used_at = now()
  WHERE financial_request_id = _request_id
    AND payer_user_id = auth.uid()
    AND is_used = false;
  
  -- Generate new token
  v_token := gen_random_uuid();
  
  INSERT INTO public.payment_access_tokens (token, financial_request_id, payer_user_id, requester_user_id)
  VALUES (v_token, _request_id, auth.uid(), v_requester_id);
  
  RETURN v_token;
END;
$$;

-- Updated function to get payment links using one-time token
CREATE OR REPLACE FUNCTION public.get_payment_links_with_token(_token uuid)
RETURNS TABLE(paypal_link text, venmo_link text, cashapp_link text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token_record RECORD;
  v_paypal text;
  v_venmo text;
  v_cashapp text;
BEGIN
  -- Find and validate the token
  SELECT * INTO v_token_record
  FROM public.payment_access_tokens
  WHERE token = _token
    AND payer_user_id = auth.uid()
    AND is_used = false
    AND expires_at > now();
  
  -- If token not found, not owned by caller, already used, or expired
  IF v_token_record IS NULL THEN
    -- Log the failed attempt
    INSERT INTO public.payment_info_access_audit (accessed_by, payment_info_user_id, access_type, ip_address)
    VALUES (auth.uid(), NULL, 'token_invalid_or_expired', NULL);
    
    RETURN QUERY SELECT NULL::text, NULL::text, NULL::text;
    RETURN;
  END IF;
  
  -- Mark token as used IMMEDIATELY (before returning data)
  UPDATE public.payment_access_tokens
  SET is_used = true, used_at = now()
  WHERE id = v_token_record.id;
  
  -- Get the payment info
  SELECT 
    pi.paypal_username,
    pi.venmo_username,
    pi.cashapp_username
  INTO v_paypal, v_venmo, v_cashapp
  FROM public.payment_info pi
  WHERE pi.user_id = v_token_record.requester_user_id;
  
  -- Log the successful access
  INSERT INTO public.payment_info_access_audit (accessed_by, payment_info_user_id, financial_request_id, access_type)
  VALUES (auth.uid(), v_token_record.requester_user_id, v_token_record.financial_request_id, 'one_time_token_used');
  
  -- Return deep links (not raw usernames)
  RETURN QUERY SELECT
    CASE WHEN v_paypal IS NOT NULL THEN 'https://paypal.me/' || v_paypal ELSE NULL END,
    CASE WHEN v_venmo IS NOT NULL THEN 'https://venmo.com/' || v_venmo ELSE NULL END,
    CASE WHEN v_cashapp IS NOT NULL THEN 'https://cash.app/$' || v_cashapp ELSE NULL END;
END;
$$;

-- Deprecate the old function by making it always return null (keeps backwards compat)
CREATE OR REPLACE FUNCTION public.get_payment_links_for_request(_request_id uuid)
RETURNS TABLE(paypal_link text, venmo_link text, cashapp_link text)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- This function is deprecated - use get_payment_links_with_token instead
  -- Log the attempt to use deprecated function
  INSERT INTO public.payment_info_access_audit (accessed_by, payment_info_user_id, financial_request_id, access_type)
  VALUES (auth.uid(), NULL, _request_id, 'deprecated_function_blocked');
  
  RETURN QUERY SELECT NULL::text, NULL::text, NULL::text;
END;
$$;