-- Create location check-in requests table
CREATE TABLE public.location_checkin_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  requester_id uuid NOT NULL,
  target_user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'declined', 'expired')),
  requested_at timestamp with time zone NOT NULL DEFAULT now(),
  responded_at timestamp with time zone,
  latitude numeric,
  longitude numeric,
  location_address text,
  requester_note text,
  response_note text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.location_checkin_requests ENABLE ROW LEVEL SECURITY;

-- Family members can create requests for recovering individuals in their family
CREATE POLICY "Family members can request checkins"
ON public.location_checkin_requests
FOR INSERT
WITH CHECK (
  auth.uid() = requester_id
  AND EXISTS (
    SELECT 1 FROM public.family_members fm
    WHERE fm.family_id = location_checkin_requests.family_id
      AND fm.user_id = auth.uid()
  )
  AND EXISTS (
    SELECT 1 FROM public.family_members fm
    WHERE fm.family_id = location_checkin_requests.family_id
      AND fm.user_id = location_checkin_requests.target_user_id
      AND fm.role = 'recovering'
  )
);

-- Users can view requests they made or that target them
CREATE POLICY "Users can view their own requests"
ON public.location_checkin_requests
FOR SELECT
USING (
  auth.uid() = requester_id 
  OR auth.uid() = target_user_id
);

-- Moderators can view all requests in their family
CREATE POLICY "Moderators can view family requests"
ON public.location_checkin_requests
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.family_members fm
    WHERE fm.family_id = location_checkin_requests.family_id
      AND fm.user_id = auth.uid()
      AND fm.role = 'moderator'
  )
);

-- Target users can update (respond to) requests targeting them
CREATE POLICY "Target users can respond to requests"
ON public.location_checkin_requests
FOR UPDATE
USING (auth.uid() = target_user_id)
WITH CHECK (auth.uid() = target_user_id);

-- Create function to notify target user when a request is made
CREATE OR REPLACE FUNCTION public.notify_on_location_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  requester_name TEXT;
BEGIN
  SELECT full_name INTO requester_name FROM profiles WHERE id = NEW.requester_id;
  
  INSERT INTO notifications (user_id, family_id, type, title, body, related_id)
  VALUES (
    NEW.target_user_id,
    NEW.family_id,
    'location_request',
    'Location Check-in Request',
    COALESCE(requester_name, 'A family member') || ' is requesting your location. Tap to respond.',
    NEW.id
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for location request notifications
CREATE TRIGGER notify_location_request
AFTER INSERT ON public.location_checkin_requests
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_location_request();

-- Create function to notify requester when target responds
CREATE OR REPLACE FUNCTION public.notify_on_location_response()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  target_name TEXT;
BEGIN
  IF OLD.status = 'pending' AND NEW.status IN ('completed', 'declined') THEN
    SELECT full_name INTO target_name FROM profiles WHERE id = NEW.target_user_id;
    
    INSERT INTO notifications (user_id, family_id, type, title, body, related_id)
    VALUES (
      NEW.requester_id,
      NEW.family_id,
      'location_response',
      CASE WHEN NEW.status = 'completed' THEN 'Location Shared' ELSE 'Request Declined' END,
      COALESCE(target_name, 'Family member') || 
        CASE WHEN NEW.status = 'completed' THEN ' has shared their location.' ELSE ' declined the location request.' END,
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for location response notifications
CREATE TRIGGER notify_location_response
AFTER UPDATE ON public.location_checkin_requests
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_location_response();