CREATE OR REPLACE FUNCTION public.is_family_moderator(_family_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.family_members
    WHERE family_id = _family_id AND user_id = _user_id AND role IN ('moderator', 'admin'))
$$;

CREATE OR REPLACE FUNCTION public.get_family_invite_code(_family_id uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT f.invite_code FROM public.families f
  INNER JOIN public.family_members fm ON fm.family_id = f.id
  WHERE f.id = _family_id AND fm.user_id = auth.uid() AND fm.role IN ('moderator', 'admin')
$$;

DROP POLICY IF EXISTS "Members can vote on requests" ON public.financial_votes;
CREATE POLICY "Members can vote on requests" ON public.financial_votes
FOR INSERT WITH CHECK (
  auth.uid() = voter_id AND EXISTS (
    SELECT 1 FROM public.financial_requests fr
    JOIN public.family_members fm ON fm.family_id = fr.family_id
    WHERE fr.id = financial_votes.request_id AND fm.user_id = auth.uid() AND fr.requester_id != auth.uid()
  )
);

CREATE OR REPLACE FUNCTION public.update_financial_request_status()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_family_id uuid; v_requester_id uuid; v_total_eligible int;
  v_approve_count int; v_deny_count int; v_new_status public.request_status;
BEGIN
  SELECT family_id, requester_id INTO v_family_id, v_requester_id
    FROM public.financial_requests WHERE id = NEW.request_id;
  SELECT COUNT(*) INTO v_total_eligible FROM public.family_members
    WHERE family_id = v_family_id AND user_id != v_requester_id;
  SELECT COUNT(*) FILTER (WHERE approved = true), COUNT(*) FILTER (WHERE approved = false)
    INTO v_approve_count, v_deny_count FROM public.financial_votes WHERE request_id = NEW.request_id;
  IF v_total_eligible > 0 AND v_approve_count::float / v_total_eligible > 0.5 THEN v_new_status := 'approved';
  ELSIF v_total_eligible > 0 AND v_deny_count::float / v_total_eligible > 0.5 THEN v_new_status := 'denied';
  ELSE v_new_status := 'pending'; END IF;
  UPDATE public.financial_requests SET status = v_new_status, updated_at = now()
    WHERE id = NEW.request_id AND status = 'pending' AND v_new_status != 'pending';
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_financial_vote_cast ON public.financial_votes;
CREATE TRIGGER on_financial_vote_cast AFTER INSERT ON public.financial_votes
  FOR EACH ROW EXECUTE FUNCTION public.update_financial_request_status();

DROP POLICY IF EXISTS "Moderators can update financial requests" ON public.financial_requests;
DROP POLICY IF EXISTS "Admins and moderators can update financial requests" ON public.financial_requests;
CREATE POLICY "Admins and moderators can update financial requests" ON public.financial_requests
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.family_members fm
    WHERE fm.family_id = financial_requests.family_id AND fm.user_id = auth.uid() AND fm.role IN ('admin', 'moderator'))
);

DROP POLICY IF EXISTS "Requesters can update own requests" ON public.financial_requests;
CREATE POLICY "Requesters can update own requests" ON public.financial_requests
FOR UPDATE USING (auth.uid() = requester_id);

ALTER TABLE public.family_boundaries
  ADD COLUMN IF NOT EXISTS rejected_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS rejected_at timestamp with time zone;

DROP POLICY IF EXISTS "Moderators can update boundary status" ON public.family_boundaries;
DROP POLICY IF EXISTS "Moderators can delete boundaries" ON public.family_boundaries;
DROP POLICY IF EXISTS "Moderators can approve boundaries" ON public.family_boundaries;
DROP POLICY IF EXISTS "Moderators can reject boundaries" ON public.family_boundaries;
DROP POLICY IF EXISTS "Admins and moderators can update boundaries" ON public.family_boundaries;
DROP POLICY IF EXISTS "Admins and moderators can delete boundaries" ON public.family_boundaries;

CREATE POLICY "Admins and moderators can update boundaries" ON public.family_boundaries
FOR UPDATE USING (is_family_moderator(family_id, auth.uid()));

CREATE POLICY "Admins and moderators can delete boundaries" ON public.family_boundaries
FOR DELETE USING (is_family_moderator(family_id, auth.uid()) OR created_by = auth.uid());

ALTER TABLE public.financial_requests ADD COLUMN IF NOT EXISTS attachment_url text;