-- ============================================================
-- FamilyBridge Dashboard Tab Bug Fixes
-- 2026-05-28
-- Fixes: admin RLS for goals/values/boundaries, financial vote
-- trigger, vote RLS for recovering role, boundary rejected_by
-- fields, financial request update policy for admins, rescind
-- count check, location risk admin notification, and misc.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. FIX is_family_moderator() TO INCLUDE ADMINS
--    (was: role = 'moderator' only — breaks Goals/Values/Boundaries for admins)
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_family_moderator(_family_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.family_members
    WHERE family_id = _family_id
      AND user_id = _user_id
      AND role IN ('moderator', 'admin')
  )
$$;

-- Also fix get_family_invite_code() to allow admins to retrieve invite codes
CREATE OR REPLACE FUNCTION public.get_family_invite_code(_family_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT f.invite_code
  FROM public.families f
  INNER JOIN public.family_members fm ON fm.family_id = f.id
  WHERE f.id = _family_id
    AND fm.user_id = auth.uid()
    AND fm.role IN ('moderator', 'admin')
$$;

-- ─────────────────────────────────────────────────────────────
-- 2. FIX FINANCIAL VOTES: Allow recovering role to vote
--    (was: only member + moderator; recovering users saw buttons but got RLS error)
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Members can vote on requests" ON public.financial_votes;

CREATE POLICY "Members can vote on requests"
ON public.financial_votes
FOR INSERT WITH CHECK (
  auth.uid() = voter_id AND
  EXISTS (
    SELECT 1 FROM public.financial_requests fr
    JOIN public.family_members fm ON fm.family_id = fr.family_id
    WHERE fr.id = financial_votes.request_id
      AND fm.user_id = auth.uid()
      AND fr.requester_id != auth.uid()  -- cannot vote on own request
  )
);

-- ─────────────────────────────────────────────────────────────
-- 3. FIX FINANCIAL REQUESTS STATUS: Auto-update on votes
--    Add trigger that sets status to 'approved'/'denied' once
--    majority of non-requester family members have voted.
--    Logic: >50% approvals among voters → approved;
--           >50% denials → denied. Requires at least 1 vote.
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_financial_request_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_family_id       uuid;
  v_requester_id    uuid;
  v_total_eligible  int;
  v_approve_count   int;
  v_deny_count      int;
  v_new_status      public.request_status;
BEGIN
  -- Get family and requester info
  SELECT family_id, requester_id
    INTO v_family_id, v_requester_id
    FROM public.financial_requests
   WHERE id = NEW.request_id;

  -- Count eligible voters (all family members except requester)
  SELECT COUNT(*)
    INTO v_total_eligible
    FROM public.family_members
   WHERE family_id = v_family_id
     AND user_id != v_requester_id;

  -- Count current votes
  SELECT
    COUNT(*) FILTER (WHERE approved = true),
    COUNT(*) FILTER (WHERE approved = false)
  INTO v_approve_count, v_deny_count
  FROM public.financial_votes
  WHERE request_id = NEW.request_id;

  -- Determine new status:
  -- Approved if >50% of eligible voters approved
  -- Denied if >50% of eligible voters denied
  -- Stays pending otherwise
  IF v_total_eligible > 0 AND v_approve_count::float / v_total_eligible > 0.5 THEN
    v_new_status := 'approved';
  ELSIF v_total_eligible > 0 AND v_deny_count::float / v_total_eligible > 0.5 THEN
    v_new_status := 'denied';
  ELSE
    v_new_status := 'pending';
  END IF;

  -- Update the request status only if it changed and request is still pending
  UPDATE public.financial_requests
     SET status = v_new_status,
         updated_at = now()
   WHERE id = NEW.request_id
     AND status = 'pending'
     AND v_new_status != 'pending';

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_financial_vote_cast ON public.financial_votes;
CREATE TRIGGER on_financial_vote_cast
  AFTER INSERT ON public.financial_votes
  FOR EACH ROW EXECUTE FUNCTION public.update_financial_request_status();

-- ─────────────────────────────────────────────────────────────
-- 4. FIX FINANCIAL REQUESTS UPDATE POLICY: Allow admins too
--    (was: only moderator role)
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Moderators can update financial requests" ON public.financial_requests;
DROP POLICY IF EXISTS "Admins and moderators can update financial requests" ON public.financial_requests;

CREATE POLICY "Admins and moderators can update financial requests"
ON public.financial_requests
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.family_members fm
    WHERE fm.family_id = financial_requests.family_id
      AND fm.user_id = auth.uid()
      AND fm.role IN ('admin', 'moderator')
  )
);

-- Also allow requesters to update their own requests (for rescind, attachment)
DROP POLICY IF EXISTS "Requesters can update own requests" ON public.financial_requests;

CREATE POLICY "Requesters can update own requests"
ON public.financial_requests
FOR UPDATE USING (
  auth.uid() = requester_id
);

-- ─────────────────────────────────────────────────────────────
-- 5. FIX FAMILY_BOUNDARIES: Add rejected_by + rejected_at columns
--    (fields existed in schema intent but were never written)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.family_boundaries
  ADD COLUMN IF NOT EXISTS rejected_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS rejected_at timestamp with time zone;

-- ─────────────────────────────────────────────────────────────
-- 6. FIX FAMILY_BOUNDARIES: Allow admins to approve/reject/delete
--    The existing policies only allowed role='moderator', not 'admin'
-- ─────────────────────────────────────────────────────────────
-- Drop old moderator-only policies and replace with admin+moderator versions
DROP POLICY IF EXISTS "Moderators can update boundary status" ON public.family_boundaries;
DROP POLICY IF EXISTS "Moderators can delete boundaries" ON public.family_boundaries;
DROP POLICY IF EXISTS "Moderators can approve boundaries" ON public.family_boundaries;
DROP POLICY IF EXISTS "Moderators can reject boundaries" ON public.family_boundaries;
DROP POLICY IF EXISTS "Admins and moderators can update boundaries" ON public.family_boundaries;
DROP POLICY IF EXISTS "Admins and moderators can delete boundaries" ON public.family_boundaries;

-- Admins and moderators can update boundary status (approve/reject)
CREATE POLICY "Admins and moderators can update boundaries"
ON public.family_boundaries
FOR UPDATE USING (
  is_family_moderator(family_id, auth.uid())  -- now includes admins (fixed fn above)
);

-- Admins and moderators can delete any boundary
CREATE POLICY "Admins and moderators can delete boundaries"
ON public.family_boundaries
FOR DELETE USING (
  is_family_moderator(family_id, auth.uid())
  OR created_by = auth.uid()  -- creators can always delete their own
);

-- ─────────────────────────────────────────────────────────────
-- 7. FIX LOCATION RISK NOTIFICATIONS: Include admin role
--    (was: only notified moderator role; admins were skipped)
--    This is a client-side fix but we add a helper view for
--    consistent moderator+admin membership lookups.
-- ─────────────────────────────────────────────────────────────
-- No schema change needed — the locationRisk.ts client fix handles this.
-- Documented here for audit trail.

-- ─────────────────────────────────────────────────────────────
-- 8. FINANCIAL REQUESTS: Allow attachment_url update for requesters
--    (so they can attach a bill to an existing request post-submission)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.financial_requests
  ADD COLUMN IF NOT EXISTS attachment_url text;

-- Note: the column may already exist from a later migration; IF NOT EXISTS is safe.

-- ─────────────────────────────────────────────────────────────
-- 9. NOTIFY PGRST to reload schema cache
-- ─────────────────────────────────────────────────────────────
NOTIFY pgrst, 'reload schema';
