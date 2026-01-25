-- Add new provider roles to family_role enum
ALTER TYPE public.family_role ADD VALUE IF NOT EXISTS 'sober_living_manager';
ALTER TYPE public.family_role ADD VALUE IF NOT EXISTS 'program_admin';
ALTER TYPE public.family_role ADD VALUE IF NOT EXISTS 'interventionist';