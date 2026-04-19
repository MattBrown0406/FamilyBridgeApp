ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS provider_category TEXT,
ADD COLUMN IF NOT EXISTS levels_of_care TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS primary_service_duration_days INTEGER,
ADD COLUMN IF NOT EXISTS outcome_tracking_enabled BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS intervention_tracking_enabled BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS benchmark_opt_in BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS intake_notes TEXT;

COMMENT ON COLUMN public.organizations.provider_category IS 'Top-level provider type, e.g. residential, outpatient, sober-living, interventionist, multi-program.';
COMMENT ON COLUMN public.organizations.levels_of_care IS 'Specific levels of care or service lines this organization provides.';
COMMENT ON COLUMN public.organizations.primary_service_duration_days IS 'Typical primary duration in days for the main service offering when applicable.';
COMMENT ON COLUMN public.organizations.outcome_tracking_enabled IS 'Whether provider outcome tracking should be enabled for this organization.';
COMMENT ON COLUMN public.organizations.intervention_tracking_enabled IS 'Whether intervention outcome tracking should be enabled for this organization.';
COMMENT ON COLUMN public.organizations.benchmark_opt_in IS 'Whether anonymized benchmark participation is enabled.';
COMMENT ON COLUMN public.organizations.intake_notes IS 'Freeform onboarding notes about services and measurement assumptions.';

DROP VIEW IF EXISTS public.organizations_member_view;

CREATE VIEW public.organizations_member_view
WITH (security_invoker=on, security_barrier=true) AS
SELECT 
  o.id,
  o.subdomain,
  o.name,
  o.tagline,
  o.logo_url,
  o.favicon_url,
  o.primary_color,
  o.primary_foreground_color,
  o.secondary_color,
  o.accent_color,
  o.background_color,
  o.foreground_color,
  o.heading_font,
  o.body_font,
  o.created_at,
  o.updated_at,
  o.created_by,
  CASE 
    WHEN public.is_org_admin(o.id, auth.uid()) OR public.is_super_admin(auth.uid()) 
    THEN o.support_email 
    ELSE NULL 
  END AS support_email,
  CASE 
    WHEN public.is_org_admin(o.id, auth.uid()) OR public.is_super_admin(auth.uid()) 
    THEN o.phone 
    ELSE NULL 
  END AS phone,
  CASE 
    WHEN public.is_org_admin(o.id, auth.uid()) OR public.is_super_admin(auth.uid()) 
    THEN o.website_url 
    ELSE NULL 
  END AS website_url,
  o.provider_category,
  o.levels_of_care,
  o.primary_service_duration_days,
  o.outcome_tracking_enabled,
  o.intervention_tracking_enabled,
  o.benchmark_opt_in,
  o.intake_notes
FROM public.organizations o
WHERE 
  public.is_org_member(o.id, auth.uid())
  OR public.is_super_admin(auth.uid());

REVOKE ALL ON public.organizations_member_view FROM anon, public;
GRANT SELECT ON public.organizations_member_view TO authenticated;