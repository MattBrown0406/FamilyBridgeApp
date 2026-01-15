-- Drop the overly permissive policy that allows all family members to view patterns
DROP POLICY IF EXISTS "Family members can view each other's patterns" ON public.emotional_patterns;

-- Keep the policy for users viewing their own patterns (already exists)
-- Keep the policy for admins/moderators to acknowledge patterns (already exists)

-- Add a new policy for moderators/admins to view patterns (they need to see them to acknowledge)
CREATE POLICY "Moderators and admins can view family patterns"
ON public.emotional_patterns
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.family_members fm
    WHERE fm.family_id = emotional_patterns.family_id
      AND fm.user_id = auth.uid()
      AND fm.role IN ('admin', 'moderator')
  )
);