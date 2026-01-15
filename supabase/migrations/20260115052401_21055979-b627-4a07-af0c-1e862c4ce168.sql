-- Create table to track FIIS disclaimer acknowledgments
CREATE TABLE public.fiis_disclaimer_acknowledgments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  acknowledged_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT,
  UNIQUE(user_id, family_id)
);

-- Enable RLS
ALTER TABLE public.fiis_disclaimer_acknowledgments ENABLE ROW LEVEL SECURITY;

-- Users can view their own acknowledgments
CREATE POLICY "Users can view their own acknowledgments"
ON public.fiis_disclaimer_acknowledgments
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own acknowledgment
CREATE POLICY "Users can acknowledge disclaimer"
ON public.fiis_disclaimer_acknowledgments
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Moderators and super admins can view all acknowledgments in their families
CREATE POLICY "Moderators can view family acknowledgments"
ON public.fiis_disclaimer_acknowledgments
FOR SELECT
USING (
  public.is_family_admin_or_moderator(family_id, auth.uid()) OR
  public.is_super_admin(auth.uid())
);

-- Add index for faster lookups
CREATE INDEX idx_fiis_disclaimer_user_family ON public.fiis_disclaimer_acknowledgments(user_id, family_id);