-- Allow boundary creators to update their own boundaries
CREATE POLICY "Creators can update their own boundaries"
ON public.family_boundaries
FOR UPDATE
USING (auth.uid() = created_by);

-- Allow boundary creators to delete their own boundaries
CREATE POLICY "Creators can delete their own boundaries"
ON public.family_boundaries
FOR DELETE
USING (auth.uid() = created_by);