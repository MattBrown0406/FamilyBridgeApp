-- Add new meeting types to the enum
ALTER TYPE public.meeting_type ADD VALUE IF NOT EXISTS 'Refuge Recovery';
ALTER TYPE public.meeting_type ADD VALUE IF NOT EXISTS 'Smart Recovery';
ALTER TYPE public.meeting_type ADD VALUE IF NOT EXISTS 'ACA';
ALTER TYPE public.meeting_type ADD VALUE IF NOT EXISTS 'CoDA';
ALTER TYPE public.meeting_type ADD VALUE IF NOT EXISTS 'Families Anonymous';
ALTER TYPE public.meeting_type ADD VALUE IF NOT EXISTS 'Celebrate Recovery';