-- Create waitlist table for premium subscription interest
CREATE TABLE public.premium_waitlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT premium_waitlist_email_unique UNIQUE (email)
);

-- Enable RLS
ALTER TABLE public.premium_waitlist ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (public signup)
CREATE POLICY "Anyone can join the waitlist"
ON public.premium_waitlist
FOR INSERT
WITH CHECK (true);

-- Only authenticated admins can view waitlist (we'll use service role for now)
CREATE POLICY "Service role can view waitlist"
ON public.premium_waitlist
FOR SELECT
USING (false);