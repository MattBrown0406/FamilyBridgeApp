-- Create family_documents table for family-level document storage
CREATE TABLE public.family_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  document_type TEXT NOT NULL DEFAULT 'other',
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  -- For intervention letters analyzed by FIIS
  fiis_analyzed BOOLEAN DEFAULT false,
  fiis_analyzed_at TIMESTAMP WITH TIME ZONE,
  boundaries_extracted INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.family_documents ENABLE ROW LEVEL SECURITY;

-- Family members can view documents in their family
CREATE POLICY "Family members can view documents"
ON public.family_documents
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.family_members fm
    WHERE fm.family_id = family_documents.family_id
      AND fm.user_id = auth.uid()
  )
  OR public.is_managing_org_member(family_id, auth.uid())
  OR public.is_super_admin(auth.uid())
);

-- Family members can upload documents
CREATE POLICY "Family members can upload documents"
ON public.family_documents
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.family_members fm
    WHERE fm.family_id = family_documents.family_id
      AND fm.user_id = auth.uid()
  )
  OR public.is_managing_org_member(family_id, auth.uid())
);

-- Uploaders, moderators, and org members can delete documents
CREATE POLICY "Authorized users can delete documents"
ON public.family_documents
FOR DELETE
USING (
  uploaded_by = auth.uid()
  OR public.is_family_moderator(family_id, auth.uid())
  OR public.is_managing_org_member(family_id, auth.uid())
  OR public.is_super_admin(auth.uid())
);

-- Authorized users can update FIIS analysis status
CREATE POLICY "Authorized users can update documents"
ON public.family_documents
FOR UPDATE
USING (
  uploaded_by = auth.uid()
  OR public.is_family_moderator(family_id, auth.uid())
  OR public.is_managing_org_member(family_id, auth.uid())
  OR public.is_super_admin(auth.uid())
);

-- Create storage bucket for family documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('family-documents', 'family-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Family members can upload to family-documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'family-documents'
  AND EXISTS (
    SELECT 1 FROM public.family_members fm
    WHERE fm.family_id = (storage.foldername(name))[1]::uuid
      AND fm.user_id = auth.uid()
  )
);

CREATE POLICY "Family members can view family-documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'family-documents'
  AND (
    EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE fm.family_id = (storage.foldername(name))[1]::uuid
        AND fm.user_id = auth.uid()
    )
    OR public.is_super_admin(auth.uid())
  )
);

CREATE POLICY "Authorized users can delete from family-documents"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'family-documents'
  AND (
    EXISTS (
      SELECT 1 FROM public.family_documents fd
      WHERE fd.file_path = name
        AND (
          fd.uploaded_by = auth.uid()
          OR public.is_family_moderator(fd.family_id, auth.uid())
          OR public.is_managing_org_member(fd.family_id, auth.uid())
        )
    )
    OR public.is_super_admin(auth.uid())
  )
);

-- Create index for faster lookups
CREATE INDEX idx_family_documents_family_id ON public.family_documents(family_id);
CREATE INDEX idx_family_documents_document_type ON public.family_documents(document_type);