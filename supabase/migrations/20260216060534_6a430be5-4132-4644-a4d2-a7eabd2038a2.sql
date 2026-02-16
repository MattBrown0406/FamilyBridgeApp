
-- Create coaching sessions table (saves suggestions only, not conversation content)
CREATE TABLE public.coaching_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  session_type TEXT NOT NULL CHECK (session_type IN ('live_speakerphone', 'live_text', 'screenshot')),
  suggestions JSONB[] DEFAULT '{}',
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.coaching_sessions ENABLE ROW LEVEL SECURITY;

-- Family members can view coaching sessions for their family
CREATE POLICY "Family members can view coaching sessions"
  ON public.coaching_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE fm.family_id = coaching_sessions.family_id
        AND fm.user_id = auth.uid()
    )
  );

-- Family members can create coaching sessions for their family
CREATE POLICY "Family members can create coaching sessions"
  ON public.coaching_sessions FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE fm.family_id = coaching_sessions.family_id
        AND fm.user_id = auth.uid()
    )
  );

-- Users can update their own sessions (to end them or add suggestions)
CREATE POLICY "Users can update own coaching sessions"
  ON public.coaching_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- Create coaching screenshots table
CREATE TABLE public.coaching_screenshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.coaching_sessions(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  image_path TEXT NOT NULL,
  ai_analysis JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.coaching_screenshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Family members can view coaching screenshots"
  ON public.coaching_screenshots FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE fm.family_id = coaching_screenshots.family_id
        AND fm.user_id = auth.uid()
    )
  );

CREATE POLICY "Family members can create coaching screenshots"
  ON public.coaching_screenshots FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE fm.family_id = coaching_screenshots.family_id
        AND fm.user_id = auth.uid()
    )
  );

-- Create storage bucket for coaching screenshots
INSERT INTO storage.buckets (id, name, public) VALUES ('coaching-screenshots', 'coaching-screenshots', false);

-- Storage policies
CREATE POLICY "Family members can upload coaching screenshots"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'coaching-screenshots'
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Family members can view coaching screenshots"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'coaching-screenshots'
    AND auth.uid() IS NOT NULL
  );
