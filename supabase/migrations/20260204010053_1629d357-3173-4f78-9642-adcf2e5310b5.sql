-- Update pattern category constraint to include new categories
ALTER TABLE public.fiis_calibration_patterns DROP CONSTRAINT IF EXISTS fiis_calibration_patterns_pattern_category_check;

ALTER TABLE public.fiis_calibration_patterns ADD CONSTRAINT fiis_calibration_patterns_pattern_category_check CHECK (pattern_category IN (
'boundary_erosion', 'crisis_indicator', 'fellowship_engagement', 'financial_manipulation', 'progress_indicator', 'recovery_work_progress', 'recovery_work_stagnation', 'relapse_warning', 'stability_signal', 'family_dynamic', 'family_role', 'craft_method', 'stages_of_change', 'codependency', 'relapse_prediction', 'family_burnout', 'intervention_timing', 'treatment_readiness', 'enabling_behavior', 'self_care', 'overdose_protocol', 'treatment_matching'
));