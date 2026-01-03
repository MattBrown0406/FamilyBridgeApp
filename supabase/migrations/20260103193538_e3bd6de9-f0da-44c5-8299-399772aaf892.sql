-- Create function to notify moderators of paid support purchases
CREATE OR REPLACE FUNCTION public.notify_on_paid_moderator_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  family_name TEXT;
  requester_name TEXT;
  admin_email TEXT := 'matt@familybridge.app';
  admin_user_id UUID;
BEGIN
  -- Get family name
  SELECT name INTO family_name FROM families WHERE id = NEW.family_id;
  
  -- Get requester name
  SELECT full_name INTO requester_name FROM profiles WHERE id = NEW.requested_by;
  
  -- Find the default moderator (Matt) by email
  SELECT id INTO admin_user_id 
  FROM auth.users 
  WHERE email = admin_email;
  
  -- Create notification for admin when payment is pending (new request created)
  IF TG_OP = 'INSERT' THEN
    IF admin_user_id IS NOT NULL THEN
      INSERT INTO notifications (user_id, family_id, type, title, body, related_id)
      VALUES (
        admin_user_id,
        NEW.family_id,
        'paid_moderator_request',
        '💰 New Paid Moderator Request',
        COALESCE(requester_name, 'A family member') || ' from "' || COALESCE(family_name, 'Unknown Family') || '" has initiated a paid moderator support purchase ($200/24hr). Awaiting payment completion.',
        NEW.id
      );
    END IF;
  END IF;
  
  -- Create notification when payment is completed
  IF TG_OP = 'UPDATE' AND OLD.payment_completed_at IS NULL AND NEW.payment_completed_at IS NOT NULL THEN
    IF admin_user_id IS NOT NULL THEN
      INSERT INTO notifications (user_id, family_id, type, title, body, related_id)
      VALUES (
        admin_user_id,
        NEW.family_id,
        'paid_moderator_activated',
        '✅ Payment Received - Moderator Support Needed!',
        'Payment confirmed for "' || COALESCE(family_name, 'Unknown Family') || '". A moderator needs to be assigned for 24-hour support. Requested by: ' || COALESCE(requester_name, 'Unknown'),
        NEW.id
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for new requests
CREATE TRIGGER notify_paid_moderator_request_insert
AFTER INSERT ON public.paid_moderator_requests
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_paid_moderator_request();

-- Create trigger for payment completion
CREATE TRIGGER notify_paid_moderator_request_update
AFTER UPDATE ON public.paid_moderator_requests
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_paid_moderator_request();

-- Enable realtime for paid_moderator_requests
ALTER TABLE public.paid_moderator_requests REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.paid_moderator_requests;