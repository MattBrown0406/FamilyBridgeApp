-- Add therapist and case_manager roles to family_role enum
ALTER TYPE public.family_role ADD VALUE IF NOT EXISTS 'therapist';
ALTER TYPE public.family_role ADD VALUE IF NOT EXISTS 'case_manager';