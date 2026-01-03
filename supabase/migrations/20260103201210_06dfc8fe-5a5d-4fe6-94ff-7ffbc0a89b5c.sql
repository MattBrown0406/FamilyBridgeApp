-- Create table for family common goals (distinct from the milestone goals)
CREATE TABLE public.family_common_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  goal_key TEXT NOT NULL,
  selected_by UUID NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(family_id, goal_key)
);

-- Enable RLS
ALTER TABLE public.family_common_goals ENABLE ROW LEVEL SECURITY;

-- Policy: Family members can view goals
CREATE POLICY "Family members can view common goals"
ON public.family_common_goals FOR SELECT
USING (is_family_member(family_id, auth.uid()));

-- Policy: Moderators can insert goals
CREATE POLICY "Moderators can insert common goals"
ON public.family_common_goals FOR INSERT
WITH CHECK (is_family_moderator(family_id, auth.uid()) AND auth.uid() = selected_by);

-- Policy: Moderators can update goals
CREATE POLICY "Moderators can update common goals"
ON public.family_common_goals FOR UPDATE
USING (is_family_moderator(family_id, auth.uid()));

-- Policy: Moderators can delete goals
CREATE POLICY "Moderators can delete common goals"
ON public.family_common_goals FOR DELETE
USING (is_family_moderator(family_id, auth.uid()));