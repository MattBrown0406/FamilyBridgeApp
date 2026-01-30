-- Create table for sensitive access tokens
CREATE TABLE IF NOT EXISTS public.sensitive_access_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token UUID NOT NULL UNIQUE,
  user_id UUID NOT NULL,
  purpose TEXT NOT NULL CHECK (purpose IN ('transition_summaries', 'hipaa_records', 'medical_notes')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_used BOOLEAN NOT NULL DEFAULT false,
  used_at TIMESTAMP WITH TIME ZONE,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create security audit log table if not exists
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  ip_address TEXT,
  user_agent TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sensitive_access_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS for sensitive_access_tokens - only service role can access
CREATE POLICY "Service role only for sensitive tokens"
ON public.sensitive_access_tokens
FOR ALL
USING (false);

-- RLS for security_audit_log - only service role can insert, super admins can view
CREATE POLICY "Super admins can view audit log"
ON public.security_audit_log
FOR SELECT
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "No direct inserts to audit log"
ON public.security_audit_log
FOR INSERT
WITH CHECK (false);

-- Index for fast token lookups
CREATE INDEX IF NOT EXISTS idx_sensitive_access_tokens_lookup 
ON public.sensitive_access_tokens (token, user_id, purpose, is_used, expires_at);

-- Index for audit log queries
CREATE INDEX IF NOT EXISTS idx_security_audit_log_user 
ON public.security_audit_log (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_security_audit_log_action 
ON public.security_audit_log (action, created_at DESC);

-- Auto-cleanup expired tokens (function)
CREATE OR REPLACE FUNCTION public.cleanup_expired_sensitive_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.sensitive_access_tokens
  WHERE expires_at < NOW() - INTERVAL '1 hour';
END;
$$;

-- Restrict direct access to transition_summaries for non-service-role queries
-- Drop existing policies first
DROP POLICY IF EXISTS "Family moderators can view transition summaries" ON public.transition_summaries;

-- Create new restrictive policy - direct queries blocked, must use edge function
CREATE POLICY "Direct access blocked - use secure endpoint"
ON public.transition_summaries
FOR SELECT
USING (false);

-- Keep insert and update policies for creating summaries
-- (The existing INSERT and UPDATE policies remain unchanged)