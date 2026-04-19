ALTER TABLE public.medications
ADD COLUMN IF NOT EXISTS label_image_urls TEXT[] DEFAULT '{}'::text[],
ADD COLUMN IF NOT EXISTS label_analysis_confidence INTEGER,
ADD COLUMN IF NOT EXISTS label_analysis_raw_text TEXT,
ADD COLUMN IF NOT EXISTS label_analysis_field_confidence JSONB NOT NULL DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS label_capture_mode TEXT;

UPDATE public.medications
SET label_image_urls = CASE
  WHEN label_image_url IS NOT NULL AND (label_image_urls IS NULL OR cardinality(label_image_urls) = 0)
    THEN ARRAY[label_image_url]
  ELSE COALESCE(label_image_urls, '{}'::text[])
END;
