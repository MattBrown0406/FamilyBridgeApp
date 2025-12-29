-- Create family_goals table
CREATE TABLE public.family_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  goal_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.family_goals ENABLE ROW LEVEL SECURITY;

-- Family members can view goals
CREATE POLICY "Family members can view goals"
ON public.family_goals
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.family_id = family_goals.family_id
    AND fm.user_id = auth.uid()
  )
);

-- Moderators can create goals
CREATE POLICY "Moderators can create goals"
ON public.family_goals
FOR INSERT
WITH CHECK (
  auth.uid() = created_by AND
  EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.family_id = family_goals.family_id
    AND fm.user_id = auth.uid()
    AND fm.role = 'moderator'
  )
);

-- Moderators can update goals
CREATE POLICY "Moderators can update goals"
ON public.family_goals
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.family_id = family_goals.family_id
    AND fm.user_id = auth.uid()
    AND fm.role = 'moderator'
  )
);

-- Moderators can delete goals
CREATE POLICY "Moderators can delete goals"
ON public.family_goals
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.family_id = family_goals.family_id
    AND fm.user_id = auth.uid()
    AND fm.role = 'moderator'
  )
);