-- 1. Update the financial request creation message to include voting reminder
CREATE OR REPLACE FUNCTION public.post_financial_request_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  requester_name TEXT;
BEGIN
  -- Get requester name
  SELECT full_name INTO requester_name FROM profiles WHERE id = NEW.requester_id;
  
  -- Insert a message about the financial request with voting reminder
  INSERT INTO messages (family_id, sender_id, content)
  VALUES (
    NEW.family_id,
    NEW.requester_id,
    '💰 **Financial Request** from ' || COALESCE(requester_name, 'a family member') || E'\n\n' ||
    '**Amount:** $' || NEW.amount || E'\n' ||
    '**Reason:** ' || NEW.reason || E'\n\n' ||
    '📋 _Please go to the **Financial** tab to vote on this request and pledge to help if you can!_'
  );
  
  RETURN NEW;
END;
$$;

-- 2. Create function to post message when payment is confirmed
CREATE OR REPLACE FUNCTION public.post_financial_payment_confirmed_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  confirmer_name TEXT;
  requester_name TEXT;
BEGIN
  -- Only fire when payment_confirmed_at changes from NULL to a value
  IF OLD.payment_confirmed_at IS NULL AND NEW.payment_confirmed_at IS NOT NULL THEN
    SELECT full_name INTO confirmer_name FROM profiles WHERE id = NEW.payment_confirmed_by_user_id;
    SELECT full_name INTO requester_name FROM profiles WHERE id = NEW.requester_id;
    
    INSERT INTO messages (family_id, sender_id, content)
    VALUES (
      NEW.family_id,
      NEW.payment_confirmed_by_user_id,
      '✅ **Payment Confirmed**' || E'\n\n' ||
      COALESCE(confirmer_name, 'A family member') || ' confirmed receipt of $' || NEW.amount || 
      ' for: ' || NEW.reason || E'\n\n' ||
      '_Thank you for supporting ' || COALESCE(requester_name, 'the request') || '!_'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- 3. Create function to post message when receipt/bill is uploaded
CREATE OR REPLACE FUNCTION public.post_financial_receipt_uploaded_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  requester_name TEXT;
BEGIN
  -- Only fire when attachment_url changes from NULL to a value
  IF OLD.attachment_url IS NULL AND NEW.attachment_url IS NOT NULL THEN
    SELECT full_name INTO requester_name FROM profiles WHERE id = NEW.requester_id;
    
    INSERT INTO messages (family_id, sender_id, content)
    VALUES (
      NEW.family_id,
      NEW.requester_id,
      '🧾 **Receipt Uploaded**' || E'\n\n' ||
      COALESCE(requester_name, 'A family member') || ' uploaded a receipt for the $' || NEW.amount || 
      ' request: ' || NEW.reason || E'\n\n' ||
      '_A moderator or admin can now review and close this request in the **Financial** tab._'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- 4. Create function to post message when request is resolved/closed
CREATE OR REPLACE FUNCTION public.post_financial_request_closed_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  requester_name TEXT;
BEGIN
  -- Only fire when resolved_at changes from NULL to a value (request closed)
  IF OLD.resolved_at IS NULL AND NEW.resolved_at IS NOT NULL THEN
    SELECT full_name INTO requester_name FROM profiles WHERE id = NEW.requester_id;
    
    INSERT INTO messages (family_id, sender_id, content)
    VALUES (
      NEW.family_id,
      NEW.requester_id,
      '🎉 **Financial Request Closed**' || E'\n\n' ||
      'The $' || NEW.amount || ' request from ' || COALESCE(requester_name, 'a family member') || 
      ' for "' || NEW.reason || '" has been reviewed and closed.' || E'\n\n' ||
      '_Thank you everyone for your support!_'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the triggers
DROP TRIGGER IF EXISTS on_financial_payment_confirmed ON public.financial_requests;
CREATE TRIGGER on_financial_payment_confirmed
AFTER UPDATE ON public.financial_requests
FOR EACH ROW
EXECUTE FUNCTION public.post_financial_payment_confirmed_message();

DROP TRIGGER IF EXISTS on_financial_receipt_uploaded ON public.financial_requests;
CREATE TRIGGER on_financial_receipt_uploaded
AFTER UPDATE ON public.financial_requests
FOR EACH ROW
EXECUTE FUNCTION public.post_financial_receipt_uploaded_message();

DROP TRIGGER IF EXISTS on_financial_request_closed ON public.financial_requests;
CREATE TRIGGER on_financial_request_closed
AFTER UPDATE ON public.financial_requests
FOR EACH ROW
EXECUTE FUNCTION public.post_financial_request_closed_message();