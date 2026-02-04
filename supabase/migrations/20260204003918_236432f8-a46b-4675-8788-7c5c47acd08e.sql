-- Add fellowship column to support fellowship-specific FIIS feedback
-- This allows patterns to be matched to the user's chosen recovery fellowship

ALTER TABLE public.fiis_calibration_patterns
ADD COLUMN IF NOT EXISTS fellowship TEXT DEFAULT NULL;

-- Add comment explaining the fellowship system
COMMENT ON COLUMN public.fiis_calibration_patterns.fellowship IS 
'Optional fellowship identifier (AA, NA, SMART, Refuge, Celebrate, CoDA, ACA, Al-Anon, Nar-Anon, FA, Other). NULL means pattern applies to all fellowships. Used to provide fellowship-specific feedback about doing the recovery WORK, not just meeting attendance.';

-- Create index for faster fellowship-based lookups
CREATE INDEX IF NOT EXISTS idx_calibration_patterns_fellowship 
ON public.fiis_calibration_patterns(fellowship);