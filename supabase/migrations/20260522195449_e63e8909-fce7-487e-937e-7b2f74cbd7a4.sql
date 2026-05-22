
-- ============================================================
-- 1. Bill attachments: make bucket private + scope SELECT to family
-- ============================================================
UPDATE storage.buckets SET public = false WHERE id = 'bill-attachments';

DROP POLICY IF EXISTS "Anyone can view bill attachments" ON storage.objects;
DROP POLICY IF EXISTS "Family members can upload bill attachments" ON storage.objects;
DROP POLICY IF EXISTS "Family members can view bill attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own bill attachments" ON storage.objects;

CREATE POLICY "Family members can view bill attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'bill-attachments'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM public.financial_requests fr
      JOIN public.family_members fm ON fm.family_id = fr.family_id
      WHERE fm.user_id = auth.uid()
        AND fr.attachment_url = 'storage://bill-attachments/' || storage.objects.name
    )
  )
);

CREATE POLICY "Users can upload bill attachments to their own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'bill-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own bill attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'bill-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================================
-- 2. Coaching screenshots: restrict to owning family (path = {family_id}/...)
-- ============================================================
DROP POLICY IF EXISTS "Family members can view coaching screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Family members can upload coaching screenshots" ON storage.objects;

CREATE POLICY "Family members can view coaching screenshots"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'coaching-screenshots'
  AND EXISTS (
    SELECT 1 FROM public.family_members fm
    WHERE fm.user_id = auth.uid()
      AND fm.family_id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Family members can upload coaching screenshots"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'coaching-screenshots'
  AND EXISTS (
    SELECT 1 FROM public.family_members fm
    WHERE fm.user_id = auth.uid()
      AND fm.family_id::text = (storage.foldername(name))[1]
  )
);

-- ============================================================
-- 3. Medication labels: restrict to owning family (path = {family_id}/...)
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can view medication labels" ON storage.objects;
DROP POLICY IF EXISTS "Family members can view medication labels" ON storage.objects;
DROP POLICY IF EXISTS "Family members can upload medication labels" ON storage.objects;
DROP POLICY IF EXISTS "Family members can delete medication labels" ON storage.objects;

CREATE POLICY "Family members can view medication labels"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'medication-labels'
  AND EXISTS (
    SELECT 1 FROM public.family_members fm
    WHERE fm.user_id = auth.uid()
      AND fm.family_id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Family members can upload medication labels"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'medication-labels'
  AND EXISTS (
    SELECT 1 FROM public.family_members fm
    WHERE fm.user_id = auth.uid()
      AND fm.family_id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Family members can delete medication labels"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'medication-labels'
  AND EXISTS (
    SELECT 1 FROM public.family_members fm
    WHERE fm.user_id = auth.uid()
      AND fm.family_id::text = (storage.foldername(name))[1]
  )
);

-- ============================================================
-- 4. Organization members: fix self-referential INSERT policy
-- ============================================================
DROP POLICY IF EXISTS "Org owners can manage members" ON public.organization_members;

CREATE POLICY "Org owners can manage members"
ON public.organization_members FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
      AND om.role = 'owner'::provider_role
  )
);

-- ============================================================
-- 5. Private conversation messages: fix self-referential policy
-- ============================================================
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.private_conversation_messages;
DROP POLICY IF EXISTS "Users can send messages to their conversations" ON public.private_conversation_messages;

CREATE POLICY "Users can view messages in their conversations"
ON public.private_conversation_messages FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.private_conversation_participants pcp
    WHERE pcp.conversation_id = private_conversation_messages.conversation_id
      AND pcp.user_id = auth.uid()
  )
);

CREATE POLICY "Users can send messages to their conversations"
ON public.private_conversation_messages FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM public.private_conversation_participants pcp
    WHERE pcp.conversation_id = private_conversation_messages.conversation_id
      AND pcp.user_id = auth.uid()
  )
);

-- ============================================================
-- 6. Realtime: require authentication for channel subscriptions
-- ============================================================
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can use realtime" ON realtime.messages;

CREATE POLICY "Authenticated users can use realtime"
ON realtime.messages FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can broadcast"
ON realtime.messages FOR INSERT
TO authenticated
WITH CHECK (true);
