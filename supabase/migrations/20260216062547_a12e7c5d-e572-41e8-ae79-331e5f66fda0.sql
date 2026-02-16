-- Add talking_to columns to coaching_sessions and coaching_screenshots
ALTER TABLE public.coaching_sessions 
  ADD COLUMN talking_to_user_id UUID REFERENCES auth.users(id),
  ADD COLUMN talking_to_name TEXT;

ALTER TABLE public.coaching_screenshots
  ADD COLUMN talking_to_user_id UUID REFERENCES auth.users(id),
  ADD COLUMN talking_to_name TEXT;