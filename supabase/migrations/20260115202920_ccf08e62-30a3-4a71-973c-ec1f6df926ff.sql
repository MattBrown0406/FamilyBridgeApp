-- Create an anonymized view of emotional patterns for family members
-- This shows patterns without identifying which family member they belong to

CREATE VIEW public.emotional_patterns_anonymized
WITH (security_invoker = on) AS
SELECT 
  id,
  family_id,
  pattern_type,
  pattern_description,
  severity,
  detected_at,
  acknowledged_at IS NOT NULL as is_acknowledged,
  created_at,
  -- Exclude: user_id, acknowledged_by, and sensitive data field
  'A family member' as member_label
FROM public.emotional_patterns;

-- Grant access to the view
GRANT SELECT ON public.emotional_patterns_anonymized TO authenticated;

-- Create RLS policy for family members to view anonymized patterns
-- The view uses security_invoker, so we need a policy on the base table
-- But we already have restrictive policies, so we need a new approach

-- Create a security definer function to get anonymized patterns for a family
CREATE OR REPLACE FUNCTION public.get_anonymized_family_patterns(_family_id uuid)
RETURNS TABLE (
  id uuid,
  family_id uuid,
  pattern_type text,
  pattern_description text,
  severity text,
  detected_at timestamptz,
  is_acknowledged boolean,
  created_at timestamptz,
  member_label text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    ep.id,
    ep.family_id,
    ep.pattern_type,
    ep.pattern_description,
    ep.severity,
    ep.detected_at,
    ep.acknowledged_at IS NOT NULL as is_acknowledged,
    ep.created_at,
    'A family member'::text as member_label
  FROM public.emotional_patterns ep
  WHERE ep.family_id = _family_id
    AND EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE fm.family_id = _family_id
        AND fm.user_id = auth.uid()
    )
  ORDER BY ep.detected_at DESC;
$$;