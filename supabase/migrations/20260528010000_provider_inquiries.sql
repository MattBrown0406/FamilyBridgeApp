-- Provider inquiry capture (Tier 1.1 — v2 roadmap)
--
-- Stores leads from the public /for-providers page and the brochure QR code.
-- Read access restricted to super_admins via existing role gate.
-- Inserts allowed via the submit-provider-inquiry edge function which uses
-- the service_role key — so RLS deny-all for anon is fine, no public insert
-- policy needed.

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
