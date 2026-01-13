-- Update the notify_family_on_message function to only notify professional moderators 
-- if they have an active crisis session for that specific family
CREATE OR REPLACE FUNCTION public.notify_family_on_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  sender_name TEXT;
  member RECORD;
  is_active_professional BOOLEAN;
BEGIN
  -- Get sender name
  SELECT full_name INTO sender_name FROM profiles WHERE id = NEW.sender_id;
  
  -- Notify all family members except the sender
  FOR member IN 
    SELECT fm.user_id, fm.role FROM family_members fm
    WHERE fm.family_id = NEW.family_id AND fm.user_id != NEW.sender_id
  LOOP
    -- Check if this member is a professional moderator (not a regular family member)
    -- Professional moderators should only get notifications if they have an active assignment
    IF member.role = 'moderator' THEN
      -- Check if they have an active temporary or paid moderator request for THIS family
      SELECT EXISTS (
        SELECT 1 FROM temporary_moderator_requests
        WHERE family_id = NEW.family_id
          AND assigned_moderator_id = member.user_id
          AND status = 'active'
          AND expires_at > now()
      ) OR EXISTS (
        SELECT 1 FROM paid_moderator_requests
        WHERE family_id = NEW.family_id
          AND assigned_moderator_id = member.user_id
          AND status = 'active'
          AND (expires_at IS NULL OR expires_at > now())
      ) INTO is_active_professional;
      
      -- Skip notification if they're a moderator but don't have an active assignment
      -- (they might be an org moderator or superadmin with general access)
      IF NOT is_active_professional THEN
        -- Check if they're part of an organization that manages this family
        -- In that case, they should still get notifications
        IF NOT EXISTS (
          SELECT 1 FROM families f
          JOIN organization_members om ON om.organization_id = f.organization_id
          WHERE f.id = NEW.family_id
            AND om.user_id = member.user_id
        ) THEN
          CONTINUE; -- Skip this moderator
        END IF;
      END IF;
    END IF;
    
    INSERT INTO notifications (user_id, family_id, type, title, body, related_id)
    VALUES (
      member.user_id,
      NEW.family_id,
      'message',
      'New message from ' || COALESCE(sender_name, 'a family member'),
      LEFT(NEW.content, 100),
      NEW.id
    );
  END LOOP;
  
  RETURN NEW;
END;
$function$;