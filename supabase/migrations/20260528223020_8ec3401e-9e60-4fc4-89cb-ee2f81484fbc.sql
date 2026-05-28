ALTER TYPE public.family_role ADD VALUE IF NOT EXISTS 'co_moderator';

DO $$ BEGIN
  CREATE TYPE public.transfer_reason AS ENUM (
    'step_up','step_down','relapse_higher_loc','aftercare_transition',
    'sober_living','provider_change','geographic_move','other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;