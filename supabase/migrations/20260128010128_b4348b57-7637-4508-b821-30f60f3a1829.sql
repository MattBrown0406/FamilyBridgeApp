-- Create storage bucket for medication labels
INSERT INTO storage.buckets (id, name, public)
VALUES ('medication-labels', 'medication-labels', false)
ON CONFLICT (id) DO NOTHING;

-- Create policy for family members to upload medication labels
CREATE POLICY "Family members can upload medication labels"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'medication-labels' 
  AND auth.uid() IS NOT NULL
);

-- Create policy for family members to view medication labels
CREATE POLICY "Authenticated users can view medication labels"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'medication-labels' 
  AND auth.uid() IS NOT NULL
);

-- Create function to get medication compliance for FIIS
CREATE OR REPLACE FUNCTION public.get_medication_compliance_summary(_family_id uuid, _days integer DEFAULT 7)
RETURNS TABLE (
  total_scheduled bigint,
  total_taken bigint,
  total_skipped bigint,
  total_missed bigint,
  compliance_rate numeric,
  medications_count bigint,
  recent_alerts bigint
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  WITH dose_stats AS (
    SELECT 
      COUNT(*) AS total_scheduled,
      COUNT(*) FILTER (WHERE taken_at IS NOT NULL) AS total_taken,
      COUNT(*) FILTER (WHERE skipped = true) AS total_skipped,
      COUNT(*) FILTER (WHERE taken_at IS NULL AND skipped = false AND scheduled_at < NOW()) AS total_missed
    FROM public.medication_doses
    WHERE family_id = _family_id
      AND scheduled_at >= NOW() - (_days || ' days')::interval
      AND scheduled_at <= NOW()
  ),
  med_count AS (
    SELECT COUNT(*) AS cnt
    FROM public.medications
    WHERE family_id = _family_id AND is_active = true
  ),
  alert_count AS (
    SELECT COUNT(*) AS cnt
    FROM public.medication_alerts
    WHERE family_id = _family_id
      AND created_at >= NOW() - (_days || ' days')::interval
      AND acknowledged_at IS NULL
  )
  SELECT 
    ds.total_scheduled,
    ds.total_taken,
    ds.total_skipped,
    ds.total_missed,
    CASE WHEN ds.total_scheduled > 0 
      THEN ROUND((ds.total_taken::numeric / ds.total_scheduled::numeric) * 100, 1)
      ELSE NULL 
    END AS compliance_rate,
    mc.cnt AS medications_count,
    ac.cnt AS recent_alerts
  FROM dose_stats ds, med_count mc, alert_count ac;
$$;