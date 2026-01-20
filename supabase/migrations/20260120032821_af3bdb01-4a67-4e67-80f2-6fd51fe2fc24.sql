-- Recreate the moderator view with proper access controls
-- The view already masks sensitive location data, but needs access restrictions
DROP VIEW IF EXISTS public.meeting_checkins_moderator_view;

CREATE VIEW public.meeting_checkins_moderator_view
WITH (security_barrier = true) AS
SELECT 
    mc.id,
    mc.user_id,
    mc.family_id,
    mc.meeting_type,
    mc.meeting_name,
    CASE
        WHEN mc.meeting_address IS NOT NULL THEN 'Meeting location on file'::text
        ELSE NULL::text
    END AS meeting_address,
    NULL::numeric(10,8) AS latitude,
    NULL::numeric(11,8) AS longitude,
    mc.notes,
    mc.checked_in_at,
    mc.checked_out_at,
    NULL::numeric(10,8) AS checkout_latitude,
    NULL::numeric(11,8) AS checkout_longitude,
    CASE
        WHEN mc.checkout_address IS NOT NULL THEN 'Checkout location on file'::text
        ELSE NULL::text
    END AS checkout_address,
    mc.checkout_due_at,
    mc.meeting_start_time,
    mc.overdue_alert_sent,
    mc.created_at
FROM public.meeting_checkins mc
WHERE EXISTS (
    -- User is a moderator assigned to this family
    SELECT 1 FROM public.family_members fm
    WHERE fm.family_id = mc.family_id
    AND fm.user_id = auth.uid()
    AND fm.role = 'moderator'
)
OR EXISTS (
    -- User is a provider admin for the organization that owns this family
    SELECT 1 FROM public.families f
    JOIN public.organization_members om ON om.organization_id = f.organization_id
    WHERE f.id = mc.family_id
    AND om.user_id = auth.uid()
    AND om.role IN ('admin', 'owner')
)
OR EXISTS (
    -- User is a temporary moderator for this family
    SELECT 1 FROM public.temporary_moderator_requests tmr
    WHERE tmr.family_id = mc.family_id
    AND tmr.assigned_moderator_id = auth.uid()
    AND tmr.status = 'active'
    AND tmr.expires_at > now()
)
OR EXISTS (
    -- User is a paid moderator for this family
    SELECT 1 FROM public.paid_moderator_requests pmr
    WHERE pmr.family_id = mc.family_id
    AND pmr.assigned_moderator_id = auth.uid()
    AND pmr.status = 'active'
    AND (pmr.expires_at IS NULL OR pmr.expires_at > now())
);

-- Restrict access to authenticated users only
REVOKE ALL ON public.meeting_checkins_moderator_view FROM anon;
REVOKE ALL ON public.meeting_checkins_moderator_view FROM public;
GRANT SELECT ON public.meeting_checkins_moderator_view TO authenticated;