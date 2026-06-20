DROP POLICY IF EXISTS "Family members can view assigned provider intervention documents" ON public.provider_documents;
DROP POLICY IF EXISTS "Family members can view assigned provider intervention files" ON storage.objects;

CREATE POLICY "Family members can view assigned provider intervention documents"
ON public.provider_documents
FOR SELECT
TO authenticated
USING (
  document_type = 'intervention_letter'
  AND family_id IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.family_members fm
    WHERE fm.family_id = provider_documents.family_id
      AND fm.user_id = auth.uid()
  )
);

CREATE POLICY "Family members can view assigned provider intervention files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'provider-documents'
  AND EXISTS (
    SELECT 1
    FROM public.provider_documents pd
    JOIN public.family_members fm ON fm.family_id = pd.family_id
    WHERE pd.file_path = storage.objects.name
      AND pd.document_type = 'intervention_letter'
      AND fm.user_id = auth.uid()
  )
);