-- Expand pattern_category to include fellowship-specific work patterns
ALTER TABLE public.fiis_calibration_patterns 
DROP CONSTRAINT IF EXISTS fiis_calibration_patterns_pattern_category_check;

ALTER TABLE public.fiis_calibration_patterns 
ADD CONSTRAINT fiis_calibration_patterns_pattern_category_check 
CHECK (pattern_category = ANY (ARRAY[
  -- Existing categories
  'relapse_warning', 
  'boundary_erosion', 
  'financial_manipulation', 
  'isolation_behavior', 
  'performative_recovery', 
  'enabling_family', 
  'progress_indicator', 
  'stability_signal', 
  'help_seeking', 
  'crisis_indicator',
  -- New fellowship work categories
  'fellowship_engagement',      -- Active engagement with fellowship-specific work
  'recovery_work_progress',     -- Doing the actual work between meetings
  'recovery_work_stagnation'    -- Meeting attendance without doing the work
]));