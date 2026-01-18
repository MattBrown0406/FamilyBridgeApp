-- Create trigger for location request notifications (if not exists)
DROP TRIGGER IF EXISTS notify_location_request ON public.location_checkin_requests;

CREATE TRIGGER notify_location_request
AFTER INSERT ON public.location_checkin_requests
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_location_request();