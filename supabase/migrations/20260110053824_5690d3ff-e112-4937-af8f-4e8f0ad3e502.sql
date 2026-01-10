-- Create family_health_status table to track family system health
CREATE TABLE public.family_health_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'stable' CHECK (status IN ('crisis', 'tension', 'stable', 'improving')),
  status_reason TEXT,
  metrics JSONB DEFAULT '{}'::jsonb,
  calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(family_id)
);

-- Enable RLS
ALTER TABLE public.family_health_status ENABLE ROW LEVEL SECURITY;

-- Family members can view their family's health status
CREATE POLICY "Family members can view health status"
ON public.family_health_status
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.family_members fm
    WHERE fm.family_id = family_health_status.family_id
    AND fm.user_id = auth.uid()
  )
);

-- Only the system (via service role) can insert/update health status
-- This is handled by the edge function using service role key

-- Create index for faster lookups
CREATE INDEX idx_family_health_status_family_id ON public.family_health_status(family_id);

-- Add trigger for updated_at
CREATE TRIGGER update_family_health_status_updated_at
BEFORE UPDATE ON public.family_health_status
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();