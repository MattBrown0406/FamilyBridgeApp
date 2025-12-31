-- Add column to track if overdue alert was sent
ALTER TABLE meeting_checkins 
ADD COLUMN IF NOT EXISTS overdue_alert_sent boolean DEFAULT false;

-- Create function to handle overdue checkout alerts
CREATE OR REPLACE FUNCTION public.check_overdue_checkouts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  overdue_checkin RECORD;
  user_name TEXT;
  member RECORD;
  meeting_info TEXT;
BEGIN
  -- Find all checkins that are overdue by 15+ minutes and haven't had an alert sent
  FOR overdue_checkin IN 
    SELECT mc.*, f.name as family_name
    FROM meeting_checkins mc
    JOIN families f ON f.id = mc.family_id
    WHERE mc.checked_out_at IS NULL
      AND mc.checkout_due_at IS NOT NULL
      AND mc.checkout_due_at + interval '15 minutes' < NOW()
      AND mc.overdue_alert_sent = false
  LOOP
    -- Get user name
    SELECT full_name INTO user_name FROM profiles WHERE id = overdue_checkin.user_id;
    
    -- Build meeting info
    meeting_info := overdue_checkin.meeting_type::text;
    IF overdue_checkin.meeting_name IS NOT NULL THEN
      meeting_info := meeting_info || ' - ' || overdue_checkin.meeting_name;
    END IF;
    
    -- Create notifications for all family members except the person who checked in
    FOR member IN 
      SELECT user_id FROM family_members 
      WHERE family_id = overdue_checkin.family_id 
      AND user_id != overdue_checkin.user_id
    LOOP
      INSERT INTO notifications (user_id, family_id, type, title, body, related_id)
      VALUES (
        member.user_id,
        overdue_checkin.family_id,
        'overdue_checkout',
        '⚠️ Overdue Check-out Alert',
        COALESCE(user_name, 'A family member') || ' has not checked out from their ' || meeting_info || ' (expected ' || to_char(overdue_checkin.checkout_due_at, 'h:MI AM') || ')',
        overdue_checkin.id
      );
    END LOOP;
    
    -- Post message to family chat
    INSERT INTO messages (family_id, sender_id, content)
    VALUES (
      overdue_checkin.family_id,
      overdue_checkin.user_id,
      '⚠️ **Overdue Check-out Alert**' || E'\n\n' ||
      COALESCE(user_name, 'A family member') || ' has not checked out from their ' || meeting_info || '.' || E'\n' ||
      '⏰ Expected checkout: ' || to_char(overdue_checkin.checkout_due_at, 'h:MI AM') || E'\n' ||
      '📍 Location: ' || COALESCE(overdue_checkin.meeting_address, 'Not specified') || E'\n\n' ||
      '_Please check in with them to make sure everything is okay._'
    );
    
    -- Mark alert as sent
    UPDATE meeting_checkins 
    SET overdue_alert_sent = true 
    WHERE id = overdue_checkin.id;
    
  END LOOP;
END;
$function$;