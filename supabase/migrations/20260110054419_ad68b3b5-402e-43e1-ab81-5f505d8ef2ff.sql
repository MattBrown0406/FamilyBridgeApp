-- Add 'concern' as a valid status and update the check constraint
ALTER TABLE public.family_health_status 
DROP CONSTRAINT IF EXISTS family_health_status_status_check;

ALTER TABLE public.family_health_status 
ADD CONSTRAINT family_health_status_status_check 
CHECK (status IN ('crisis', 'concern', 'tension', 'stable', 'improving'));

-- Create a table to track liquor license warnings
CREATE TABLE public.liquor_license_warnings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  checkin_id UUID NOT NULL REFERENCES public.meeting_checkins(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  location_address TEXT,
  license_type TEXT,
  warned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  acknowledged_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.liquor_license_warnings ENABLE ROW LEVEL SECURITY;

-- Family members can view warnings for their family
CREATE POLICY "Family members can view liquor license warnings"
ON public.liquor_license_warnings
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.family_members fm
    WHERE fm.family_id = liquor_license_warnings.family_id
    AND fm.user_id = auth.uid()
  )
);

-- Admins/moderators can acknowledge warnings
CREATE POLICY "Admins and moderators can update warnings"
ON public.liquor_license_warnings
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.family_members fm
    WHERE fm.family_id = liquor_license_warnings.family_id
    AND fm.user_id = auth.uid()
    AND fm.role IN ('admin', 'moderator')
  )
);

-- Create index for faster lookups
CREATE INDEX idx_liquor_license_warnings_family_id ON public.liquor_license_warnings(family_id);
CREATE INDEX idx_liquor_license_warnings_checkin_id ON public.liquor_license_warnings(checkin_id);

-- Enable realtime for health status updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.family_health_status;
ALTER PUBLICATION supabase_realtime ADD TABLE public.liquor_license_warnings;