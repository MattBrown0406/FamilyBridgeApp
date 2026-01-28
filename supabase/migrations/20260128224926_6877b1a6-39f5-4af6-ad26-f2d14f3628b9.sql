-- Create storage bucket for provider documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('provider-documents', 'provider-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Create table for document metadata
CREATE TABLE public.provider_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  family_id UUID REFERENCES public.families(id) ON DELETE SET NULL,
  uploaded_by UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  document_type TEXT NOT NULL DEFAULT 'intervention_letter',
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.provider_documents ENABLE ROW LEVEL SECURITY;

-- Create index for faster queries
CREATE INDEX idx_provider_documents_org ON public.provider_documents(organization_id);
CREATE INDEX idx_provider_documents_family ON public.provider_documents(family_id);
CREATE INDEX idx_provider_documents_uploaded_by ON public.provider_documents(uploaded_by);

-- RLS Policies: Only org members can view/manage documents
CREATE POLICY "Org members can view their org documents"
ON public.provider_documents
FOR SELECT
TO authenticated
USING (
  public.is_org_member(organization_id, auth.uid())
  OR public.is_super_admin(auth.uid())
);

CREATE POLICY "Org members can insert documents"
ON public.provider_documents
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_org_member(organization_id, auth.uid())
  AND uploaded_by = auth.uid()
);

CREATE POLICY "Document uploader or org admin can update"
ON public.provider_documents
FOR UPDATE
TO authenticated
USING (
  uploaded_by = auth.uid()
  OR public.is_org_admin(organization_id, auth.uid())
  OR public.is_super_admin(auth.uid())
);

CREATE POLICY "Document uploader or org admin can delete"
ON public.provider_documents
FOR DELETE
TO authenticated
USING (
  uploaded_by = auth.uid()
  OR public.is_org_admin(organization_id, auth.uid())
  OR public.is_super_admin(auth.uid())
);

-- Storage policies for provider-documents bucket
CREATE POLICY "Org members can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'provider-documents'
  AND (storage.foldername(name))[1] IN (
    SELECT o.id::text FROM public.organizations o
    JOIN public.organization_members om ON om.organization_id = o.id
    WHERE om.user_id = auth.uid()
  )
);

CREATE POLICY "Org members can view their org documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'provider-documents'
  AND (
    (storage.foldername(name))[1] IN (
      SELECT o.id::text FROM public.organizations o
      JOIN public.organization_members om ON om.organization_id = o.id
      WHERE om.user_id = auth.uid()
    )
    OR public.is_super_admin(auth.uid())
  )
);

CREATE POLICY "Org admins can delete documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'provider-documents'
  AND (
    (storage.foldername(name))[1] IN (
      SELECT o.id::text FROM public.organizations o
      JOIN public.organization_members om ON om.organization_id = o.id
      WHERE om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
    )
    OR public.is_super_admin(auth.uid())
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_provider_documents_updated_at
BEFORE UPDATE ON public.provider_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();