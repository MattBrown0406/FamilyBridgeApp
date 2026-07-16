
-- financial_requests: prevent requester self-approval / amount tampering
DROP POLICY IF EXISTS "Requesters can update own requests" ON public.financial_requests;

CREATE POLICY "Requesters can update own pending requests"
ON public.financial_requests
FOR UPDATE
TO authenticated
USING (auth.uid() = requester_id AND status = 'pending'::request_status)
WITH CHECK (auth.uid() = requester_id AND status = 'pending'::request_status);

CREATE OR REPLACE FUNCTION public.prevent_requester_financial_tampering()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() = OLD.requester_id THEN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      RAISE EXCEPTION 'Requesters cannot change the status of their own financial request';
    END IF;
    IF NEW.amount IS DISTINCT FROM OLD.amount THEN
      RAISE EXCEPTION 'Requesters cannot change the amount of their own financial request';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_requester_financial_tampering ON public.financial_requests;
CREATE TRIGGER trg_prevent_requester_financial_tampering
BEFORE UPDATE ON public.financial_requests
FOR EACH ROW
EXECUTE FUNCTION public.prevent_requester_financial_tampering();

-- private_conversation_participants: require added user to belong to same family
DROP POLICY IF EXISTS "Conversation members can add participants" ON public.private_conversation_participants;

CREATE POLICY "Conversation members can add participants"
ON public.private_conversation_participants
FOR INSERT
TO authenticated
WITH CHECK (
  (
    public.is_conversation_participant(conversation_id, auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.private_conversations pc
      WHERE pc.id = conversation_id AND pc.created_by = auth.uid()
    )
    OR public.is_super_admin(auth.uid())
  )
  AND EXISTS (
    SELECT 1
    FROM public.private_conversations pc
    JOIN public.family_members fm
      ON fm.family_id = pc.family_id
     AND fm.user_id = private_conversation_participants.user_id
    WHERE pc.id = private_conversation_participants.conversation_id
  )
);
