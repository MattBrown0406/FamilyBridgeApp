-- Keep paid moderator request notification copy aligned with current App Store product pricing.
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
  SELECT name INTO family_name FROM families WHERE id = NEW.family_id;
  SELECT full_name INTO requester_name FROM profiles WHERE id = NEW.requested_by;

  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = admin_email;

  IF TG_OP = 'INSERT' THEN
    IF admin_user_id IS NOT NULL THEN
      INSERT INTO notifications (user_id, family_id, type, title, body, related_id)
      VALUES (
        admin_user_id,
        NEW.family_id,
        'paid_moderator_request',
        'New Paid Moderator Request',
        COALESCE(requester_name, 'A family member') || ' from "' || COALESCE(family_name, 'Unknown Family') || '" has initiated a Professional Guidance Window purchase ($399/24hr).',
        NEW.id
      );
    END IF;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.payment_completed_at IS NULL AND NEW.payment_completed_at IS NOT NULL THEN
    IF admin_user_id IS NOT NULL THEN
      INSERT INTO notifications (user_id, family_id, type, title, body, related_id)
      VALUES (
        admin_user_id,
        NEW.family_id,
        'paid_moderator_activated',
        'Payment Received - Moderator Support Needed',
        'Payment confirmed for "' || COALESCE(family_name, 'Unknown Family') || '". A moderator needs to be assigned for 24-hour support. Requested by: ' || COALESCE(requester_name, 'Unknown'),
        NEW.id
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;
