-- Update the notify function to also post a message to chat when request is created
CREATE OR REPLACE FUNCTION public.notify_on_location_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  requester_name TEXT;
  target_name TEXT;
BEGIN
  SELECT full_name INTO requester_name FROM profiles WHERE id = NEW.requester_id;
  SELECT full_name INTO target_name FROM profiles WHERE id = NEW.target_user_id;
  
  -- Create notification for target user
  INSERT INTO notifications (user_id, family_id, type, title, body, related_id)
  VALUES (
    NEW.target_user_id,
    NEW.family_id,
    'location_request',
    'Location Check-in Request',
    COALESCE(requester_name, 'A family member') || ' is requesting your location. Tap to respond.',
    NEW.id
  );
  
  -- Post message to family chat
  INSERT INTO messages (family_id, sender_id, content)
  VALUES (
    NEW.family_id,
    NEW.requester_id,
    '📍 **Location Check-In Request**' || E'\n\n' ||
    COALESCE(requester_name, 'A family member') || ' is requesting a location check-in from ' || 
    COALESCE(target_name, 'a family member') || '.' ||
    CASE WHEN NEW.requester_note IS NOT NULL THEN E'\n\n"' || NEW.requester_note || '"' ELSE '' END ||
    E'\n\n_Waiting for response..._'
  );
  
  RETURN NEW;
END;
$$;

-- Update the response trigger to post a message when responded
CREATE OR REPLACE FUNCTION public.notify_on_location_response()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  target_name TEXT;
  requester_name TEXT;
BEGIN
  IF OLD.status = 'pending' AND NEW.status IN ('completed', 'declined', 'expired') THEN
    SELECT full_name INTO target_name FROM profiles WHERE id = NEW.target_user_id;
    SELECT full_name INTO requester_name FROM profiles WHERE id = NEW.requester_id;
    
    -- Notify requester
    INSERT INTO notifications (user_id, family_id, type, title, body, related_id)
    VALUES (
      NEW.requester_id,
      NEW.family_id,
      'location_response',
      CASE 
        WHEN NEW.status = 'completed' THEN 'Location Shared'
        WHEN NEW.status = 'expired' THEN 'Check-in Request Expired'
        ELSE 'Request Declined'
      END,
      COALESCE(target_name, 'Family member') || 
        CASE 
          WHEN NEW.status = 'completed' THEN ' has shared their location.'
          WHEN NEW.status = 'expired' THEN ' did not respond to the location request.'
          ELSE ' declined the location request.'
        END,
      NEW.id
    );
    
    -- Post message to family chat based on status
    IF NEW.status = 'completed' THEN
      INSERT INTO messages (family_id, sender_id, content)
      VALUES (
        NEW.family_id,
        NEW.target_user_id,
        '✅ **Location Shared**' || E'\n\n' ||
        COALESCE(target_name, 'Family member') || ' checked in.' ||
        CASE WHEN NEW.location_address IS NOT NULL THEN E'\n📍 ' || NEW.location_address ELSE '' END ||
        CASE WHEN NEW.response_note IS NOT NULL THEN E'\n\n"' || NEW.response_note || '"' ELSE '' END
      );
    ELSIF NEW.status = 'declined' THEN
      INSERT INTO messages (family_id, sender_id, content)
      VALUES (
        NEW.family_id,
        NEW.target_user_id,
        '❌ **Check-In Declined**' || E'\n\n' ||
        COALESCE(target_name, 'Family member') || ' declined the location request.' ||
        CASE WHEN NEW.response_note IS NOT NULL THEN E'\n\n"' || NEW.response_note || '"' ELSE '' END
      );
    ELSIF NEW.status = 'expired' THEN
      INSERT INTO messages (family_id, sender_id, content)
      VALUES (
        NEW.family_id,
        NEW.requester_id,
        '⚠️ **Check-In Request Expired**' || E'\n\n' ||
        COALESCE(target_name, 'Family member') || ' did not respond to the location check-in request within 5 minutes.'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;