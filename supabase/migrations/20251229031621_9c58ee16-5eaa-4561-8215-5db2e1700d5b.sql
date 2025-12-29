-- Create storage bucket for bill attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('bill-attachments', 'bill-attachments', true);

-- RLS policies for bill attachments bucket
CREATE POLICY "Family members can upload bill attachments"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'bill-attachments' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Anyone can view bill attachments"
ON storage.objects
FOR SELECT
USING (bucket_id = 'bill-attachments');

CREATE POLICY "Users can delete their own attachments"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'bill-attachments' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Add attachment_url column to financial_requests
ALTER TABLE public.financial_requests
ADD COLUMN attachment_url TEXT;