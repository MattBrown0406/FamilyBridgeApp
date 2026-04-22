CREATE OR REPLACE FUNCTION public.expire_pending_location_requests()
RETURNS TABLE(expired_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_count integer;
BEGIN
  WITH updated AS (
    UPDATE public.location_checkin_requests
    SET status = 'expired',
        responded_at = now()
    WHERE status = 'pending'
      AND requested_at < now() - interval '5 minutes'
    RETURNING id
  )
  SELECT count(*)::integer INTO v_count FROM updated;

  RETURN QUERY SELECT v_count;
END;
$function$;