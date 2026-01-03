-- Step 1: Add 'admin' to the family_role enum
ALTER TYPE public.family_role ADD VALUE IF NOT EXISTS 'admin';