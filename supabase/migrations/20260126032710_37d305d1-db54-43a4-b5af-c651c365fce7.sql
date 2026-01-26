-- Create a view that masks sensitive contact fields for non-admins
CREATE OR REPLACE VIEW public.organizations_member_view
WITH (security_invoker = on) AS
SELECT 
  id,
  subdomain,
  name,
  tagline,
  logo_url,
  favicon_url,
  primary_color,
  primary_foreground_color,
  secondary_color,
  accent_color,
  background_color,
  foreground_color,
  heading_font,
  body_font,
  created_at,
  updated_at,
  created_by,
  -- Only show contact info to admins/owners
  CASE WHEN public.is_org_admin(id, auth.uid()) OR public.is_super_admin(auth.uid())
    THEN support_email
    ELSE NULL
  END AS support_email,
  CASE WHEN public.is_org_admin(id, auth.uid()) OR public.is_super_admin(auth.uid())
    THEN phone
    ELSE NULL
  END AS phone,
  CASE WHEN public.is_org_admin(id, auth.uid()) OR public.is_super_admin(auth.uid())
    THEN website_url
    ELSE NULL
  END AS website_url
FROM public.organizations;

-- Grant access to the view
GRANT SELECT ON public.organizations_member_view TO authenticated;