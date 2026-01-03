-- Update the notification function to notify Freedom Interventions moderators instead of a single email
CREATE OR REPLACE FUNCTION public.notify_on_paid_moderator_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  family_name TEXT;
  requester_name TEXT;
  freedom_org_id UUID;
  moderator RECORD;
BEGIN
  -- Get family name
  SELECT name INTO family_name FROM families WHERE id = NEW.family_id;
  
  -- Get requester name
  SELECT full_name INTO requester_name FROM profiles WHERE id = NEW.requested_by;
  
  -- Find Freedom Interventions organization
  SELECT id INTO freedom_org_id 
  FROM organizations 
  WHERE name = 'Freedom Interventions';
  
  -- If org not found, exit gracefully
  IF freedom_org_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Create notification for all Freedom Interventions moderators when new request
  IF TG_OP = 'INSERT' THEN
    FOR moderator IN 
      SELECT user_id FROM organization_members 
      WHERE organization_id = freedom_org_id
    LOOP
      INSERT INTO notifications (user_id, family_id, type, title, body, related_id)
      VALUES (
        moderator.user_id,
        NEW.family_id,
        'paid_moderator_request',
        '💰 New Paid Moderator Request',
        COALESCE(requester_name, 'A family member') || ' from "' || COALESCE(family_name, 'Unknown Family') || '" has initiated a paid moderator support purchase ($200/24hr). Awaiting payment completion.',
        NEW.id
      );
    END LOOP;
  END IF;
  
  -- Create notification when payment is completed
  IF TG_OP = 'UPDATE' AND OLD.payment_completed_at IS NULL AND NEW.payment_completed_at IS NOT NULL THEN
    FOR moderator IN 
      SELECT user_id FROM organization_members 
      WHERE organization_id = freedom_org_id
    LOOP
      INSERT INTO notifications (user_id, family_id, type, title, body, related_id)
      VALUES (
        moderator.user_id,
        NEW.family_id,
        'paid_moderator_activated',
        '✅ Payment Received - Moderator Support Needed!',
        'Payment confirmed for "' || COALESCE(family_name, 'Unknown Family') || '". A moderator needs to be assigned for 24-hour support. Requested by: ' || COALESCE(requester_name, 'Unknown'),
        NEW.id
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$function$;