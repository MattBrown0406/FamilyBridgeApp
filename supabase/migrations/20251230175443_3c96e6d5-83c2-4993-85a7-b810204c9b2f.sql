-- Create a function that returns only public theming data for an organization
-- This prevents exposing sensitive contact information (support_email, phone, website_url)
CREATE OR REPLACE FUNCTION public.get_organization_public_theme(_subdomain text)
RETURNS TABLE (
  id uuid,
  subdomain text,
  name text,
  tagline text,
  logo_url text,
  favicon_url text,
  primary_color text,
  primary_foreground_color text,
  secondary_color text,
  accent_color text,
  background_color text,
  foreground_color text,
  heading_font text,
  body_font text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
    o.body_font
  FROM public.organizations o
  WHERE o.subdomain = _subdomain
  LIMIT 1;
$$;

-- Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Public can view organizations by subdomain" ON public.organizations;

-- Create a new policy that only allows org members to view full organization data
CREATE POLICY "Org members can view their organization"
ON public.organizations
FOR SELECT
USING (is_org_member(id, auth.uid()));