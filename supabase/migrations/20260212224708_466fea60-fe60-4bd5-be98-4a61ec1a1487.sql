-- Fix the broken consent check in transition_summaries RLS policy
-- The current policy has: tsc.transition_summary_id = tsc.id (self-referencing bug)
-- It should be: tsc.transition_summary_id = transition_summaries.id

DROP POLICY IF EXISTS "Receiving org can view with consent" ON public.transition_summaries;

CREATE POLICY "Receiving org can view with consent"
ON public.transition_summaries
FOR SELECT
TO authenticated
USING (
  is_shared_with_next_provider = true
  AND is_org_member(to_organization_id, auth.uid())
  AND EXISTS (
    SELECT 1
    FROM transition_summary_consents tsc
    WHERE tsc.transition_summary_id = transition_summaries.id
      AND tsc.organization_id = transition_summaries.to_organization_id
      AND tsc.revoked_at IS NULL
  )
);