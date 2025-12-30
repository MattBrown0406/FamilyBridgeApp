-- Add checkout-related columns to meeting_checkins table
ALTER TABLE public.meeting_checkins
ADD COLUMN meeting_start_time timestamp with time zone,
ADD COLUMN checkout_due_at timestamp with time zone,
ADD COLUMN checked_out_at timestamp with time zone,
ADD COLUMN checkout_latitude numeric,
ADD COLUMN checkout_longitude numeric,
ADD COLUMN checkout_address text;

-- Create a function to calculate meeting end time (rounded to hour + 1 hour)
CREATE OR REPLACE FUNCTION public.calculate_checkout_time(checkin_time timestamp with time zone)
RETURNS timestamp with time zone
LANGUAGE sql
IMMUTABLE
AS $$
  -- Round down to the current hour, then add 1 hour for the meeting end time
  SELECT date_trunc('hour', checkin_time) + interval '1 hour';
$$;

-- Create a trigger to automatically set checkout_due_at on insert
CREATE OR REPLACE FUNCTION public.set_checkout_due_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Set meeting_start_time to the hour the checkin occurred
  NEW.meeting_start_time := date_trunc('hour', NEW.checked_in_at);
  -- Set checkout_due_at to 1 hour after meeting start
  NEW.checkout_due_at := NEW.meeting_start_time + interval '1 hour';
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_meeting_checkout_time
BEFORE INSERT ON public.meeting_checkins
FOR EACH ROW
EXECUTE FUNCTION public.set_checkout_due_at();

-- Allow users to update their own checkins (for checkout)
CREATE POLICY "Users can checkout from own checkins"
ON public.meeting_checkins
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);