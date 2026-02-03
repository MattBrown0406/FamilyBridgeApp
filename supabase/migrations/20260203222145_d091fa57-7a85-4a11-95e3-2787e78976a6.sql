-- ============================================================================
-- FIIS MODERATOR FEEDBACK & CORRECTIONS TABLE
-- Allows moderators to correct FIIS analyses for machine learning improvement
-- ============================================================================

-- Create table for storing moderator corrections/feedback on FIIS analyses
CREATE TABLE public.fiis_analysis_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  analysis_id UUID REFERENCES public.fiis_pattern_analyses(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  moderator_id UUID NOT NULL,
  
  -- What FIIS said
  original_risk_level INT,
  original_likelihood TEXT,
  original_what_seeing TEXT,
  
  -- Moderator correction
  corrected_risk_level INT CHECK (corrected_risk_level >= 0 AND corrected_risk_level <= 4),
  corrected_likelihood TEXT CHECK (corrected_likelihood IN ('very_likely', 'likely', 'uncertain', 'at_risk', 'critical_risk')),
  correction_reasoning TEXT NOT NULL,
  
  -- Specific feedback categories
  feedback_type TEXT NOT NULL CHECK (feedback_type IN (
    'false_positive',
    'false_negative',
    'wrong_severity',
    'misinterpretation',
    'missing_context',
    'pattern_correction',
    'reinforcement'
  )),
  
  -- Detailed corrections
  missed_patterns TEXT[],
  false_patterns TEXT[],
  
  -- Clinical context that FIIS should learn from
  clinical_context TEXT,
  recommended_keywords TEXT[],
  
  -- Quality rating
  accuracy_rating INT CHECK (accuracy_rating >= 1 AND accuracy_rating <= 5),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fiis_analysis_feedback ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_fiis_feedback_family ON public.fiis_analysis_feedback(family_id);
CREATE INDEX idx_fiis_feedback_analysis ON public.fiis_analysis_feedback(analysis_id);
CREATE INDEX idx_fiis_feedback_type ON public.fiis_analysis_feedback(feedback_type);
CREATE INDEX idx_fiis_feedback_created ON public.fiis_analysis_feedback(created_at DESC);

-- RLS Policies
CREATE POLICY "Moderators can submit feedback"
ON public.fiis_analysis_feedback
FOR INSERT
WITH CHECK (
  public.is_family_moderator(family_id, auth.uid()) 
  OR public.is_managing_org_member(family_id, auth.uid())
);

CREATE POLICY "Moderators can view feedback"
ON public.fiis_analysis_feedback
FOR SELECT
USING (
  moderator_id = auth.uid()
  OR public.is_family_moderator(family_id, auth.uid())
  OR public.is_managing_org_member(family_id, auth.uid())
);

CREATE POLICY "Moderators can update own feedback"
ON public.fiis_analysis_feedback
FOR UPDATE
USING (moderator_id = auth.uid());

CREATE TRIGGER update_fiis_feedback_timestamp
BEFORE UPDATE ON public.fiis_analysis_feedback
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- FIIS CALIBRATION PATTERNS TABLE
-- ============================================================================

CREATE TABLE public.fiis_calibration_patterns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pattern_name TEXT NOT NULL,
  pattern_description TEXT NOT NULL,
  pattern_category TEXT NOT NULL CHECK (pattern_category IN (
    'relapse_warning', 'boundary_erosion', 'financial_manipulation',
    'isolation_behavior', 'performative_recovery', 'enabling_family',
    'progress_indicator', 'stability_signal', 'help_seeking', 'crisis_indicator'
  )),
  trigger_keywords TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  trigger_behaviors TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  minimum_occurrences INT DEFAULT 2,
  time_window_days INT DEFAULT 14,
  suggested_risk_level INT CHECK (suggested_risk_level >= 0 AND suggested_risk_level <= 4),
  suggested_response TEXT,
  clinical_notes TEXT,
  validated_by_moderators INT DEFAULT 0,
  last_validated_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  source_feedback_ids UUID[] DEFAULT ARRAY[]::UUID[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.fiis_calibration_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read patterns"
ON public.fiis_calibration_patterns
FOR SELECT
USING (is_active = true);

CREATE INDEX idx_fiis_patterns_category ON public.fiis_calibration_patterns(pattern_category);
CREATE INDEX idx_fiis_patterns_keywords ON public.fiis_calibration_patterns USING gin(trigger_keywords);
CREATE INDEX idx_fiis_patterns_behaviors ON public.fiis_calibration_patterns USING gin(trigger_behaviors);

-- Seed calibration patterns from clinical knowledge
INSERT INTO public.fiis_calibration_patterns (pattern_name, pattern_description, pattern_category, trigger_keywords, trigger_behaviors, suggested_risk_level, suggested_response, clinical_notes) VALUES
('Pre-Relapse Isolation', 'Withdrawing from family communication and accountability structures', 'relapse_warning', 
 ARRAY['alone', 'need space', 'leave me alone', 'fine', 'whatever', 'busy', 'tired'],
 ARRAY['missed_checkout', 'location_declined', 'emotional_bypass'],
 2, 'Gently acknowledge the need for space while expressing care.', 
 'Isolation often precedes relapse by 2-4 weeks.'),

('Romanticizing Past Use', 'References to good times or minimizing consequences', 'relapse_warning',
 ARRAY['remember when', 'wasnt that bad', 'at least I', 'only', 'just', 'miss', 'fun'],
 ARRAY[]::TEXT[],
 2, 'Redirect to reality of consequences. Engage sponsor.',
 'Minimization and euphoric recall are pre-relapse indicators.'),

('HALT Indicators', 'Signs of Hungry Angry Lonely Tired states', 'relapse_warning',
 ARRAY['exhausted', 'pissed', 'angry', 'lonely', 'starving', 'frustrated', 'cant sleep', 'overwhelmed'],
 ARRAY['emotional_checkin'],
 1, 'Address immediate physical and emotional needs.',
 'HALT states are primary relapse triggers.'),

('Boundary Testing', 'Subtle requests that push against established limits', 'boundary_erosion',
 ARRAY['just this once', 'exception', 'emergency', 'but I', 'need', 'promise', 'last time'],
 ARRAY['boundary_exception', 'financial_request'],
 1, 'Acknowledge request while reinforcing the boundary.',
 'Testing is normal but repeated tests indicate escalation.'),

('Triangulation Attempt', 'Trying to get family members to disagree', 'boundary_erosion',
 ARRAY['mom said', 'dad thinks', 'but they', 'unfair', 'everyone else', 'you never', 'they understand'],
 ARRAY['family_splitting']::TEXT[],
 2, 'Remind all parties of agreed boundaries.',
 'Triangulation destabilizes family systems.'),

('Urgency Manufacturing', 'Creating false urgency to bypass agreements', 'financial_manipulation',
 ARRAY['emergency', 'right now', 'today', 'immediately', 'deadline', 'cut off', 'threatened'],
 ARRAY['financial_request'],
 2, 'Slow down the request. Verify urgency independently.',
 'Manufactured urgency prevents clear thinking.'),

('Progressive Requests', 'Escalating financial ask patterns', 'financial_manipulation',
 ARRAY['more', 'extra', 'additional', 'also need', 'plus'],
 ARRAY['financial_request'],
 2, 'Review recent request history. Discuss budget.',
 'Progressive requests often indicate active use.'),

('Proactive Communication', 'Reaching out before problems escalate', 'progress_indicator',
 ARRAY['wanted to tell you', 'heads up', 'before you hear', 'need to talk', 'struggling but'],
 ARRAY[]::TEXT[],
 0, 'Reinforce this behavior strongly.',
 'Proactive disclosure indicates recovery maturity.'),

('Consistent Meeting Attendance', 'Regular check-ins without prompting', 'stability_signal',
 ARRAY['meeting', 'sponsor', 'home group', 'step work'],
 ARRAY['checkin', 'checkout'],
 0, 'Acknowledge and celebrate consistency.',
 'Regular attendance is #1 predictor of success.'),

('Suicidal Ideation Signals', 'Language suggesting self-harm or hopelessness', 'crisis_indicator',
 ARRAY['end it', 'no point', 'better off without me', 'cant go on', 'done', 'give up', 'worthless', 'burden'],
 ARRAY[]::TEXT[],
 4, 'Immediate professional intervention required.',
 'Suicidal language requires professional assessment.'),

('Active Use Indicators', 'Signs suggesting current substance use', 'crisis_indicator',
 ARRAY['messed up', 'slipped', 'used', 'drank', 'high', 'relapsed', 'dont tell'],
 ARRAY['sobriety_reset', 'missed_checkout', 'location_declined'],
 4, 'Compassionate response without shame. Assess safety.',
 'Active use requires immediate intervention.');