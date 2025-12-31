-- Update the post_meeting_checkin_message function to handle both recovery meetings and life appointments
CREATE OR REPLACE FUNCTION public.post_meeting_checkin_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  user_name TEXT;
  meeting_info TEXT;
  checkin_type TEXT;
  emoji TEXT;
BEGIN
  -- Get user name
  SELECT full_name INTO user_name FROM profiles WHERE id = NEW.user_id;
  
  -- Determine if this is a recovery meeting or life appointment
  CASE NEW.meeting_type
    WHEN 'AA', 'Al-Anon', 'NA', 'Nar-Anon', 'Refuge Recovery', 'Smart Recovery', 'ACA', 'CoDA', 'Families Anonymous', 'Celebrate Recovery', 'Other' THEN
      checkin_type := 'Recovery Meeting';
      emoji := '🙏';
    WHEN 'Therapy' THEN
      checkin_type := 'Therapy Appointment';
      emoji := '💚';
    WHEN 'Medical' THEN
      checkin_type := 'Medical Appointment';
      emoji := '🏥';
    WHEN 'Work' THEN
      checkin_type := 'Work';
      emoji := '💼';
    WHEN 'Job Interview' THEN
      checkin_type := 'Job Interview';
      emoji := '🎯';
    WHEN 'Court' THEN
      checkin_type := 'Court Appearance';
      emoji := '⚖️';
    WHEN 'Probation' THEN
      checkin_type := 'Probation Meeting';
      emoji := '📋';
    WHEN 'Support Group' THEN
      checkin_type := 'Support Group';
      emoji := '🤝';
    WHEN 'Wellness' THEN
      checkin_type := 'Wellness Activity';
      emoji := '🧘';
    ELSE
      checkin_type := 'Appointment';
      emoji := '📍';
  END CASE;
  
  -- Build meeting info string
  meeting_info := NEW.meeting_type::text;
  IF NEW.meeting_name IS NOT NULL THEN
    meeting_info := meeting_info || ' - ' || NEW.meeting_name;
  END IF;
  
  -- Insert a message into the family chat
  INSERT INTO messages (family_id, sender_id, content)
  VALUES (
    NEW.family_id,
    NEW.user_id,
    emoji || ' **Checked into ' || checkin_type || '**' || E'\n\n' ||
    'I''m attending: ' || meeting_info ||
    CASE WHEN NEW.meeting_address IS NOT NULL THEN E'\n📍 ' || NEW.meeting_address ELSE '' END ||
    CASE WHEN NEW.checkout_due_at IS NOT NULL THEN E'\n⏰ Checkout expected at ' || to_char(NEW.checkout_due_at, 'h:MI AM') ELSE '' END
  );
  
  RETURN NEW;
END;
$function$;