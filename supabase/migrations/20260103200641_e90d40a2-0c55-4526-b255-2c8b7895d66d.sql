-- Create table for family values selections
CREATE TABLE public.family_values (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  value_key text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  selected_by uuid NOT NULL,
  UNIQUE(family_id, value_key)
);

-- Enable RLS
ALTER TABLE public.family_values ENABLE ROW LEVEL SECURITY;

-- Family members can view their family's values
CREATE POLICY "Family members can view values"
ON public.family_values
FOR SELECT
USING (is_family_member(family_id, auth.uid()));

-- Moderators can insert values
CREATE POLICY "Moderators can insert values"
ON public.family_values
FOR INSERT
WITH CHECK (
  is_family_moderator(family_id, auth.uid()) 
  AND auth.uid() = selected_by
);

-- Moderators can update values
CREATE POLICY "Moderators can update values"
ON public.family_values
FOR UPDATE
USING (is_family_moderator(family_id, auth.uid()));

-- Moderators can delete values
CREATE POLICY "Moderators can delete values"
ON public.family_values
FOR DELETE
USING (is_family_moderator(family_id, auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_family_values_updated_at
BEFORE UPDATE ON public.family_values
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();