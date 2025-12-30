-- Create provider role enum
CREATE TYPE public.provider_role AS ENUM ('owner', 'admin', 'staff');

-- Create organizations table for white-labeling
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subdomain TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  tagline TEXT,
  logo_url TEXT,
  favicon_url TEXT,
  -- Primary brand colors (stored as HSL values)
  primary_color TEXT DEFAULT '169 64% 36%',
  primary_foreground_color TEXT DEFAULT '0 0% 100%',
  secondary_color TEXT DEFAULT '169 30% 90%',
  accent_color TEXT DEFAULT '30 100% 50%',
  background_color TEXT DEFAULT '40 20% 98%',
  foreground_color TEXT DEFAULT '169 40% 15%',
  -- Typography
  heading_font TEXT DEFAULT 'Playfair Display',
  body_font TEXT DEFAULT 'DM Sans',
  -- Contact info
  support_email TEXT,
  website_url TEXT,
  phone TEXT,
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create organization members table (staff/admins of the organization)
CREATE TABLE public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  role provider_role NOT NULL DEFAULT 'staff',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- Add organization_id to families table to link families to providers
ALTER TABLE public.families 
ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;

-- Create storage bucket for organization logos
INSERT INTO storage.buckets (id, name, public) VALUES ('organization-assets', 'organization-assets', true);

-- Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Function to check if user is org member
CREATE OR REPLACE FUNCTION public.is_org_member(_org_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE organization_id = _org_id
      AND user_id = _user_id
  )
$$;

-- Function to check if user is org admin/owner
CREATE OR REPLACE FUNCTION public.is_org_admin(_org_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE organization_id = _org_id
      AND user_id = _user_id
      AND role IN ('owner', 'admin')
  )
$$;

-- RLS Policies for organizations
CREATE POLICY "Public can view organizations by subdomain"
ON public.organizations FOR SELECT
USING (true);

CREATE POLICY "Org admins can update their organization"
ON public.organizations FOR UPDATE
USING (public.is_org_admin(id, auth.uid()))
WITH CHECK (public.is_org_admin(id, auth.uid()));

CREATE POLICY "Authenticated users can create organizations"
ON public.organizations FOR INSERT
WITH CHECK (auth.uid() = created_by);

-- RLS Policies for organization_members
CREATE POLICY "Org members can view their org members"
ON public.organization_members FOR SELECT
USING (public.is_org_member(organization_id, auth.uid()));

CREATE POLICY "Org owners can manage members"
ON public.organization_members FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = organization_members.organization_id
    AND user_id = auth.uid()
    AND role = 'owner'
  )
);

CREATE POLICY "Org owners can update members"
ON public.organization_members FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = organization_members.organization_id
    AND om.user_id = auth.uid()
    AND om.role = 'owner'
  )
);

CREATE POLICY "Org owners can delete members"
ON public.organization_members FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = organization_members.organization_id
    AND om.user_id = auth.uid()
    AND om.role = 'owner'
  )
);

-- Storage policy for organization assets
CREATE POLICY "Anyone can view organization assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'organization-assets');

CREATE POLICY "Org admins can upload assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'organization-assets' 
  AND public.is_org_admin((storage.foldername(name))[1]::uuid, auth.uid())
);

CREATE POLICY "Org admins can update assets"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'organization-assets' 
  AND public.is_org_admin((storage.foldername(name))[1]::uuid, auth.uid())
);

CREATE POLICY "Org admins can delete assets"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'organization-assets' 
  AND public.is_org_admin((storage.foldername(name))[1]::uuid, auth.uid())
);

-- Trigger to update updated_at
CREATE TRIGGER update_organizations_updated_at
BEFORE UPDATE ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to auto-add creator as owner
CREATE OR REPLACE FUNCTION public.add_org_creator_as_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'owner');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_organization_created
AFTER INSERT ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION public.add_org_creator_as_owner();