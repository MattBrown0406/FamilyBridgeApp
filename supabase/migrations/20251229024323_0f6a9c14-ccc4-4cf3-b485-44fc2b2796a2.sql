-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  family_id UUID REFERENCES public.families(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('message', 'financial_request', 'vote', 'member_joined')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  related_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
ON public.notifications
FOR DELETE
USING (auth.uid() = user_id);

-- Allow insert for authenticated users (will be used by triggers/functions)
CREATE POLICY "System can create notifications"
ON public.notifications
FOR INSERT
WITH CHECK (true);

-- Create function to notify family members of new messages
CREATE OR REPLACE FUNCTION public.notify_family_on_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sender_name TEXT;
  member RECORD;
BEGIN
  -- Get sender name
  SELECT full_name INTO sender_name FROM profiles WHERE id = NEW.sender_id;
  
  -- Notify all family members except the sender
  FOR member IN 
    SELECT user_id FROM family_members 
    WHERE family_id = NEW.family_id AND user_id != NEW.sender_id
  LOOP
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
$$;

-- Create trigger for new messages
CREATE TRIGGER on_new_message
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.notify_family_on_message();

-- Create function to notify family members of financial requests
CREATE OR REPLACE FUNCTION public.notify_family_on_financial_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requester_name TEXT;
  member RECORD;
BEGIN
  -- Get requester name
  SELECT full_name INTO requester_name FROM profiles WHERE id = NEW.requester_id;
  
  -- Notify all family members except the requester
  FOR member IN 
    SELECT user_id FROM family_members 
    WHERE family_id = NEW.family_id AND user_id != NEW.requester_id
  LOOP
    INSERT INTO notifications (user_id, family_id, type, title, body, related_id)
    VALUES (
      member.user_id,
      NEW.family_id,
      'financial_request',
      'Financial request from ' || COALESCE(requester_name, 'a family member'),
      'Requesting $' || NEW.amount || ' - ' || LEFT(NEW.reason, 50),
      NEW.id
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Create trigger for financial requests
CREATE TRIGGER on_new_financial_request
AFTER INSERT ON public.financial_requests
FOR EACH ROW
EXECUTE FUNCTION public.notify_family_on_financial_request();