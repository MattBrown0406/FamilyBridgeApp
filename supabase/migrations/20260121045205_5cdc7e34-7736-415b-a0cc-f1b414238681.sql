-- Add policy for super admins to view all families
CREATE POLICY "Super admins can view all families"
ON public.families
FOR SELECT
TO authenticated
USING (is_super_admin(auth.uid()));