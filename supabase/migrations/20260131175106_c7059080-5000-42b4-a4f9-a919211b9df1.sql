
-- Secure the meeting_checkins_moderator_view with explicit permissions
-- The view already masks location data and has WHERE clause filtering,
-- but needs explicit permission grants to prevent anonymous access

-- Revoke all permissions from anonymous and public roles
REVOKE ALL ON public.meeting_checkins_moderator_view FROM anon;
REVOKE ALL ON public.meeting_checkins_moderator_view FROM public;

-- Grant SELECT only to authenticated users (WHERE clause in view handles row filtering)
GRANT SELECT ON public.meeting_checkins_moderator_view TO authenticated;

-- Add security documentation
COMMENT ON VIEW public.meeting_checkins_moderator_view IS 
'Secure view for moderators to see meeting check-ins. 
SECURITY: Location data (lat/lng) is masked to NULL. Addresses show generic placeholders.
ACCESS: Restricted to family moderators, org admins/owners, and active professional moderators via WHERE clause.
PERMISSIONS: Explicit REVOKE from anon/public, GRANT only to authenticated.';
