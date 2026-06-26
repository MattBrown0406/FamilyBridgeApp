
-- 1. CRM tables: remove family-moderator access, restrict to org members/admins only

-- crm_leads
DROP POLICY IF EXISTS "Org members and moderators can view leads" ON public.crm_leads;
DROP POLICY IF EXISTS "Org members and moderators can create leads" ON public.crm_leads;
DROP POLICY IF EXISTS "Org members and moderators can update leads" ON public.crm_leads;

CREATE POLICY "Org members can view leads"
ON public.crm_leads FOR SELECT
TO authenticated
USING (public.is_org_member(organization_id, auth.uid()));

CREATE POLICY "Org members can create leads"
ON public.crm_leads FOR INSERT
TO authenticated
WITH CHECK (public.is_org_member(organization_id, auth.uid()) AND created_by = auth.uid());

CREATE POLICY "Org members can update leads"
ON public.crm_leads FOR UPDATE
TO authenticated
USING (public.is_org_member(organization_id, auth.uid()));

-- crm_tasks
DROP POLICY IF EXISTS "Org members and moderators can view tasks" ON public.crm_tasks;
DROP POLICY IF EXISTS "Org members and moderators can create tasks" ON public.crm_tasks;
DROP POLICY IF EXISTS "Org members and moderators can update tasks" ON public.crm_tasks;

CREATE POLICY "Org members can view tasks"
ON public.crm_tasks FOR SELECT
TO authenticated
USING (public.is_org_member(organization_id, auth.uid()));

CREATE POLICY "Org members can create tasks"
ON public.crm_tasks FOR INSERT
TO authenticated
WITH CHECK (public.is_org_member(organization_id, auth.uid()) AND created_by = auth.uid());

CREATE POLICY "Org members can update tasks"
ON public.crm_tasks FOR UPDATE
TO authenticated
USING (public.is_org_member(organization_id, auth.uid()));

-- crm_activities
DROP POLICY IF EXISTS "Org members and moderators can view activities" ON public.crm_activities;
DROP POLICY IF EXISTS "Org members and moderators can create activities" ON public.crm_activities;

CREATE POLICY "Org members can view activities"
ON public.crm_activities FOR SELECT
TO authenticated
USING (public.is_org_member(organization_id, auth.uid()));

CREATE POLICY "Org members can create activities"
ON public.crm_activities FOR INSERT
TO authenticated
WITH CHECK (public.is_org_member(organization_id, auth.uid()) AND user_id = auth.uid());

-- crm_referral_sources
DROP POLICY IF EXISTS "Org members and moderators can view referral sources" ON public.crm_referral_sources;

CREATE POLICY "Org members can view referral sources"
ON public.crm_referral_sources FOR SELECT
TO authenticated
USING (public.is_org_member(organization_id, auth.uid()));


-- 2. fiis_calibration_patterns: restrict client reads to super admins.
-- Edge functions/AI services continue to access via service_role (bypasses RLS).

DROP POLICY IF EXISTS "Family moderators can read calibration patterns" ON public.fiis_calibration_patterns;
DROP POLICY IF EXISTS "Organization staff can read calibration patterns" ON public.fiis_calibration_patterns;
