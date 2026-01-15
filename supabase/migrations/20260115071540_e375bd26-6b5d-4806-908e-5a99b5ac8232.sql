-- Add avatar_url column to families table
ALTER TABLE public.families 
ADD COLUMN avatar_url TEXT;

-- Create storage bucket for family avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('family-avatars', 'family-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload avatars for families they are admin/moderator of
CREATE POLICY "Family admins can upload avatars"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'family-avatars' 
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM public.family_members fm
    WHERE fm.user_id = auth.uid()
    AND fm.family_id = (storage.foldername(name))[1]::uuid
    AND fm.role IN ('admin', 'moderator')
  )
);

-- Allow authenticated users to update avatars for families they are admin/moderator of
CREATE POLICY "Family admins can update avatars"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'family-avatars' 
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM public.family_members fm
    WHERE fm.user_id = auth.uid()
    AND fm.family_id = (storage.foldername(name))[1]::uuid
    AND fm.role IN ('admin', 'moderator')
  )
);

-- Allow authenticated users to delete avatars for families they are admin/moderator of
CREATE POLICY "Family admins can delete avatars"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'family-avatars' 
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM public.family_members fm
    WHERE fm.user_id = auth.uid()
    AND fm.family_id = (storage.foldername(name))[1]::uuid
    AND fm.role IN ('admin', 'moderator')
  )
);

-- Allow anyone to view family avatars (public bucket)
CREATE POLICY "Anyone can view family avatars"
ON storage.objects
FOR SELECT
USING (bucket_id = 'family-avatars');