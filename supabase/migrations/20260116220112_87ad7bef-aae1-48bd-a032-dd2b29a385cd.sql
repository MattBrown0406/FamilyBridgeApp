-- Create aftercare_plans table for treatment discharge recommendations
CREATE TABLE public.aftercare_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT
);

-- Create aftercare_recommendations table for individual recommendations
CREATE TABLE public.aftercare_recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.aftercare_plans(id) ON DELETE CASCADE,
  recommendation_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  facility_name TEXT,
  recommended_duration TEXT,
  frequency TEXT,
  therapy_type TEXT,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create enum-like constraint for recommendation types
ALTER TABLE public.aftercare_recommendations 
ADD CONSTRAINT valid_recommendation_type CHECK (
  recommendation_type IN (
    'sober_living',
    'iop',
    'weekly_therapy',
    'meeting_attendance',
    'alanon_meetings',
    'individual_therapy',
    'couples_therapy',
    'family_therapy',
    'other'
  )
);

-- Enable RLS
ALTER TABLE public.aftercare_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aftercare_recommendations ENABLE ROW LEVEL SECURITY;

-- RLS policies for aftercare_plans
CREATE POLICY "Family members can view aftercare plans"
ON public.aftercare_plans
FOR SELECT
USING (is_family_member(family_id, auth.uid()));

CREATE POLICY "Moderators can create aftercare plans"
ON public.aftercare_plans
FOR INSERT
WITH CHECK (is_family_moderator(family_id, auth.uid()));

CREATE POLICY "Moderators can update aftercare plans"
ON public.aftercare_plans
FOR UPDATE
USING (is_family_moderator(family_id, auth.uid()));

CREATE POLICY "Moderators can delete aftercare plans"
ON public.aftercare_plans
FOR DELETE
USING (is_family_moderator(family_id, auth.uid()));

-- RLS policies for aftercare_recommendations
CREATE POLICY "Family members can view recommendations"
ON public.aftercare_recommendations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.aftercare_plans ap
    WHERE ap.id = plan_id
    AND is_family_member(ap.family_id, auth.uid())
  )
);

CREATE POLICY "Moderators can create recommendations"
ON public.aftercare_recommendations
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.aftercare_plans ap
    WHERE ap.id = plan_id
    AND is_family_moderator(ap.family_id, auth.uid())
  )
);

CREATE POLICY "Moderators can update recommendations"
ON public.aftercare_recommendations
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.aftercare_plans ap
    WHERE ap.id = plan_id
    AND is_family_moderator(ap.family_id, auth.uid())
  )
);

CREATE POLICY "Moderators can delete recommendations"
ON public.aftercare_recommendations
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.aftercare_plans ap
    WHERE ap.id = plan_id
    AND is_family_moderator(ap.family_id, auth.uid())
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_aftercare_plans_updated_at
BEFORE UPDATE ON public.aftercare_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_aftercare_recommendations_updated_at
BEFORE UPDATE ON public.aftercare_recommendations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();