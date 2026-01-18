-- Drop the existing view and recreate with security_invoker=on
-- This ensures RLS policies on the base table are enforced when querying the view
DROP VIEW IF EXISTS public.emotional_patterns_anonymized;

CREATE VIEW public.emotional_patterns_anonymized
WITH (security_invoker=on) AS
SELECT 
    id,
    family_id,
    pattern_type,
    pattern_description,
    severity,
    detected_at,
    (acknowledged_at IS NOT NULL) AS is_acknowledged,
    created_at,
    'A family member'::text AS member_label
FROM public.emotional_patterns;

-- Add a comment documenting the security model
COMMENT ON VIEW public.emotional_patterns_anonymized IS 'Anonymized view of emotional patterns. Uses security_invoker=on to enforce RLS from the base emotional_patterns table. Only moderators, admins, or the pattern owner can access data.';