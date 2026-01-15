-- Create table for daily emotional check-ins
CREATE TABLE public.daily_emotional_checkins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  feeling TEXT, -- null if bypassed
  was_bypassed BOOLEAN NOT NULL DEFAULT false,
  bypass_inferred_state TEXT, -- AI inference when bypassed (e.g., 'rushed', 'apathetic', 'avoidant')
  check_in_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure one check-in per user per family per day
  CONSTRAINT unique_daily_checkin UNIQUE (user_id, family_id, check_in_date)
);

-- Create table for AI emotional analysis throughout the day
CREATE TABLE public.emotional_tone_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  checkin_id UUID REFERENCES public.daily_emotional_checkins(id) ON DELETE SET NULL,
  analysis_date DATE NOT NULL DEFAULT CURRENT_DATE,
  baseline_tone TEXT, -- extracted from morning check-in
  current_tone TEXT, -- most recent analysis
  tone_trajectory TEXT, -- 'improving', 'declining', 'stable', 'volatile'
  message_count_analyzed INTEGER NOT NULL DEFAULT 0,
  analysis_summary TEXT,
  pattern_notes JSONB, -- for storing pattern observations over time
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- One analysis per user per family per day
  CONSTRAINT unique_daily_analysis UNIQUE (user_id, family_id, analysis_date)
);

-- Create table for long-term emotional patterns
CREATE TABLE public.emotional_patterns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  pattern_type TEXT NOT NULL, -- 'consistency', 'bypass_frequency', 'tone_trend', 'volatility'
  pattern_description TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info', -- 'info', 'concern', 'warning'
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  acknowledged_by UUID,
  data JSONB, -- supporting data for the pattern
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.daily_emotional_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emotional_tone_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emotional_patterns ENABLE ROW LEVEL SECURITY;

-- RLS for daily_emotional_checkins
CREATE POLICY "Users can view their own check-ins"
ON public.daily_emotional_checkins FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own check-ins"
ON public.daily_emotional_checkins FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Family members can view each other's check-ins"
ON public.daily_emotional_checkins FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.family_members fm
    WHERE fm.family_id = daily_emotional_checkins.family_id
    AND fm.user_id = auth.uid()
  )
);

-- RLS for emotional_tone_analysis
CREATE POLICY "Users can view their own analysis"
ON public.emotional_tone_analysis FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Family members can view each other's analysis"
ON public.emotional_tone_analysis FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.family_members fm
    WHERE fm.family_id = emotional_tone_analysis.family_id
    AND fm.user_id = auth.uid()
  )
);

CREATE POLICY "System can insert/update analysis"
ON public.emotional_tone_analysis FOR ALL
USING (auth.uid() = user_id);

-- RLS for emotional_patterns
CREATE POLICY "Users can view their own patterns"
ON public.emotional_patterns FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Family members can view each other's patterns"
ON public.emotional_patterns FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.family_members fm
    WHERE fm.family_id = emotional_patterns.family_id
    AND fm.user_id = auth.uid()
  )
);

CREATE POLICY "Family admins can acknowledge patterns"
ON public.emotional_patterns FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.family_members fm
    WHERE fm.family_id = emotional_patterns.family_id
    AND fm.user_id = auth.uid()
    AND fm.role IN ('admin', 'moderator')
  )
);

-- Trigger to update emotional_tone_analysis.updated_at
CREATE TRIGGER update_emotional_tone_analysis_updated_at
BEFORE UPDATE ON public.emotional_tone_analysis
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for emotional check-ins
ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_emotional_checkins;
ALTER PUBLICATION supabase_realtime ADD TABLE public.emotional_patterns;