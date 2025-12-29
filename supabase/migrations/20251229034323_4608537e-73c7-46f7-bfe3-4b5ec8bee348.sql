-- Create enum for relationship types
CREATE TYPE public.relationship_type AS ENUM (
  'recovering',
  'parent',
  'spouse_partner',
  'sibling',
  'child',
  'grandparent',
  'aunt_uncle',
  'cousin',
  'friend',
  'other'
);

-- Add relationship_type column to family_members
ALTER TABLE public.family_members 
ADD COLUMN relationship_type public.relationship_type;

-- Make it required for new members (existing members get NULL but new ones must provide it)
-- We'll enforce this at the application/edge function level