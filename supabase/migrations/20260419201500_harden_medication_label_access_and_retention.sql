DROP POLICY IF EXISTS "Authenticated users can view medication labels" ON storage.objects;
DROP POLICY IF EXISTS "Family members can upload medication labels" ON storage.objects;

CREATE POLICY "Authorized users can upload medication labels"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'medication-labels'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.family_members fm
    WHERE fm.user_id = auth.uid()
      AND split_part(name, '/', 1) = fm.family_id::text
  )
);

CREATE POLICY "Authorized users can view medication labels"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'medication-labels'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.medications m
    JOIN public.family_members fm ON fm.family_id = m.family_id
    WHERE (
      m.label_image_url = storage.objects.name
      OR storage.objects.name = ANY(COALESCE(m.label_image_urls, '{}'::text[]))
    )
      AND fm.user_id = auth.uid()
      AND (
        fm.role IN ('admin', 'moderator')
        OR m.user_id = auth.uid()
      )
  )
);

CREATE POLICY "Authorized users can delete medication labels"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'medication-labels'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.medications m
    JOIN public.family_members fm ON fm.family_id = m.family_id
    WHERE (
      m.label_image_url = storage.objects.name
      OR storage.objects.name = ANY(COALESCE(m.label_image_urls, '{}'::text[]))
    )
      AND fm.user_id = auth.uid()
      AND fm.role IN ('admin', 'moderator')
  )
);

ALTER TABLE public.medications
ADD COLUMN IF NOT EXISTS label_images_verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS label_images_verified_by UUID,
ADD COLUMN IF NOT EXISTS label_images_deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS label_images_deleted_by UUID,
ADD COLUMN IF NOT EXISTS label_disclaimer_accepted_at TIMESTAMP WITH TIME ZONE;
