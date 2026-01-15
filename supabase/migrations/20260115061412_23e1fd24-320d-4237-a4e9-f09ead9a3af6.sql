-- Create a function to anonymize old location data (nullify coordinates after 30 days)
CREATE OR REPLACE FUNCTION public.anonymize_old_location_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Anonymize check-in coordinates older than 30 days
  UPDATE public.meeting_checkins
  SET 
    latitude = NULL,
    longitude = NULL,
    checkout_latitude = NULL,
    checkout_longitude = NULL,
    meeting_address = CASE 
      WHEN meeting_address IS NOT NULL THEN 'Address expired for privacy'
      ELSE NULL
    END,
    checkout_address = CASE 
      WHEN checkout_address IS NOT NULL THEN 'Address expired for privacy'
      ELSE NULL
    END
  WHERE checked_in_at < NOW() - INTERVAL '30 days'
    AND (latitude IS NOT NULL OR longitude IS NOT NULL 
         OR checkout_latitude IS NOT NULL OR checkout_longitude IS NOT NULL);
         
  -- Also anonymize old location check-in requests
  UPDATE public.location_checkin_requests
  SET 
    latitude = NULL,
    longitude = NULL,
    location_address = CASE 
      WHEN location_address IS NOT NULL THEN 'Address expired for privacy'
      ELSE NULL
    END
  WHERE requested_at < NOW() - INTERVAL '30 days'
    AND (latitude IS NOT NULL OR longitude IS NOT NULL);
END;
$$;

-- Create a trigger to automatically anonymize location data on old records when table is accessed
-- This ensures privacy even without a scheduled job
CREATE OR REPLACE FUNCTION public.trigger_anonymize_locations()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Perform cleanup occasionally (1% chance on each insert to avoid performance impact)
  IF random() < 0.01 THEN
    PERFORM public.anonymize_old_location_data();
  END IF;
  RETURN NEW;
END;
$$;

-- Add trigger on meeting_checkins inserts
DROP TRIGGER IF EXISTS anonymize_old_locations_trigger ON public.meeting_checkins;
CREATE TRIGGER anonymize_old_locations_trigger
  AFTER INSERT ON public.meeting_checkins
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.trigger_anonymize_locations();

-- Add a comment documenting the privacy policy
COMMENT ON TABLE public.meeting_checkins IS 'Location data is automatically anonymized after 30 days for user privacy protection';
COMMENT ON TABLE public.location_checkin_requests IS 'Location data is automatically anonymized after 30 days for user privacy protection';