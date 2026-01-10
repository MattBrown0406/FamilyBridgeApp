-- Create table for storing HIPAA releases
CREATE TABLE public.hipaa_releases (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    full_name TEXT NOT NULL,
    signed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    ip_address TEXT,
    user_agent TEXT,
    signature_data TEXT NOT NULL, -- Electronic signature (typed name)
    release_version TEXT NOT NULL DEFAULT '1.0',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(family_id, user_id)
);

-- Enable RLS
ALTER TABLE public.hipaa_releases ENABLE ROW LEVEL SECURITY;

-- Users can view their own releases
CREATE POLICY "Users can view their own HIPAA releases"
ON public.hipaa_releases
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own releases
CREATE POLICY "Users can sign their own HIPAA releases"
ON public.hipaa_releases
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Moderators can view releases for families they moderate
CREATE POLICY "Moderators can view HIPAA releases for their families"
ON public.hipaa_releases
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.family_members fm
        WHERE fm.family_id = hipaa_releases.family_id
        AND fm.user_id = auth.uid()
        AND fm.role IN ('moderator', 'admin')
    )
);

-- Organization members can view releases for families in their organization
CREATE POLICY "Organization members can view HIPAA releases for org families"
ON public.hipaa_releases
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.families f
        JOIN public.organization_members om ON om.organization_id = f.organization_id
        WHERE f.id = hipaa_releases.family_id
        AND om.user_id = auth.uid()
    )
);

-- Create table for tracking moderator disclaimers shown in chat
CREATE TABLE public.moderator_disclaimers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE UNIQUE,
    moderator_id UUID NOT NULL,
    disclaimer_type TEXT NOT NULL DEFAULT 'certified_interventionist',
    shown_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.moderator_disclaimers ENABLE ROW LEVEL SECURITY;

-- Family members can view disclaimers
CREATE POLICY "Family members can view disclaimers"
ON public.moderator_disclaimers
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.family_members fm
        WHERE fm.family_id = moderator_disclaimers.family_id
        AND fm.user_id = auth.uid()
    )
);

-- Organization members can insert disclaimers
CREATE POLICY "Organization members can insert disclaimers"
ON public.moderator_disclaimers
FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = moderator_id AND
    EXISTS (
        SELECT 1 FROM public.organization_members om
        WHERE om.user_id = auth.uid()
    )
);