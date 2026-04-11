
-- Coordination case status enum
CREATE TYPE public.coordination_case_status AS ENUM ('active', 'paused', 'closed');

-- Coordination channel type enum
CREATE TYPE public.coordination_channel_type AS ENUM ('family', 'provider', 'ai_analysis');

-- Coordination role enum
CREATE TYPE public.coordination_role AS ENUM ('interventionist', 'clinician', 'treatment_provider', 'case_manager', 'family_member', 'admin');

-- Cases table
CREATE TABLE public.coordination_cases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status coordination_case_status NOT NULL DEFAULT 'active',
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Case members
CREATE TABLE public.coordination_case_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id UUID NOT NULL REFERENCES public.coordination_cases(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role coordination_role NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(case_id, user_id)
);

-- Channels
CREATE TABLE public.coordination_channels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id UUID NOT NULL REFERENCES public.coordination_cases(id) ON DELETE CASCADE,
  channel_type coordination_channel_type NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(case_id, channel_type)
);

-- Messages
CREATE TABLE public.coordination_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID NOT NULL REFERENCES public.coordination_channels(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'message',
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tasks
CREATE TABLE public.coordination_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id UUID NOT NULL REFERENCES public.coordination_cases(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES public.coordination_channels(id) ON DELETE SET NULL,
  assigned_to UUID,
  created_by UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  priority TEXT NOT NULL DEFAULT 'medium',
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- AI Insights
CREATE TABLE public.coordination_ai_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id UUID NOT NULL REFERENCES public.coordination_cases(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info',
  is_dismissed BOOLEAN NOT NULL DEFAULT false,
  dismissed_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_coordination_cases_family ON public.coordination_cases(family_id);
CREATE INDEX idx_coordination_case_members_user ON public.coordination_case_members(user_id);
CREATE INDEX idx_coordination_case_members_case ON public.coordination_case_members(case_id);
CREATE INDEX idx_coordination_channels_case ON public.coordination_channels(case_id);
CREATE INDEX idx_coordination_messages_channel ON public.coordination_messages(channel_id);
CREATE INDEX idx_coordination_messages_created ON public.coordination_messages(created_at);
CREATE INDEX idx_coordination_tasks_case ON public.coordination_tasks(case_id);
CREATE INDEX idx_coordination_tasks_assigned ON public.coordination_tasks(assigned_to);
CREATE INDEX idx_coordination_ai_insights_case ON public.coordination_ai_insights(case_id);

-- Enable RLS
ALTER TABLE public.coordination_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coordination_case_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coordination_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coordination_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coordination_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coordination_ai_insights ENABLE ROW LEVEL SECURITY;

-- Helper: check if user is a case member
CREATE OR REPLACE FUNCTION public.is_coordination_case_member(_case_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.coordination_case_members
    WHERE case_id = _case_id AND user_id = _user_id
  )
$$;

-- Helper: check if user is a provider-role case member (not family_member)
CREATE OR REPLACE FUNCTION public.is_coordination_provider(_case_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.coordination_case_members
    WHERE case_id = _case_id AND user_id = _user_id
    AND role IN ('interventionist', 'clinician', 'treatment_provider', 'case_manager', 'admin')
  )
$$;

-- Helper: check channel access
CREATE OR REPLACE FUNCTION public.can_access_coordination_channel(_channel_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_case_id UUID;
  v_channel_type coordination_channel_type;
BEGIN
  SELECT case_id, channel_type INTO v_case_id, v_channel_type
  FROM public.coordination_channels WHERE id = _channel_id;
  
  IF v_case_id IS NULL THEN RETURN FALSE; END IF;
  
  -- AI analysis: providers only
  IF v_channel_type = 'ai_analysis' THEN
    RETURN public.is_coordination_provider(v_case_id, _user_id);
  END IF;
  
  -- Provider channel: providers only
  IF v_channel_type = 'provider' THEN
    RETURN public.is_coordination_provider(v_case_id, _user_id);
  END IF;
  
  -- Family channel: all case members
  RETURN public.is_coordination_case_member(v_case_id, _user_id);
END;
$$;

-- RLS: coordination_cases
CREATE POLICY "Case members can view cases"
  ON public.coordination_cases FOR SELECT
  TO authenticated
  USING (public.is_coordination_case_member(id, auth.uid()) OR public.is_super_admin(auth.uid()));

CREATE POLICY "Providers and admins can create cases"
  ON public.coordination_cases FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Providers can update cases"
  ON public.coordination_cases FOR UPDATE
  TO authenticated
  USING (public.is_coordination_provider(id, auth.uid()) OR public.is_super_admin(auth.uid()));

-- RLS: coordination_case_members
CREATE POLICY "Case members can view members"
  ON public.coordination_case_members FOR SELECT
  TO authenticated
  USING (public.is_coordination_case_member(case_id, auth.uid()) OR public.is_super_admin(auth.uid()));

CREATE POLICY "Providers can manage members"
  ON public.coordination_case_members FOR INSERT
  TO authenticated
  WITH CHECK (public.is_coordination_provider(case_id, auth.uid()) OR public.is_super_admin(auth.uid()) OR auth.uid() = user_id);

CREATE POLICY "Providers can remove members"
  ON public.coordination_case_members FOR DELETE
  TO authenticated
  USING (public.is_coordination_provider(case_id, auth.uid()) OR public.is_super_admin(auth.uid()));

-- RLS: coordination_channels
CREATE POLICY "Channel access by role"
  ON public.coordination_channels FOR SELECT
  TO authenticated
  USING (public.can_access_coordination_channel(id, auth.uid()) OR public.is_super_admin(auth.uid()));

CREATE POLICY "Auto-create channels"
  ON public.coordination_channels FOR INSERT
  TO authenticated
  WITH CHECK (public.is_coordination_provider(case_id, auth.uid()) OR public.is_super_admin(auth.uid()));

-- RLS: coordination_messages
CREATE POLICY "Read messages in accessible channels"
  ON public.coordination_messages FOR SELECT
  TO authenticated
  USING (public.can_access_coordination_channel(channel_id, auth.uid()) OR public.is_super_admin(auth.uid()));

CREATE POLICY "Post messages in accessible channels"
  ON public.coordination_messages FOR INSERT
  TO authenticated
  WITH CHECK (public.can_access_coordination_channel(channel_id, auth.uid()) AND auth.uid() = sender_id);

-- RLS: coordination_tasks
CREATE POLICY "Case members can view tasks"
  ON public.coordination_tasks FOR SELECT
  TO authenticated
  USING (public.is_coordination_case_member(case_id, auth.uid()) OR public.is_super_admin(auth.uid()));

CREATE POLICY "Members can create tasks"
  ON public.coordination_tasks FOR INSERT
  TO authenticated
  WITH CHECK (public.is_coordination_case_member(case_id, auth.uid()) AND auth.uid() = created_by);

CREATE POLICY "Assigned or providers can update tasks"
  ON public.coordination_tasks FOR UPDATE
  TO authenticated
  USING (assigned_to = auth.uid() OR public.is_coordination_provider(case_id, auth.uid()) OR public.is_super_admin(auth.uid()));

-- RLS: coordination_ai_insights
CREATE POLICY "Providers can view AI insights"
  ON public.coordination_ai_insights FOR SELECT
  TO authenticated
  USING (public.is_coordination_provider(case_id, auth.uid()) OR public.is_super_admin(auth.uid()));

CREATE POLICY "System can create insights"
  ON public.coordination_ai_insights FOR INSERT
  TO authenticated
  WITH CHECK (public.is_coordination_provider(case_id, auth.uid()) OR public.is_super_admin(auth.uid()));

CREATE POLICY "Providers can dismiss insights"
  ON public.coordination_ai_insights FOR UPDATE
  TO authenticated
  USING (public.is_coordination_provider(case_id, auth.uid()) OR public.is_super_admin(auth.uid()));

-- Triggers
CREATE TRIGGER update_coordination_cases_updated_at
  BEFORE UPDATE ON public.coordination_cases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_coordination_tasks_updated_at
  BEFORE UPDATE ON public.coordination_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create 3 channels when a case is created
CREATE OR REPLACE FUNCTION public.create_coordination_channels()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.coordination_channels (case_id, channel_type, name, description) VALUES
    (NEW.id, 'family', 'Family Channel', 'Updates, coordination, and guidance visible to family and professionals'),
    (NEW.id, 'provider', 'Provider Channel', 'Clinical concerns, risk flags, strategy discussion — providers only'),
    (NEW.id, 'ai_analysis', 'AI Analysis', 'System-generated insights and pattern detection');
  RETURN NEW;
END;
$$;

CREATE TRIGGER auto_create_coordination_channels
  AFTER INSERT ON public.coordination_cases
  FOR EACH ROW EXECUTE FUNCTION public.create_coordination_channels();

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.coordination_messages;
