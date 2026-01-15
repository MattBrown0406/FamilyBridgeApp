-- Create sobriety_journeys table to track recovery progress
CREATE TABLE public.sobriety_journeys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  reset_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, family_id)
);

-- Create sobriety_milestones table to track achieved milestones
CREATE TABLE public.sobriety_milestones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  journey_id UUID NOT NULL REFERENCES public.sobriety_journeys(id) ON DELETE CASCADE,
  milestone_days INTEGER NOT NULL,
  achieved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  celebrated_by_family BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(journey_id, milestone_days)
);

-- Enable RLS on both tables
ALTER TABLE public.sobriety_journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sobriety_milestones ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sobriety_journeys

-- Users can view their own journey
CREATE POLICY "Users can view their own sobriety journey"
ON public.sobriety_journeys
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own journey
CREATE POLICY "Users can create their own sobriety journey"
ON public.sobriety_journeys
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own journey
CREATE POLICY "Users can update their own sobriety journey"
ON public.sobriety_journeys
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Family members can view journeys in their family (for celebrations)
CREATE POLICY "Family members can view journeys in their family"
ON public.sobriety_journeys
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.family_members fm
    WHERE fm.family_id = sobriety_journeys.family_id
    AND fm.user_id = auth.uid()
  )
);

-- RLS Policies for sobriety_milestones

-- Users can view milestones for their own journey
CREATE POLICY "Users can view their own milestones"
ON public.sobriety_milestones
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.sobriety_journeys sj
    WHERE sj.id = sobriety_milestones.journey_id
    AND sj.user_id = auth.uid()
  )
);

-- Users can create milestones for their own journey
CREATE POLICY "Users can create their own milestones"
ON public.sobriety_milestones
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.sobriety_journeys sj
    WHERE sj.id = sobriety_milestones.journey_id
    AND sj.user_id = auth.uid()
  )
);

-- Users can update their own milestones
CREATE POLICY "Users can update their own milestones"
ON public.sobriety_milestones
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.sobriety_journeys sj
    WHERE sj.id = sobriety_milestones.journey_id
    AND sj.user_id = auth.uid()
  )
);

-- Family members can view milestones for journeys in their family
CREATE POLICY "Family members can view milestones in their family"
ON public.sobriety_milestones
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.sobriety_journeys sj
    JOIN public.family_members fm ON fm.family_id = sj.family_id
    WHERE sj.id = sobriety_milestones.journey_id
    AND fm.user_id = auth.uid()
  )
);

-- Family members can mark milestones as celebrated
CREATE POLICY "Family members can celebrate milestones"
ON public.sobriety_milestones
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.sobriety_journeys sj
    JOIN public.family_members fm ON fm.family_id = sj.family_id
    WHERE sj.id = sobriety_milestones.journey_id
    AND fm.user_id = auth.uid()
  )
);

-- Create trigger for updated_at on sobriety_journeys
CREATE TRIGGER update_sobriety_journeys_updated_at
BEFORE UPDATE ON public.sobriety_journeys
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for milestone celebrations
ALTER PUBLICATION supabase_realtime ADD TABLE public.sobriety_milestones;