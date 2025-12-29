-- Create meeting types enum
CREATE TYPE public.meeting_type AS ENUM ('AA', 'Al-Anon', 'NA', 'Nar-Anon', 'Other');

-- Create meeting check-ins table
CREATE TABLE public.meeting_checkins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  family_id UUID REFERENCES public.families(id) ON DELETE CASCADE NOT NULL,
  meeting_type meeting_type NOT NULL,
  meeting_name TEXT,
  meeting_address TEXT,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  notes TEXT,
  checked_in_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.meeting_checkins ENABLE ROW LEVEL SECURITY;

-- Users can create their own check-ins
CREATE POLICY "Users can create own checkins"
ON public.meeting_checkins
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM family_members 
    WHERE family_id = meeting_checkins.family_id 
    AND user_id = auth.uid()
  )
);

-- Family members can view check-ins in their families
CREATE POLICY "Family members can view checkins"
ON public.meeting_checkins
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM family_members 
    WHERE family_id = meeting_checkins.family_id 
    AND user_id = auth.uid()
  )
);

-- Create function to notify family of check-ins
CREATE OR REPLACE FUNCTION public.notify_family_on_checkin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_name TEXT;
  member RECORD;
BEGIN
  -- Get user name
  SELECT full_name INTO user_name FROM profiles WHERE id = NEW.user_id;
  
  -- Notify all family members except the person checking in
  FOR member IN 
    SELECT user_id FROM family_members 
    WHERE family_id = NEW.family_id AND user_id != NEW.user_id
  LOOP
    INSERT INTO notifications (user_id, family_id, type, title, body, related_id)
    VALUES (
      member.user_id,
      NEW.family_id,
      'member_joined',
      COALESCE(user_name, 'A family member') || ' checked in to a meeting',
      NEW.meeting_type::text || ' meeting' || CASE WHEN NEW.meeting_name IS NOT NULL THEN ': ' || NEW.meeting_name ELSE '' END,
      NEW.id
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Create trigger for check-ins
CREATE TRIGGER on_new_checkin
AFTER INSERT ON public.meeting_checkins
FOR EACH ROW
EXECUTE FUNCTION public.notify_family_on_checkin();