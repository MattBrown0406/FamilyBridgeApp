-- Create a function to post a chat message when someone checks into a meeting
CREATE OR REPLACE FUNCTION public.post_meeting_checkin_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_name TEXT;
  meeting_info TEXT;
BEGIN
  -- Get user name
  SELECT full_name INTO user_name FROM profiles WHERE id = NEW.user_id;
  
  -- Build meeting info string
  meeting_info := NEW.meeting_type;
  IF NEW.meeting_name IS NOT NULL THEN
    meeting_info := meeting_info || ' - ' || NEW.meeting_name;
  END IF;
  
  -- Insert a message into the family chat
  INSERT INTO messages (family_id, sender_id, content)
  VALUES (
    NEW.family_id,
    NEW.user_id,
    '🙏 **Checked into a Recovery Meeting**' || E'\n\n' ||
    'I''m attending a ' || meeting_info || ' meeting.' ||
    CASE WHEN NEW.meeting_address IS NOT NULL THEN E'\n📍 ' || NEW.meeting_address ELSE '' END ||
    CASE WHEN NEW.checkout_due_at IS NOT NULL THEN E'\n⏰ Checkout expected at ' || to_char(NEW.checkout_due_at, 'h:MI AM') ELSE '' END
  );
  
  RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER on_meeting_checkin_post_message
AFTER INSERT ON public.meeting_checkins
FOR EACH ROW
EXECUTE FUNCTION public.post_meeting_checkin_message();