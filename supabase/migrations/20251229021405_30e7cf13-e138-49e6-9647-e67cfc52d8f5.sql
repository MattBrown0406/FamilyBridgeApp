-- Create enum for user roles in families
CREATE TYPE public.family_role AS ENUM ('member', 'recovering', 'moderator');

-- Create enum for financial request status
CREATE TYPE public.request_status AS ENUM ('pending', 'approved', 'denied');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Create families table
CREATE TABLE public.families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  invite_code TEXT UNIQUE DEFAULT substr(md5(random()::text), 1, 8),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;

-- Create family members junction table
CREATE TABLE public.family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES public.families(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role family_role NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(family_id, user_id)
);

ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

-- Create messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES public.families(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  original_content TEXT,
  was_filtered BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create financial requests table
CREATE TABLE public.financial_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES public.families(id) ON DELETE CASCADE NOT NULL,
  requester_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  reason TEXT NOT NULL,
  status request_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.financial_requests ENABLE ROW LEVEL SECURITY;

-- Create financial request votes table
CREATE TABLE public.financial_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES public.financial_requests(id) ON DELETE CASCADE NOT NULL,
  voter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  approved BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(request_id, voter_id)
);

ALTER TABLE public.financial_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for families
CREATE POLICY "Users can view families they belong to" ON public.families 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.family_members WHERE family_id = families.id AND user_id = auth.uid())
  );

CREATE POLICY "Users can create families" ON public.families 
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- RLS Policies for family_members
CREATE POLICY "Users can view members of their families" ON public.family_members 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.family_members fm WHERE fm.family_id = family_members.family_id AND fm.user_id = auth.uid())
  );

CREATE POLICY "Users can join families" ON public.family_members 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Moderators can update member roles" ON public.family_members 
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.family_members fm WHERE fm.family_id = family_members.family_id AND fm.user_id = auth.uid() AND fm.role = 'moderator')
  );

-- RLS Policies for messages
CREATE POLICY "Users can view messages in their families" ON public.messages 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.family_members WHERE family_id = messages.family_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can send messages in their families" ON public.messages 
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (SELECT 1 FROM public.family_members WHERE family_id = messages.family_id AND user_id = auth.uid())
  );

-- RLS Policies for financial_requests
CREATE POLICY "Users can view financial requests in their families" ON public.financial_requests 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.family_members WHERE family_id = financial_requests.family_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can create financial requests" ON public.financial_requests 
  FOR INSERT WITH CHECK (
    auth.uid() = requester_id AND
    EXISTS (SELECT 1 FROM public.family_members WHERE family_id = financial_requests.family_id AND user_id = auth.uid())
  );

CREATE POLICY "Moderators can update financial requests" ON public.financial_requests 
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.family_members fm WHERE fm.family_id = financial_requests.family_id AND fm.user_id = auth.uid() AND fm.role = 'moderator')
  );

-- RLS Policies for financial_votes
CREATE POLICY "Users can view votes in their families" ON public.financial_votes 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.financial_requests fr 
      JOIN public.family_members fm ON fm.family_id = fr.family_id 
      WHERE fr.id = financial_votes.request_id AND fm.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can vote on requests" ON public.financial_votes 
  FOR INSERT WITH CHECK (
    auth.uid() = voter_id AND
    EXISTS (
      SELECT 1 FROM public.financial_requests fr 
      JOIN public.family_members fm ON fm.family_id = fr.family_id 
      WHERE fr.id = financial_votes.request_id AND fm.user_id = auth.uid() AND fm.role IN ('member', 'moderator')
    )
  );

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, COALESCE(new.raw_user_meta_data ->> 'full_name', new.email));
  RETURN new;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_families_updated_at
  BEFORE UPDATE ON public.families
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER TABLE public.messages REPLICA IDENTITY FULL;