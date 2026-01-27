-- Create helper function to check if user is a moderator of any family in the organization
CREATE OR REPLACE FUNCTION public.is_org_family_moderator(_org_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.families f
    JOIN public.family_members fm ON fm.family_id = f.id
    WHERE f.organization_id = _org_id
      AND fm.user_id = _user_id
      AND fm.role = 'moderator'
  )
$$;

-- Update CRM Leads policies to include moderators
DROP POLICY IF EXISTS "Org members can view their leads" ON public.crm_leads;
CREATE POLICY "Org members and moderators can view leads"
ON public.crm_leads FOR SELECT
USING (is_org_member(organization_id, auth.uid()) OR is_org_family_moderator(organization_id, auth.uid()));

DROP POLICY IF EXISTS "Org members can create leads" ON public.crm_leads;
CREATE POLICY "Org members and moderators can create leads"
ON public.crm_leads FOR INSERT
WITH CHECK ((is_org_member(organization_id, auth.uid()) OR is_org_family_moderator(organization_id, auth.uid())) AND created_by = auth.uid());

DROP POLICY IF EXISTS "Org members can update their org leads" ON public.crm_leads;
CREATE POLICY "Org members and moderators can update leads"
ON public.crm_leads FOR UPDATE
USING (is_org_member(organization_id, auth.uid()) OR is_org_family_moderator(organization_id, auth.uid()));

-- Update CRM Tasks policies to include moderators
DROP POLICY IF EXISTS "Org members can view their org tasks" ON public.crm_tasks;
CREATE POLICY "Org members and moderators can view tasks"
ON public.crm_tasks FOR SELECT
USING (is_org_member(organization_id, auth.uid()) OR is_org_family_moderator(organization_id, auth.uid()));

DROP POLICY IF EXISTS "Org members can create tasks" ON public.crm_tasks;
CREATE POLICY "Org members and moderators can create tasks"
ON public.crm_tasks FOR INSERT
WITH CHECK ((is_org_member(organization_id, auth.uid()) OR is_org_family_moderator(organization_id, auth.uid())) AND created_by = auth.uid());

DROP POLICY IF EXISTS "Org members can update their org tasks" ON public.crm_tasks;
CREATE POLICY "Org members and moderators can update tasks"
ON public.crm_tasks FOR UPDATE
USING (is_org_member(organization_id, auth.uid()) OR is_org_family_moderator(organization_id, auth.uid()));

-- Update CRM Activities policies to include moderators
DROP POLICY IF EXISTS "Org members can view their org activities" ON public.crm_activities;
CREATE POLICY "Org members and moderators can view activities"
ON public.crm_activities FOR SELECT
USING (is_org_member(organization_id, auth.uid()) OR is_org_family_moderator(organization_id, auth.uid()));

DROP POLICY IF EXISTS "Org members can create activities" ON public.crm_activities;
CREATE POLICY "Org members and moderators can create activities"
ON public.crm_activities FOR INSERT
WITH CHECK ((is_org_member(organization_id, auth.uid()) OR is_org_family_moderator(organization_id, auth.uid())) AND user_id = auth.uid());

-- Update CRM Referral Sources policies to include moderators for viewing
DROP POLICY IF EXISTS "Org members can view referral sources" ON public.crm_referral_sources;
CREATE POLICY "Org members and moderators can view referral sources"
ON public.crm_referral_sources FOR SELECT
USING (is_org_member(organization_id, auth.uid()) OR is_org_family_moderator(organization_id, auth.uid()));