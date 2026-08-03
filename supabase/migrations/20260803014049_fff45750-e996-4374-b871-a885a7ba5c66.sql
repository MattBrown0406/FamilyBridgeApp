-- 1. family-avatars: remove public read
DROP POLICY IF EXISTS "Anyone can view family avatars" ON storage.objects;

CREATE POLICY "Family members can view family avatars"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'family-avatars'
  AND EXISTS (
    SELECT 1 FROM public.family_members fm
    WHERE fm.user_id = auth.uid()
      AND fm.family_id = ((storage.foldername(name))[1])::uuid
  )
);

CREATE POLICY "Org staff and admins can view family avatars"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'family-avatars'
  AND (
    public.is_managing_org_member(((storage.foldername(name))[1])::uuid, auth.uid())
    OR public.is_super_admin(auth.uid())
  )
);

-- 2. bill-attachments: consolidate delete policies with ownership verification
DROP POLICY IF EXISTS "Users can delete their own attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own bill attachments" ON storage.objects;

CREATE POLICY "Owners can delete their bill attachments"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'bill-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND NOT EXISTS (
    SELECT 1 FROM public.financial_requests fr
    WHERE fr.attachment_url = 'storage://bill-attachments/' || objects.name
      AND fr.requester_id <> auth.uid()
  )
);

DROP POLICY IF EXISTS "Family members can view bill attachments" ON storage.objects;

CREATE POLICY "Family members can view bill attachments"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'bill-attachments'
  AND (
    EXISTS (
      SELECT 1
      FROM public.financial_requests fr
      JOIN public.family_members fm ON fm.family_id = fr.family_id
      WHERE fm.user_id = auth.uid()
        AND fr.attachment_url = 'storage://bill-attachments/' || objects.name
    )
    OR (
      (storage.foldername(name))[1] = auth.uid()::text
      AND NOT EXISTS (
        SELECT 1 FROM public.financial_requests fr2
        WHERE fr2.attachment_url = 'storage://bill-attachments/' || objects.name
          AND fr2.requester_id <> auth.uid()
      )
    )
  )
);

-- 3. financial_requests: prevent falsified payment attribution / field tampering
DROP POLICY IF EXISTS "Family members can mark requests as paid" ON storage.objects;
DROP POLICY IF EXISTS "Family members can mark requests as paid" ON public.financial_requests;

CREATE POLICY "Family members can mark requests as paid"
ON public.financial_requests FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.family_members fm
    WHERE fm.family_id = financial_requests.family_id
      AND fm.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.family_members fm
    WHERE fm.family_id = financial_requests.family_id
      AND fm.user_id = auth.uid()
  )
  AND (paid_by_user_id IS NULL OR paid_by_user_id = auth.uid()
       OR public.is_family_admin_or_moderator(family_id, auth.uid()))
  AND (payment_confirmed_by_user_id IS NULL
       OR payment_confirmed_by_user_id = auth.uid()
       OR requester_id = auth.uid()
       OR public.is_family_admin_or_moderator(family_id, auth.uid()))
);

CREATE OR REPLACE FUNCTION public.enforce_financial_request_immutable_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.requester_id IS DISTINCT FROM OLD.requester_id
     OR NEW.family_id IS DISTINCT FROM OLD.family_id THEN
    RAISE EXCEPTION 'Requester and family of a financial request cannot be changed';
  END IF;

  -- Only the requester (while pending) or admins/moderators may change the amount
  IF NEW.amount IS DISTINCT FROM OLD.amount
     AND NOT (
       (OLD.requester_id = auth.uid() AND OLD.status = 'pending'::request_status)
       OR public.is_family_admin_or_moderator(OLD.family_id, auth.uid())
     ) THEN
    RAISE EXCEPTION 'Only the requester or a family moderator can change the amount';
  END IF;

  -- Payment attribution must reference the acting user unless a moderator acts
  IF NEW.paid_by_user_id IS DISTINCT FROM OLD.paid_by_user_id
     AND NEW.paid_by_user_id IS NOT NULL
     AND NEW.paid_by_user_id <> auth.uid()
     AND NOT public.is_family_admin_or_moderator(OLD.family_id, auth.uid()) THEN
    RAISE EXCEPTION 'You can only record yourself as the payer';
  END IF;

  IF NEW.payment_confirmed_by_user_id IS DISTINCT FROM OLD.payment_confirmed_by_user_id
     AND NEW.payment_confirmed_by_user_id IS NOT NULL
     AND NEW.payment_confirmed_by_user_id <> auth.uid()
     AND NOT public.is_family_admin_or_moderator(OLD.family_id, auth.uid()) THEN
    RAISE EXCEPTION 'You can only record yourself as confirming payment';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_financial_request_immutable_fields ON public.financial_requests;
CREATE TRIGGER enforce_financial_request_immutable_fields
BEFORE UPDATE ON public.financial_requests
FOR EACH ROW EXECUTE FUNCTION public.enforce_financial_request_immutable_fields();

-- 4. Remove duplicate/overlapping policies
DROP POLICY IF EXISTS "Authors can delete their notes" ON public.provider_notes;
DROP POLICY IF EXISTS "Authors can update their notes" ON public.provider_notes;
DROP POLICY IF EXISTS "dtr_select" ON public.drug_test_results;
DROP POLICY IF EXISTS "dtr_modify" ON public.drug_test_results;