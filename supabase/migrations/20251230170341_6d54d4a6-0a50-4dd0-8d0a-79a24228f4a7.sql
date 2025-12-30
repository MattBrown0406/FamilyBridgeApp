-- Fix the function search_path security issue
CREATE OR REPLACE FUNCTION public.calculate_checkout_time(checkin_time timestamp with time zone)
RETURNS timestamp with time zone
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT date_trunc('hour', checkin_time) + interval '1 hour';
$$;