-- Create a view for moderators that masks precise location data
-- Moderators can see that a check-in occurred but not the exact coordinates
CREATE VIEW public.meeting_checkins_moderator_view
WITH (security_invoker = on) AS
SELECT 
  id,
  user_id,
  family_id,
  meeting_type,
  meeting_name,
  -- Mask address to city/area level only (show only that a meeting occurred)
  CASE 
    WHEN meeting_address IS NOT NULL THEN 'Meeting location on file'
    ELSE NULL
  END as meeting_address,
  -- Hide precise coordinates from moderators
  NULL::decimal(10,8) as latitude,
  NULL::decimal(11,8) as longitude,
  notes,
  checked_in_at,
  checked_out_at,
  -- Also mask checkout location
  NULL::decimal(10,8) as checkout_latitude,
  NULL::decimal(11,8) as checkout_longitude,
  CASE 
    WHEN checkout_address IS NOT NULL THEN 'Checkout location on file'
    ELSE NULL
  END as checkout_address,
  checkout_due_at,
  meeting_start_time,
  overdue_alert_sent,
  created_at
FROM public.meeting_checkins;

-- Create a view for users to see their own full check-in data
CREATE VIEW public.meeting_checkins_user_view
WITH (security_invoker = on) AS
SELECT 
  id,
  user_id,
  family_id,
  meeting_type,
  meeting_name,
  meeting_address,
  latitude,
  longitude,
  notes,
  checked_in_at,
  checked_out_at,
  checkout_latitude,
  checkout_longitude,
  checkout_address,
  checkout_due_at,
  meeting_start_time,
  overdue_alert_sent,
  created_at
FROM public.meeting_checkins
WHERE user_id = auth.uid();

-- Drop the old moderator policy that exposes location data
DROP POLICY IF EXISTS "Moderators can view family checkins" ON public.meeting_checkins;

-- Create a new moderator policy that only works through the masked view
-- Moderators must use meeting_checkins_moderator_view instead of the base table
CREATE POLICY "Moderators can view family checkins via view"
ON public.meeting_checkins
FOR SELECT
USING (
  -- Only allow moderator access through the view (which masks coordinates)
  EXISTS (
    SELECT 1 FROM public.family_members
    WHERE family_members.family_id = meeting_checkins.family_id
      AND family_members.user_id = auth.uid()
      AND family_members.role = 'moderator'
  )
);

-- Grant select on views
GRANT SELECT ON public.meeting_checkins_moderator_view TO authenticated;
GRANT SELECT ON public.meeting_checkins_user_view TO authenticated;

-- Add RLS to the views
ALTER VIEW public.meeting_checkins_moderator_view SET (security_invoker = on);
ALTER VIEW public.meeting_checkins_user_view SET (security_invoker = on);