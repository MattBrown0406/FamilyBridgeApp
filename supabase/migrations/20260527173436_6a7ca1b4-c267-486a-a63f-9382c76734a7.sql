CREATE TABLE IF NOT EXISTS public.provider_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  organization text,
  role text,
  program_size text,
  message text,
  source text NOT NULL DEFAULT 'for-providers-page',
  utm_source text,
  utm_medium text,
  utm_campaign text,
  user_agent text,
  ip_inet inet,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'closed', 'spam')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  contacted_at timestamptz
);

-- Permissions: authenticated users can read/update (super_admin gated via RLS policies).
-- Service role can perform all operations (used by the submit-provider-inquiry edge function).
GRANT SELECT, UPDATE ON public.provider_inquiries TO authenticated;
GRANT ALL ON public.provider_inquiries TO service_role;

CREATE INDEX IF NOT EXISTS idx_provider_inquiries_status_created
  ON public.provider_inquiries (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_provider_inquiries_email
  ON public.provider_inquiries (lower(email));

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION public.set_provider_inquiries_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_provider_inquiries_updated_at ON public.provider_inquiries;
CREATE TRIGGER trg_provider_inquiries_updated_at
  BEFORE UPDATE ON public.provider_inquiries
  FOR EACH ROW EXECUTE FUNCTION public.set_provider_inquiries_updated_at();

-- RLS: deny everything by default, super_admins can read/update
ALTER TABLE public.provider_inquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins can read provider inquiries" ON public.provider_inquiries;
CREATE POLICY "Super admins can read provider inquiries"
  ON public.provider_inquiries
  FOR SELECT
  TO authenticated
  USING (public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Super admins can update provider inquiries" ON public.provider_inquiries;
CREATE POLICY "Super admins can update provider inquiries"
  ON public.provider_inquiries
  FOR UPDATE
  TO authenticated
  USING (public.is_super_admin(auth.uid()));

COMMENT ON TABLE public.provider_inquiries IS
  'Inbound leads from /for-providers page and conference brochure QR. Written by submit-provider-inquiry edge function. Read by super admins.';