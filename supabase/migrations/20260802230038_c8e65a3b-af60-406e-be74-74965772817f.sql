-- FamilyBridge simplification backend contracts.
-- Forward-only migration: shared family work, professional access, coordination
-- hardening, recipient-specific transition consent, closed-loop handoffs, and
-- privacy-safe provider outcome reporting.

-- Private professional notes are never opted into family-facing AI by default.
ALTER TABLE public.provider_notes ALTER COLUMN include_in_ai_analysis SET DEFAULT false;
UPDATE public.provider_notes SET include_in_ai_analysis = false
WHERE visibility = 'internal_only' AND include_in_ai_analysis = true;

DROP POLICY IF EXISTS "Family members can view pattern analyses" ON public.fiis_pattern_analyses;
DROP POLICY IF EXISTS "Family members can create pattern analyses" ON public.fiis_pattern_analyses;
CREATE POLICY fiis_pattern_analyses_support_select ON public.fiis_pattern_analyses
FOR SELECT TO authenticated USING (EXISTS (
  SELECT 1 FROM public.family_members fm
  WHERE fm.family_id = fiis_pattern_analyses.family_id AND fm.user_id = auth.uid()
    AND fm.role <> 'recovering' AND COALESCE(fm.is_primary_patient, false) = false
));
REVOKE INSERT ON public.fiis_pattern_analyses FROM authenticated, anon;

DROP POLICY IF EXISTS "Family members can view auto events" ON public.fiis_auto_events;
CREATE POLICY fiis_auto_events_support_select ON public.fiis_auto_events
FOR SELECT TO authenticated USING (EXISTS (
  SELECT 1 FROM public.family_members fm
  WHERE fm.family_id = fiis_auto_events.family_id AND fm.user_id = auth.uid()
    AND fm.role <> 'recovering' AND COALESCE(fm.is_primary_patient, false) = false
));

DROP POLICY IF EXISTS "Family members can view observations" ON public.fiis_observations;
CREATE POLICY fiis_observations_support_select ON public.fiis_observations
FOR SELECT TO authenticated USING (EXISTS (
  SELECT 1 FROM public.family_members fm
  WHERE fm.family_id = fiis_observations.family_id AND fm.user_id = auth.uid()
    AND fm.role <> 'recovering' AND COALESCE(fm.is_primary_patient, false) = false
));

-- ---------------------------------------------------------------------------
-- External organization invitations are creation-RPC-only. They disclose no
-- family details and do not confer handoff access; a recipient-specific handoff
-- must still be created and authorized after the organization joins.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Sending org can manage invites" ON public.org_transfer_invites;
CREATE POLICY org_transfer_invites_sender_select ON public.org_transfer_invites
FOR SELECT TO authenticated USING (
  invited_by = auth.uid() OR public.is_org_admin(from_organization_id, auth.uid()) OR public.is_super_admin(auth.uid())
);
REVOKE INSERT, UPDATE, DELETE ON public.org_transfer_invites FROM authenticated, anon;

CREATE OR REPLACE FUNCTION public.create_org_transfer_invitation(
  p_family_id uuid,
  p_from_organization_id uuid,
  p_org_name text,
  p_contact_name text,
  p_contact_email text,
  p_contact_phone text DEFAULT NULL,
  p_invite_message text DEFAULT NULL,
  p_transfer_reason public.transfer_reason DEFAULT NULL,
  p_transfer_reason_notes text DEFAULT NULL,
  p_referring_user_remains_co_mod boolean DEFAULT false
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE v_id uuid; v_email text := lower(btrim(p_contact_email));
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF NOT (public.is_org_admin(p_from_organization_id, auth.uid()) OR public.is_super_admin(auth.uid())) THEN
    RAISE EXCEPTION 'Referring organization admin required';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.families f WHERE f.id = p_family_id AND f.organization_id = p_from_organization_id) THEN
    RAISE EXCEPTION 'Family is not managed by the referring organization';
  END IF;
  IF btrim(COALESCE(p_org_name, '')) = '' OR v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' THEN
    RAISE EXCEPTION 'Valid organization name and recipient email required';
  END IF;
  SELECT oti.id INTO v_id FROM public.org_transfer_invites oti
  WHERE oti.family_id = p_family_id AND lower(oti.contact_email) = v_email
    AND oti.status IN ('sent', 'registered') AND oti.expires_at > now()
  ORDER BY oti.created_at DESC LIMIT 1;
  IF v_id IS NOT NULL THEN RETURN v_id; END IF;

  INSERT INTO public.org_transfer_invites (
    family_id, from_organization_id, invited_by, org_name, contact_name, contact_email,
    contact_phone, invite_message, transfer_reason, transfer_reason_notes,
    referring_user_remains_co_mod, status, expires_at
  ) VALUES (
    p_family_id, p_from_organization_id, auth.uid(), btrim(p_org_name), NULLIF(btrim(p_contact_name), ''), v_email,
    NULLIF(btrim(p_contact_phone), ''), NULLIF(btrim(p_invite_message), ''), p_transfer_reason,
    NULLIF(btrim(p_transfer_reason_notes), ''), p_referring_user_remains_co_mod, 'sent', now() + interval '30 days'
  ) RETURNING id INTO v_id;
  RETURN v_id;
END
$$;
REVOKE ALL ON FUNCTION public.create_org_transfer_invitation(uuid, uuid, text, text, text, text, text, public.transfer_reason, text, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_org_transfer_invitation(uuid, uuid, text, text, text, text, text, public.transfer_reason, text, boolean) TO authenticated;

-- ---------------------------------------------------------------------------
-- Shared family actions and decisions
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.has_family_professional_capability(
  p_family_id uuid, p_user_id uuid, p_capability text
)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$ SELECT false $$;

CREATE TABLE public.family_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  title text NOT NULL CHECK (length(btrim(title)) BETWEEN 1 AND 200),
  description text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  due_at timestamptz,
  completed_at timestamptz,
  completed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((status = 'completed' AND completed_at IS NOT NULL AND completed_by IS NOT NULL)
      OR (status <> 'completed' AND completed_at IS NULL AND completed_by IS NULL))
);

CREATE INDEX family_actions_family_status_idx
  ON public.family_actions (family_id, status, created_at DESC);
CREATE INDEX family_actions_assigned_open_idx
  ON public.family_actions (assigned_to, due_at)
  WHERE status IN ('open', 'in_progress');

CREATE TABLE public.family_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  title text NOT NULL CHECK (length(btrim(title)) BETWEEN 1 AND 200),
  context text,
  concerns text,
  target_at timestamptz,
  options jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(options) = 'array'),
  selected_option jsonb,
  status text NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed', 'decided', 'archived')),
  decided_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((status = 'decided' AND selected_option IS NOT NULL AND decided_at IS NOT NULL)
      OR (status <> 'decided' AND decided_at IS NULL))
);

CREATE INDEX family_decisions_family_status_idx
  ON public.family_decisions (family_id, status, created_at DESC);

CREATE TABLE public.family_decision_acknowledgements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_id uuid NOT NULL REFERENCES public.family_decisions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  acknowledgement text NOT NULL DEFAULT 'acknowledged'
    CHECK (acknowledgement IN ('acknowledged', 'agree', 'disagree', 'needs_discussion')),
  comment text,
  acknowledged_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (decision_id, user_id)
);

CREATE INDEX family_decision_acknowledgements_decision_idx
  ON public.family_decision_acknowledgements (decision_id, acknowledged_at);

CREATE OR REPLACE FUNCTION public.enforce_family_action_write()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.created_by IS DISTINCT FROM auth.uid() THEN
      RAISE EXCEPTION 'created_by must match the authenticated user';
    END IF;
    IF NOT public.is_family_member(NEW.family_id, auth.uid())
       AND NOT public.is_family_moderator(NEW.family_id, auth.uid())
       AND NOT public.is_managing_org_member(NEW.family_id, auth.uid())
       AND NOT public.is_super_admin(auth.uid()) THEN
      RAISE EXCEPTION 'Not authorized for this family';
    END IF;
  ELSE
    IF (NEW.id, NEW.family_id, NEW.created_by, NEW.created_at)
       IS DISTINCT FROM (OLD.id, OLD.family_id, OLD.created_by, OLD.created_at) THEN
      RAISE EXCEPTION 'Action identity fields are immutable';
    END IF;
    IF OLD.assigned_to = auth.uid() AND OLD.created_by <> auth.uid()
       AND NOT public.is_family_moderator(OLD.family_id, auth.uid())
       AND NOT public.is_managing_org_member(OLD.family_id, auth.uid())
       AND NOT public.has_family_professional_capability(OLD.family_id, auth.uid(), 'actions.write')
       AND NOT public.is_super_admin(auth.uid())
       AND (NEW.assigned_to, NEW.title, NEW.description, NEW.priority, NEW.due_at)
           IS DISTINCT FROM (OLD.assigned_to, OLD.title, OLD.description, OLD.priority, OLD.due_at) THEN
      RAISE EXCEPTION 'Assignees may only update action status';
    END IF;
  END IF;

  IF NEW.assigned_to IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.family_members fm
    WHERE fm.family_id = NEW.family_id AND fm.user_id = NEW.assigned_to
  ) AND NOT public.has_family_professional_capability(NEW.family_id, NEW.assigned_to, 'actions.write') THEN
    RAISE EXCEPTION 'Assignee must be a current family member or authorized professional';
  END IF;

  IF NEW.status = 'completed' AND (TG_OP = 'INSERT' OR OLD.status <> 'completed') THEN
    NEW.completed_at := now();
    NEW.completed_by := auth.uid();
  ELSIF NEW.status <> 'completed' THEN
    NEW.completed_at := NULL;
    NEW.completed_by := NULL;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END
$$;

CREATE TRIGGER enforce_family_action_write
BEFORE INSERT OR UPDATE ON public.family_actions
FOR EACH ROW EXECUTE FUNCTION public.enforce_family_action_write();

CREATE OR REPLACE FUNCTION public.enforce_family_decision_write()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.created_by IS DISTINCT FROM auth.uid() THEN
      RAISE EXCEPTION 'created_by must match the authenticated user';
    END IF;
  ELSIF (NEW.id, NEW.family_id, NEW.created_by, NEW.created_at)
       IS DISTINCT FROM (OLD.id, OLD.family_id, OLD.created_by, OLD.created_at) THEN
    RAISE EXCEPTION 'Decision identity fields are immutable';
  END IF;

  IF NEW.status = 'decided' AND (TG_OP = 'INSERT' OR OLD.status <> 'decided') THEN
    NEW.decided_by := auth.uid();
    NEW.decided_at := now();
  ELSIF NEW.status <> 'decided' THEN
    NEW.decided_by := NULL;
    NEW.decided_at := NULL;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END
$$;

CREATE TRIGGER enforce_family_decision_write
BEFORE INSERT OR UPDATE ON public.family_decisions
FOR EACH ROW EXECUTE FUNCTION public.enforce_family_decision_write();

CREATE TRIGGER update_family_decision_acknowledgements_updated_at
BEFORE UPDATE ON public.family_decision_acknowledgements
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.family_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_decision_acknowledgements ENABLE ROW LEVEL SECURITY;

CREATE POLICY family_actions_select ON public.family_actions FOR SELECT TO authenticated
USING (public.is_family_member(family_id, auth.uid()) OR public.is_family_moderator(family_id, auth.uid())
  OR public.is_managing_org_member(family_id, auth.uid())
  OR public.has_family_professional_capability(family_id, auth.uid(), 'actions.read')
  OR public.has_family_professional_capability(family_id, auth.uid(), 'actions.write')
  OR public.is_super_admin(auth.uid()));
CREATE POLICY family_actions_insert ON public.family_actions FOR INSERT TO authenticated
WITH CHECK (created_by = auth.uid() AND (public.is_family_member(family_id, auth.uid())
  OR public.is_family_moderator(family_id, auth.uid()) OR public.is_managing_org_member(family_id, auth.uid())
  OR public.has_family_professional_capability(family_id, auth.uid(), 'actions.write')
  OR public.is_super_admin(auth.uid())));
CREATE POLICY family_actions_update ON public.family_actions FOR UPDATE TO authenticated
USING (created_by = auth.uid() OR assigned_to = auth.uid() OR public.is_family_moderator(family_id, auth.uid())
  OR public.is_managing_org_member(family_id, auth.uid())
  OR public.has_family_professional_capability(family_id, auth.uid(), 'actions.write')
  OR public.is_super_admin(auth.uid()))
WITH CHECK (created_by = auth.uid() OR assigned_to = auth.uid() OR public.is_family_moderator(family_id, auth.uid())
  OR public.is_managing_org_member(family_id, auth.uid())
  OR public.has_family_professional_capability(family_id, auth.uid(), 'actions.write')
  OR public.is_super_admin(auth.uid()));

CREATE POLICY family_decisions_select ON public.family_decisions FOR SELECT TO authenticated
USING (public.is_family_member(family_id, auth.uid()) OR public.is_family_moderator(family_id, auth.uid())
  OR public.is_managing_org_member(family_id, auth.uid())
  OR public.has_family_professional_capability(family_id, auth.uid(), 'decisions.read')
  OR public.has_family_professional_capability(family_id, auth.uid(), 'decisions.write')
  OR public.is_super_admin(auth.uid()));
CREATE POLICY family_decisions_insert ON public.family_decisions FOR INSERT TO authenticated
WITH CHECK (created_by = auth.uid() AND (public.is_family_member(family_id, auth.uid())
  OR public.is_family_moderator(family_id, auth.uid()) OR public.is_managing_org_member(family_id, auth.uid())
  OR public.has_family_professional_capability(family_id, auth.uid(), 'decisions.write')
  OR public.is_super_admin(auth.uid())));
CREATE POLICY family_decisions_update ON public.family_decisions FOR UPDATE TO authenticated
USING ((created_by = auth.uid() AND status = 'proposed') OR public.is_family_moderator(family_id, auth.uid())
  OR public.is_managing_org_member(family_id, auth.uid())
  OR public.has_family_professional_capability(family_id, auth.uid(), 'decisions.write')
  OR public.is_super_admin(auth.uid()))
WITH CHECK ((created_by = auth.uid() AND status = 'proposed') OR public.is_family_moderator(family_id, auth.uid())
  OR public.is_managing_org_member(family_id, auth.uid())
  OR public.has_family_professional_capability(family_id, auth.uid(), 'decisions.write')
  OR public.is_super_admin(auth.uid()));

CREATE POLICY family_decision_acknowledgements_select
ON public.family_decision_acknowledgements FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.family_decisions d WHERE d.id = decision_id
  AND (public.is_family_member(d.family_id, auth.uid()) OR public.is_family_moderator(d.family_id, auth.uid())
    OR public.is_managing_org_member(d.family_id, auth.uid())
    OR public.has_family_professional_capability(d.family_id, auth.uid(), 'decisions.read')
    OR public.has_family_professional_capability(d.family_id, auth.uid(), 'decisions.write')
    OR public.is_super_admin(auth.uid()))));
CREATE POLICY family_decision_acknowledgements_insert
ON public.family_decision_acknowledgements FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.family_decisions d WHERE d.id = decision_id
  AND (public.is_family_member(d.family_id, auth.uid())
    OR public.has_family_professional_capability(d.family_id, auth.uid(), 'decisions.read')
    OR public.has_family_professional_capability(d.family_id, auth.uid(), 'decisions.write'))));
CREATE POLICY family_decision_acknowledgements_update
ON public.family_decision_acknowledgements FOR UPDATE TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

REVOKE ALL ON public.family_actions, public.family_decisions, public.family_decision_acknowledgements FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE ON public.family_actions, public.family_decisions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.family_decision_acknowledgements TO authenticated;
GRANT ALL ON public.family_actions, public.family_decisions, public.family_decision_acknowledgements TO service_role;

-- ---------------------------------------------------------------------------
-- Capability-scoped professional invitations
-- ---------------------------------------------------------------------------
CREATE TABLE public.family_professional_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  invited_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  invitee_email text NOT NULL CHECK (invitee_email = lower(btrim(invitee_email)) AND position('@' in invitee_email) > 1),
  role_template text NOT NULL DEFAULT 'read_only_support' CHECK (role_template IN (
    'interventionist', 'therapist', 'treatment_provider', 'case_manager', 'family_member', 'read_only_support'
  )),
  token_hash text NOT NULL UNIQUE,
  capabilities text[] NOT NULL DEFAULT ARRAY['coordination.read']::text[],
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'revoked', 'expired')),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '14 days'),
  accepted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  accepted_at timestamptz,
  revoked_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (cardinality(capabilities) > 0 AND capabilities <@ ARRAY[
    'family.read', 'actions.read', 'actions.write', 'decisions.read', 'decisions.write',
    'coordination.read', 'coordination.manage', 'coordination.tasks.write',
    'transitions.manage', 'outcomes.read']::text[]),
  CHECK ((status = 'accepted' AND accepted_by IS NOT NULL AND accepted_at IS NOT NULL AND revoked_at IS NULL)
      OR (status <> 'accepted'))
);

CREATE INDEX family_professional_invitations_family_status_idx
  ON public.family_professional_invitations (family_id, status, expires_at);
CREATE INDEX family_professional_invitations_accepted_idx
  ON public.family_professional_invitations (accepted_by, family_id)
  WHERE status = 'accepted' AND revoked_at IS NULL;
CREATE UNIQUE INDEX family_professional_invitations_active_email_idx
  ON public.family_professional_invitations (family_id, invitee_email)
  WHERE status = 'pending' AND revoked_at IS NULL;

ALTER TABLE public.family_professional_invitations ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.family_professional_access_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id uuid NOT NULL REFERENCES public.family_professional_invitations(id) ON DELETE CASCADE,
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  actor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  subject_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type text NOT NULL CHECK (event_type IN ('created', 'accepted', 'revoked', 'expired', 'accessed')),
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX family_professional_access_events_family_created_idx
  ON public.family_professional_access_events (family_id, created_at DESC);
ALTER TABLE public.family_professional_access_events ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.can_manage_family_work(p_family_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT p_user_id IS NOT NULL AND (
    public.is_super_admin(p_user_id)
    OR public.is_family_moderator(p_family_id, p_user_id)
    OR public.is_managing_org_member(p_family_id, p_user_id)
    OR EXISTS (
      SELECT 1 FROM public.family_professional_invitations fpi
      WHERE fpi.family_id = p_family_id AND fpi.accepted_by = p_user_id
        AND fpi.status = 'accepted' AND fpi.revoked_at IS NULL AND fpi.expires_at > now()
        AND fpi.capabilities && ARRAY['actions.write', 'decisions.write']::text[]
    )
  )
$$;

CREATE OR REPLACE FUNCTION public.has_family_professional_capability(
  p_family_id uuid, p_user_id uuid, p_capability text
)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT p_user_id IS NOT NULL AND p_capability = ANY (ARRAY[
    'family.read', 'actions.read', 'actions.write', 'decisions.read', 'decisions.write',
    'coordination.read', 'coordination.manage', 'coordination.tasks.write',
    'transitions.manage', 'outcomes.read']::text[])
    AND EXISTS (
      SELECT 1 FROM public.family_professional_invitations fpi
      WHERE fpi.family_id = p_family_id AND fpi.accepted_by = p_user_id
        AND fpi.status = 'accepted' AND fpi.revoked_at IS NULL
        AND fpi.expires_at > now() AND p_capability = ANY(fpi.capabilities)
    )
$$;

CREATE POLICY family_professional_invitations_select_manager
ON public.family_professional_invitations FOR SELECT TO authenticated
USING (public.is_family_moderator(family_id, auth.uid())
       OR public.is_managing_org_member(family_id, auth.uid()) OR public.is_super_admin(auth.uid()));
CREATE POLICY family_professional_invitations_select_self
ON public.family_professional_invitations FOR SELECT TO authenticated
USING (accepted_by = auth.uid());

CREATE POLICY family_professional_access_events_select_manager
ON public.family_professional_access_events FOR SELECT TO authenticated
USING (public.is_family_moderator(family_id, auth.uid())
       OR public.is_managing_org_member(family_id, auth.uid()) OR public.is_super_admin(auth.uid()));
CREATE POLICY family_professional_access_events_select_self
ON public.family_professional_access_events FOR SELECT TO authenticated
USING (subject_user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.create_family_professional_invitation(
  p_family_id uuid,
  p_invitee_email text,
  p_role_template text DEFAULT 'read_only_support',
  p_capabilities text[] DEFAULT ARRAY['coordination.read']::text[],
  p_expires_at timestamptz DEFAULT (now() + interval '14 days')
)
RETURNS TABLE (invitation_id uuid, invite_token text, expires_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_token text := encode(extensions.gen_random_bytes(32), 'hex');
  v_id uuid;
  v_expires timestamptz;
  v_email text := lower(btrim(p_invitee_email));
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF NOT (public.is_family_moderator(p_family_id, auth.uid())
          OR public.is_managing_org_member(p_family_id, auth.uid())
          OR public.is_super_admin(auth.uid())) THEN
    RAISE EXCEPTION 'Not authorized to invite professionals';
  END IF;
  IF v_email = '' OR position('@' in v_email) <= 1 THEN RAISE EXCEPTION 'Valid email required'; END IF;
  IF p_role_template NOT IN ('interventionist', 'therapist', 'treatment_provider', 'case_manager', 'family_member', 'read_only_support') THEN
    RAISE EXCEPTION 'Invalid role template';
  END IF;
  IF p_expires_at <= now() OR p_expires_at > now() + interval '30 days' THEN
    RAISE EXCEPTION 'Expiration must be within 30 days';
  END IF;
  IF cardinality(p_capabilities) = 0 OR NOT p_capabilities <@ ARRAY[
    'family.read', 'actions.read', 'actions.write', 'decisions.read', 'decisions.write',
    'coordination.read', 'coordination.manage', 'coordination.tasks.write',
    'transitions.manage', 'outcomes.read']::text[] THEN
    RAISE EXCEPTION 'Invalid capabilities';
  END IF;
  IF NOT (p_capabilities <@ (CASE p_role_template
    WHEN 'interventionist' THEN ARRAY['family.read', 'actions.read', 'actions.write', 'decisions.read', 'decisions.write', 'coordination.read', 'coordination.manage', 'coordination.tasks.write', 'transitions.manage']::text[]
    WHEN 'case_manager' THEN ARRAY['family.read', 'actions.read', 'actions.write', 'decisions.read', 'decisions.write', 'coordination.read', 'coordination.manage', 'coordination.tasks.write', 'transitions.manage']::text[]
    WHEN 'treatment_provider' THEN ARRAY['family.read', 'actions.read', 'actions.write', 'decisions.read', 'coordination.read', 'coordination.tasks.write', 'transitions.manage', 'outcomes.read']::text[]
    WHEN 'therapist' THEN ARRAY['family.read', 'actions.read', 'actions.write', 'decisions.read', 'decisions.write', 'coordination.read', 'coordination.tasks.write']::text[]
    WHEN 'family_member' THEN ARRAY['family.read', 'actions.read', 'decisions.read', 'coordination.read']::text[]
    ELSE ARRAY['family.read', 'actions.read', 'decisions.read', 'coordination.read']::text[]
  END)) THEN
    RAISE EXCEPTION 'Capabilities exceed role template';
  END IF;

  UPDATE public.family_professional_invitations
  SET status = 'revoked', revoked_at = now(), revoked_by = auth.uid(), updated_at = now()
  WHERE family_id = p_family_id AND invitee_email = v_email AND status = 'pending';

  INSERT INTO public.family_professional_invitations
    (family_id, invited_by, invitee_email, role_template, token_hash, capabilities, expires_at)
  VALUES
    (p_family_id, auth.uid(), v_email, p_role_template, encode(extensions.digest(v_token, 'sha256'), 'hex'), p_capabilities, p_expires_at)
  RETURNING id, family_professional_invitations.expires_at INTO v_id, v_expires;
  INSERT INTO public.family_professional_access_events
    (invitation_id, family_id, actor_user_id, event_type, details)
  VALUES (v_id, p_family_id, auth.uid(), 'created', jsonb_build_object(
    'role_template', p_role_template, 'capabilities', p_capabilities, 'expires_at', v_expires
  ));
  RETURN QUERY SELECT v_id, v_token, v_expires;
END
$$;

CREATE OR REPLACE FUNCTION public.accept_family_professional_invitation(p_invite_token text)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE v_id uuid; v_family_id uuid; v_user_email text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  SELECT lower(email) INTO v_user_email FROM auth.users WHERE id = auth.uid();
  IF v_user_email IS NULL THEN RAISE EXCEPTION 'Authenticated email required'; END IF;
  UPDATE public.family_professional_invitations
  SET status = 'accepted', accepted_by = auth.uid(), accepted_at = now(), updated_at = now()
  WHERE token_hash = encode(extensions.digest(p_invite_token, 'sha256'), 'hex')
    AND invitee_email = v_user_email
    AND status = 'pending' AND revoked_at IS NULL AND expires_at > now()
  RETURNING id, family_id INTO v_id, v_family_id;
  IF v_id IS NULL THEN RAISE EXCEPTION 'Invitation not found, expired, unavailable, or issued to another email'; END IF;
  INSERT INTO public.family_professional_access_events
    (invitation_id, family_id, actor_user_id, subject_user_id, event_type)
  VALUES (v_id, v_family_id, auth.uid(), auth.uid(), 'accepted');
  RETURN v_id;
END
$$;

CREATE OR REPLACE FUNCTION public.revoke_family_professional_invitation(p_invitation_id uuid)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE v_inv public.family_professional_invitations;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  SELECT * INTO v_inv FROM public.family_professional_invitations WHERE id = p_invitation_id FOR UPDATE;
  IF v_inv.id IS NULL THEN RAISE EXCEPTION 'Invitation not found'; END IF;
  IF NOT (v_inv.invited_by = auth.uid() OR public.is_family_moderator(v_inv.family_id, auth.uid())
          OR public.is_managing_org_member(v_inv.family_id, auth.uid()) OR public.is_super_admin(auth.uid())) THEN
    RAISE EXCEPTION 'Not authorized to revoke invitation';
  END IF;
  IF v_inv.status IN ('revoked', 'expired') THEN RETURN false; END IF;
  UPDATE public.family_professional_invitations
  SET status = 'revoked', revoked_by = auth.uid(), revoked_at = now(), updated_at = now()
  WHERE id = p_invitation_id;
  INSERT INTO public.family_professional_access_events
    (invitation_id, family_id, actor_user_id, subject_user_id, event_type)
  VALUES (v_inv.id, v_inv.family_id, auth.uid(), v_inv.accepted_by, 'revoked');
  RETURN true;
END
$$;

REVOKE ALL ON public.family_professional_invitations, public.family_professional_access_events FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.family_professional_invitations TO authenticated;
GRANT SELECT ON public.family_professional_access_events TO authenticated;
GRANT ALL ON public.family_professional_invitations, public.family_professional_access_events TO service_role;

-- ---------------------------------------------------------------------------
-- Coordination membership and task hardening
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Providers and admins can create cases" ON public.coordination_cases;
DROP POLICY IF EXISTS "Providers can update cases" ON public.coordination_cases;
REVOKE INSERT, UPDATE, DELETE ON public.coordination_cases FROM authenticated, anon;
DROP POLICY IF EXISTS "Providers can manage members" ON public.coordination_case_members;
DROP POLICY IF EXISTS "Providers can remove members" ON public.coordination_case_members;
DROP POLICY IF EXISTS "Case members can view members" ON public.coordination_case_members;

CREATE POLICY coordination_case_members_select
ON public.coordination_case_members FOR SELECT TO authenticated
USING (public.is_coordination_case_member(case_id, auth.uid()) OR public.is_super_admin(auth.uid())
  OR EXISTS (SELECT 1 FROM public.coordination_cases cc WHERE cc.id = case_id
    AND public.has_family_professional_capability(cc.family_id, auth.uid(), 'coordination.read')));
-- Intentionally no INSERT/UPDATE/DELETE policies. Membership is RPC-only.

CREATE OR REPLACE FUNCTION public.can_manage_coordination_case(p_case_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT p_user_id IS NOT NULL AND (
    public.is_super_admin(p_user_id)
    OR EXISTS (SELECT 1 FROM public.coordination_case_members ccm
      WHERE ccm.case_id = p_case_id AND ccm.user_id = p_user_id AND ccm.role IN ('admin', 'case_manager'))
    OR EXISTS (SELECT 1 FROM public.coordination_cases cc WHERE cc.id = p_case_id
      AND (public.is_family_moderator(cc.family_id, p_user_id)
        OR public.is_managing_org_member(cc.family_id, p_user_id)
        OR public.has_family_professional_capability(cc.family_id, p_user_id, 'coordination.manage')))
  )
$$;

-- Replace historical role-only channel authorization with explicit capability
-- checks. Case roles remain descriptive; they do not grant data access.
CREATE OR REPLACE FUNCTION public.is_coordination_provider(_case_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT _user_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.coordination_cases cc
    WHERE cc.id = _case_id
      AND public.is_coordination_case_member(cc.id, _user_id)
      AND (
        public.is_super_admin(_user_id)
        OR public.is_managing_org_member(cc.family_id, _user_id)
        OR public.has_family_professional_capability(cc.family_id, _user_id, 'coordination.manage')
        OR public.has_family_professional_capability(cc.family_id, _user_id, 'coordination.tasks.write')
      )
  )
$$;

CREATE OR REPLACE FUNCTION public.can_access_coordination_channel(_channel_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT _user_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.coordination_channels ch
    WHERE ch.id = _channel_id
      AND (
        (ch.channel_type = 'family' AND public.is_coordination_case_member(ch.case_id, _user_id))
        OR (ch.channel_type IN ('provider', 'ai_analysis')
            AND public.is_coordination_provider(ch.case_id, _user_id))
        OR public.is_super_admin(_user_id)
      )
  )
$$;

CREATE OR REPLACE FUNCTION public.can_write_coordination_channel(_channel_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT _user_id IS NOT NULL AND EXISTS (
    SELECT 1
    FROM public.coordination_channels ch
    JOIN public.coordination_cases cc ON cc.id = ch.case_id
    WHERE ch.id = _channel_id
      AND public.is_coordination_case_member(ch.case_id, _user_id)
      AND public.can_access_coordination_channel(ch.id, _user_id)
      AND (
        public.is_super_admin(_user_id)
        OR public.is_family_member(cc.family_id, _user_id)
        OR public.is_managing_org_member(cc.family_id, _user_id)
        OR public.has_family_professional_capability(cc.family_id, _user_id, 'coordination.manage')
        OR public.has_family_professional_capability(cc.family_id, _user_id, 'coordination.tasks.write')
      )
  )
$$;

DROP POLICY IF EXISTS "Auto-create channels" ON public.coordination_channels;
REVOKE INSERT, UPDATE, DELETE ON public.coordination_channels FROM authenticated, anon;
DROP POLICY IF EXISTS "Post messages in accessible channels" ON public.coordination_messages;
CREATE POLICY coordination_messages_insert
ON public.coordination_messages FOR INSERT TO authenticated
WITH CHECK (sender_id = auth.uid() AND public.can_write_coordination_channel(channel_id, auth.uid()));

DROP POLICY IF EXISTS "Providers can view AI insights" ON public.coordination_ai_insights;
DROP POLICY IF EXISTS "System can create insights" ON public.coordination_ai_insights;
DROP POLICY IF EXISTS "Providers can dismiss insights" ON public.coordination_ai_insights;
CREATE POLICY coordination_ai_insights_select
ON public.coordination_ai_insights FOR SELECT TO authenticated
USING (public.is_coordination_provider(case_id, auth.uid()) OR public.is_super_admin(auth.uid()));
CREATE POLICY coordination_ai_insights_insert
ON public.coordination_ai_insights FOR INSERT TO authenticated
WITH CHECK (public.is_coordination_provider(case_id, auth.uid()) OR public.is_super_admin(auth.uid()));
CREATE POLICY coordination_ai_insights_update
ON public.coordination_ai_insights FOR UPDATE TO authenticated
USING (public.is_coordination_provider(case_id, auth.uid()) OR public.is_super_admin(auth.uid()))
WITH CHECK (public.is_coordination_provider(case_id, auth.uid()) OR public.is_super_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.create_coordination_case(
  p_family_id uuid, p_title text, p_creator_role public.coordination_role DEFAULT 'case_manager'
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE v_case_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF p_creator_role NOT IN ('admin', 'case_manager', 'interventionist', 'clinician', 'treatment_provider') THEN
    RAISE EXCEPTION 'Invalid creator role';
  END IF;
  IF NOT (public.is_family_moderator(p_family_id, auth.uid())
          OR public.is_managing_org_member(p_family_id, auth.uid())
          OR public.has_family_professional_capability(p_family_id, auth.uid(), 'coordination.manage')
          OR public.is_super_admin(auth.uid())) THEN
    RAISE EXCEPTION 'Not authorized to create coordination case';
  END IF;
  INSERT INTO public.coordination_cases (family_id, title, created_by)
  VALUES (p_family_id, btrim(p_title), auth.uid()) RETURNING id INTO v_case_id;
  INSERT INTO public.coordination_case_members (case_id, user_id, role)
  VALUES (v_case_id, auth.uid(), p_creator_role);
  RETURN v_case_id;
END
$$;

CREATE OR REPLACE FUNCTION public.add_coordination_case_member(
  p_case_id uuid, p_user_id uuid, p_role public.coordination_role
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE v_id uuid; v_family_id uuid;
BEGIN
  IF auth.uid() IS NULL OR NOT public.can_manage_coordination_case(p_case_id, auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized to manage case membership';
  END IF;
  SELECT family_id INTO v_family_id FROM public.coordination_cases WHERE id = p_case_id FOR UPDATE;
  IF v_family_id IS NULL THEN RAISE EXCEPTION 'Coordination case not found'; END IF;
  IF p_role = 'family_member' THEN
    IF NOT public.is_family_member(v_family_id, p_user_id) THEN
      RAISE EXCEPTION 'Family role requires current family membership';
    END IF;
  ELSIF p_role IN ('admin', 'case_manager') THEN
    IF NOT (public.is_managing_org_member(v_family_id, p_user_id) OR public.is_super_admin(p_user_id)) THEN
      RAISE EXCEPTION 'Management roles require authorized organization membership';
    END IF;
  ELSIF NOT (
    public.is_managing_org_member(v_family_id, p_user_id)
    OR public.has_family_professional_capability(v_family_id, p_user_id, 'coordination.read')
    OR public.has_family_professional_capability(v_family_id, p_user_id, 'coordination.manage')
    OR public.is_super_admin(p_user_id)
  ) THEN
    RAISE EXCEPTION 'Professional role requires accepted family access';
  END IF;
  INSERT INTO public.coordination_case_members (case_id, user_id, role)
  VALUES (p_case_id, p_user_id, p_role)
  ON CONFLICT (case_id, user_id) DO UPDATE SET role = EXCLUDED.role
  RETURNING id INTO v_id;
  RETURN v_id;
END
$$;

CREATE OR REPLACE FUNCTION public.remove_coordination_case_member(p_case_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE v_count integer; v_target_role public.coordination_role;
BEGIN
  IF auth.uid() IS NULL OR NOT public.can_manage_coordination_case(p_case_id, auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized to manage case membership';
  END IF;
  PERFORM 1 FROM public.coordination_case_members WHERE case_id = p_case_id FOR UPDATE;
  SELECT role INTO v_target_role FROM public.coordination_case_members
  WHERE case_id = p_case_id AND user_id = p_user_id;
  IF v_target_role IN ('admin', 'case_manager') THEN
    SELECT count(*) INTO v_count FROM public.coordination_case_members
    WHERE case_id = p_case_id AND role IN ('admin', 'case_manager');
    IF v_count <= 1 THEN RAISE EXCEPTION 'Cannot remove the final case manager'; END IF;
  END IF;
  DELETE FROM public.coordination_case_members WHERE case_id = p_case_id AND user_id = p_user_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count > 0;
END
$$;

REVOKE INSERT, UPDATE, DELETE ON public.coordination_case_members FROM authenticated, anon;
GRANT SELECT ON public.coordination_case_members TO authenticated;

DROP POLICY IF EXISTS "Case members can view tasks" ON public.coordination_tasks;
DROP POLICY IF EXISTS "Members can create tasks" ON public.coordination_tasks;
DROP POLICY IF EXISTS "Assigned or providers can update tasks" ON public.coordination_tasks;
DROP POLICY IF EXISTS coordination_tasks_select ON public.coordination_tasks;
DROP POLICY IF EXISTS coordination_tasks_insert ON public.coordination_tasks;
DROP POLICY IF EXISTS coordination_tasks_update ON public.coordination_tasks;
DROP POLICY IF EXISTS coordination_tasks_delete ON public.coordination_tasks;

CREATE POLICY coordination_tasks_select ON public.coordination_tasks FOR SELECT TO authenticated
USING (public.is_coordination_case_member(case_id, auth.uid()) OR public.can_manage_coordination_case(case_id, auth.uid()));
CREATE POLICY coordination_tasks_insert ON public.coordination_tasks FOR INSERT TO authenticated
WITH CHECK (created_by = auth.uid() AND public.is_coordination_case_member(case_id, auth.uid())
  AND EXISTS (SELECT 1 FROM public.coordination_cases cc WHERE cc.id = case_id AND (
    public.is_family_member(cc.family_id, auth.uid())
    OR public.is_managing_org_member(cc.family_id, auth.uid())
    OR public.has_family_professional_capability(cc.family_id, auth.uid(), 'coordination.manage')
    OR public.has_family_professional_capability(cc.family_id, auth.uid(), 'coordination.tasks.write')
    OR public.is_super_admin(auth.uid())))
  AND (assigned_to IS NULL OR public.is_coordination_case_member(case_id, assigned_to)));
CREATE POLICY coordination_tasks_update ON public.coordination_tasks FOR UPDATE TO authenticated
USING (public.can_manage_coordination_case(case_id, auth.uid()) OR (
  assigned_to = auth.uid() AND EXISTS (SELECT 1 FROM public.coordination_cases cc WHERE cc.id = case_id AND (
    public.is_family_member(cc.family_id, auth.uid())
    OR public.has_family_professional_capability(cc.family_id, auth.uid(), 'coordination.tasks.write')))))
WITH CHECK (public.can_manage_coordination_case(case_id, auth.uid()) OR assigned_to = auth.uid());
CREATE POLICY coordination_tasks_delete ON public.coordination_tasks FOR DELETE TO authenticated
USING (public.can_manage_coordination_case(case_id, auth.uid()));

CREATE OR REPLACE FUNCTION public.enforce_coordination_task_write()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.created_by IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'Invalid task creator'; END IF;
  ELSE
    IF (NEW.id, NEW.case_id, NEW.created_by, NEW.created_at)
       IS DISTINCT FROM (OLD.id, OLD.case_id, OLD.created_by, OLD.created_at) THEN
      RAISE EXCEPTION 'Task identity fields are immutable';
    END IF;
    IF OLD.assigned_to = auth.uid() AND NOT public.can_manage_coordination_case(OLD.case_id, auth.uid())
       AND (NEW.assigned_to, NEW.channel_id, NEW.title, NEW.description, NEW.priority, NEW.due_date)
           IS DISTINCT FROM (OLD.assigned_to, OLD.channel_id, OLD.title, OLD.description, OLD.priority, OLD.due_date) THEN
      RAISE EXCEPTION 'Assignees may only update task status';
    END IF;
  END IF;
  IF NEW.assigned_to IS NOT NULL AND NOT public.is_coordination_case_member(NEW.case_id, NEW.assigned_to) THEN
    RAISE EXCEPTION 'Task assignee must be a current case member';
  END IF;
  IF NEW.status IN ('completed', 'complete') AND (TG_OP = 'INSERT' OR OLD.status NOT IN ('completed', 'complete')) THEN
    NEW.completed_at := now();
  ELSIF NEW.status NOT IN ('completed', 'complete') THEN NEW.completed_at := NULL;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS enforce_coordination_task_write ON public.coordination_tasks;
CREATE TRIGGER enforce_coordination_task_write
BEFORE INSERT OR UPDATE ON public.coordination_tasks
FOR EACH ROW EXECUTE FUNCTION public.enforce_coordination_task_write();

-- ---------------------------------------------------------------------------
-- Recipient-specific transition consent and closed-loop handoffs
-- ---------------------------------------------------------------------------
ALTER TABLE public.transition_summary_consents
  ADD COLUMN IF NOT EXISTS provider_handoff_id uuid REFERENCES public.provider_handoffs(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS consent_scope text NOT NULL DEFAULT 'transition_summary'
    CHECK (consent_scope IN ('transition_summary', 'transition_and_follow_up')),
  ADD COLUMN IF NOT EXISTS expires_at timestamptz;

ALTER TABLE public.transition_summary_consents
  DROP CONSTRAINT IF EXISTS transition_summary_consents_transition_summary_id_organization_id_key;
CREATE UNIQUE INDEX IF NOT EXISTS transition_summary_consents_active_recipient_idx
  ON public.transition_summary_consents (transition_summary_id, organization_id)
  WHERE revoked_at IS NULL;

-- Harden the canonical consent RPC used by existing clients. Only the subject
-- named by the summary may consent, and only for that summary's named recipient.
CREATE OR REPLACE FUNCTION public.sign_transition_consent(
  _transition_summary_id uuid,
  _organization_id uuid,
  _full_name text,
  _signature_data text,
  _notes text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE v_summary public.transition_summaries; v_id uuid; v_handoff_id uuid; v_encrypted text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  SELECT * INTO v_summary FROM public.transition_summaries WHERE id = _transition_summary_id FOR UPDATE;
  IF v_summary.id IS NULL THEN RAISE EXCEPTION 'Transition summary not found'; END IF;
  IF v_summary.user_id <> auth.uid() OR NOT public.is_family_member(v_summary.family_id, auth.uid()) THEN
    RAISE EXCEPTION 'Only the transition subject may consent';
  END IF;
  IF v_summary.to_organization_id IS NULL OR v_summary.to_organization_id <> _organization_id THEN
    RAISE EXCEPTION 'Consent recipient must match the transition summary';
  END IF;
  IF btrim(COALESCE(_full_name, '')) = '' OR btrim(COALESCE(_signature_data, '')) = '' THEN
    RAISE EXCEPTION 'Name and signature are required';
  END IF;
  IF EXISTS (SELECT 1 FROM public.transition_summary_consents c
    WHERE c.transition_summary_id = _transition_summary_id AND c.organization_id = _organization_id
      AND c.revoked_at IS NULL) THEN
    RAISE EXCEPTION 'Active consent already exists for this recipient';
  END IF;
  SELECT ph.id INTO v_handoff_id FROM public.provider_handoffs ph
  WHERE ph.transition_summary_id = _transition_summary_id
    AND ph.user_id = auth.uid() AND ph.to_organization_id = _organization_id
    AND ph.status = 'pending'
  ORDER BY ph.initiated_at DESC LIMIT 1;

  v_encrypted := public.encrypt_sensitive(_signature_data);
  INSERT INTO public.transition_summary_consents (
    transition_summary_id, provider_handoff_id, user_id, organization_id,
    full_name, signature_data, signature_data_encrypted, consent_version,
    consented_via, consent_recorded_by, patient_signature_hash,
    patient_acknowledged_at, patient_ip_address, patient_user_agent, notes
  ) VALUES (
    _transition_summary_id, v_handoff_id, auth.uid(), _organization_id,
    btrim(_full_name), '[SIGNATURE ON FILE]', v_encrypted, '2.0',
    'patient_signature', auth.uid(), encode(extensions.digest(_signature_data, 'sha256'), 'hex'), now(),
    current_setting('request.headers', true)::json->>'x-forwarded-for',
    current_setting('request.headers', true)::json->>'user-agent', _notes
  ) RETURNING id INTO v_id;
  RETURN v_id;
END
$$;

REVOKE ALL ON FUNCTION public.record_patient_consent(uuid, uuid, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sign_transition_consent(uuid, uuid, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sign_transition_consent(uuid, uuid, text, text, text) TO authenticated;

CREATE INDEX IF NOT EXISTS transition_consents_handoff_active_idx
  ON public.transition_summary_consents (provider_handoff_id, organization_id)
  WHERE revoked_at IS NULL;

-- Replace the historical notification trigger, which referenced a nonexistent
-- provider role and disclosed the family name before subject authorization.
CREATE OR REPLACE FUNCTION public.notify_org_on_handoff_request()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE v_admin record; v_from_org_name text;
BEGIN
  SELECT name INTO v_from_org_name FROM public.organizations WHERE id = NEW.from_organization_id;
  FOR v_admin IN
    SELECT om.user_id FROM public.organization_members om
    WHERE om.organization_id = NEW.to_organization_id AND om.role IN ('owner', 'admin')
  LOOP
    INSERT INTO public.notifications (user_id, family_id, type, title, body, related_id)
    VALUES (
      v_admin.user_id, NULL, 'handoff_request', 'Secure handoff authorization pending',
      COALESCE(v_from_org_name, 'A provider') || ' initiated a handoff. Family details remain unavailable until the named person authorizes this request.',
      NEW.id
    );
  END LOOP;
  RETURN NEW;
END
$$;
REVOKE ALL ON FUNCTION public.notify_org_on_handoff_request() FROM PUBLIC, anon, authenticated;

ALTER TABLE public.provider_handoffs
  ADD COLUMN IF NOT EXISTS response_notes text,
  ADD COLUMN IF NOT EXISTS cancelled_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancellation_reason text,
  ADD COLUMN IF NOT EXISTS completed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS completion_notes text,
  ADD COLUMN IF NOT EXISTS follow_up_due_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_transition_at timestamptz;

CREATE TABLE public.provider_handoff_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  handoff_id uuid NOT NULL REFERENCES public.provider_handoffs(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('initiated', 'accepted', 'declined', 'completed', 'cancelled')),
  actor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (handoff_id, event_type)
);
CREATE INDEX provider_handoff_events_handoff_created_idx
  ON public.provider_handoff_events (handoff_id, created_at);
ALTER TABLE public.provider_handoff_events ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.provider_handoff_authorizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  handoff_id uuid NOT NULL REFERENCES public.provider_handoffs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  authorization_scope text NOT NULL DEFAULT 'handoff_metadata'
    CHECK (authorization_scope IN ('handoff_metadata', 'handoff_and_summary')),
  full_name text NOT NULL,
  signature_data_encrypted text NOT NULL,
  signature_hash text NOT NULL,
  consent_version text NOT NULL DEFAULT '1.0',
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  revoked_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX provider_handoff_authorizations_active_idx
  ON public.provider_handoff_authorizations (handoff_id)
  WHERE revoked_at IS NULL;
ALTER TABLE public.provider_handoff_authorizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY provider_handoff_authorizations_select ON public.provider_handoff_authorizations
FOR SELECT TO authenticated USING (
  user_id = auth.uid() OR public.is_super_admin(auth.uid())
  OR public.is_org_admin(organization_id, auth.uid())
);
REVOKE ALL ON public.provider_handoff_authorizations FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.provider_handoff_authorizations TO authenticated;
GRANT ALL ON public.provider_handoff_authorizations TO service_role;

INSERT INTO public.provider_handoff_events (handoff_id, event_type, actor_user_id, created_at)
SELECT ph.id, 'initiated', ph.initiated_by, ph.initiated_at FROM public.provider_handoffs ph
ON CONFLICT (handoff_id, event_type) DO NOTHING;
INSERT INTO public.provider_handoff_events (handoff_id, event_type, actor_user_id, notes, created_at)
SELECT ph.id,
  CASE ph.status WHEN 'accepted' THEN 'accepted' WHEN 'declined' THEN 'declined'
    WHEN 'completed' THEN 'completed' WHEN 'cancelled' THEN 'cancelled' END,
  CASE WHEN ph.status IN ('accepted', 'completed') THEN ph.accepted_by ELSE ph.initiated_by END,
  COALESCE(ph.receiving_provider_notes, ph.declined_reason, ph.handoff_notes),
  COALESCE(ph.completed_at, ph.declined_at, ph.accepted_at, ph.updated_at)
FROM public.provider_handoffs ph WHERE ph.status <> 'pending'
ON CONFLICT (handoff_id, event_type) DO NOTHING;

CREATE POLICY provider_handoff_events_select ON public.provider_handoff_events FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.provider_handoffs ph WHERE ph.id = handoff_id AND
  (public.is_org_member(ph.from_organization_id, auth.uid()) OR public.is_org_member(ph.to_organization_id, auth.uid())
   OR ph.initiated_by = auth.uid() OR public.is_super_admin(auth.uid()))));
-- Events are immutable and RPC-only.
REVOKE ALL ON public.provider_handoff_events FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.provider_handoff_events TO authenticated;
GRANT ALL ON public.provider_handoff_events TO service_role;

CREATE OR REPLACE FUNCTION public.create_provider_handoff(
  p_family_id uuid,
  p_user_id uuid,
  p_from_organization_id uuid,
  p_to_organization_id uuid,
  p_transition_summary_id uuid DEFAULT NULL,
  p_handoff_notes text DEFAULT NULL,
  p_follow_up_due_at timestamptz DEFAULT NULL,
  p_transfer_reason public.transfer_reason DEFAULT NULL,
  p_transfer_reason_notes text DEFAULT NULL,
  p_referring_user_remains_co_mod boolean DEFAULT false
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE v_handoff_id uuid; v_sobriety_days integer := 0;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF p_from_organization_id = p_to_organization_id THEN RAISE EXCEPTION 'Receiving organization must be different'; END IF;
  IF NOT (public.is_org_admin(p_from_organization_id, auth.uid()) OR public.is_super_admin(auth.uid())) THEN
    RAISE EXCEPTION 'Referring organization admin required';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.families f WHERE f.id = p_family_id AND f.organization_id = p_from_organization_id) THEN
    RAISE EXCEPTION 'Family is not managed by the referring organization';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.family_members fm WHERE fm.family_id = p_family_id AND fm.user_id = p_user_id) THEN
    RAISE EXCEPTION 'Transition subject must be a current family member';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.organizations o WHERE o.id = p_to_organization_id) THEN
    RAISE EXCEPTION 'Receiving organization not found';
  END IF;
  IF p_transition_summary_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.transition_summaries ts
    WHERE ts.id = p_transition_summary_id AND ts.family_id = p_family_id
      AND ts.user_id = p_user_id AND ts.to_organization_id = p_to_organization_id
  ) THEN RAISE EXCEPTION 'Transition summary does not match the named recipient'; END IF;
  IF p_follow_up_due_at IS NOT NULL AND p_follow_up_due_at <= now() THEN
    RAISE EXCEPTION 'Follow-up date must be in the future';
  END IF;
  SELECT GREATEST(0, floor(extract(epoch FROM (now() - sj.start_date::timestamptz)) / 86400)::integer)
  INTO v_sobriety_days
  FROM public.sobriety_journeys sj
  WHERE sj.family_id = p_family_id AND sj.user_id = p_user_id AND sj.is_active
  ORDER BY sj.start_date DESC LIMIT 1;

  INSERT INTO public.provider_handoffs (
    user_id, family_id, from_organization_id, to_organization_id, transition_summary_id,
    initiated_by, sobriety_days_at_handoff, handoff_notes, follow_up_due_at, last_transition_at,
    transfer_reason, transfer_reason_notes, referring_user_remains_co_mod
  ) VALUES (
    p_user_id, p_family_id, p_from_organization_id, p_to_organization_id, p_transition_summary_id,
    auth.uid(), COALESCE(v_sobriety_days, 0), NULLIF(btrim(p_handoff_notes), ''), p_follow_up_due_at, now(),
    p_transfer_reason, NULLIF(btrim(p_transfer_reason_notes), ''), p_referring_user_remains_co_mod
  ) RETURNING id INTO v_handoff_id;
  INSERT INTO public.provider_handoff_events (handoff_id, event_type, actor_user_id, notes)
  VALUES (v_handoff_id, 'initiated', auth.uid(), NULLIF(btrim(p_handoff_notes), ''));
  RETURN v_handoff_id;
END
$$;

CREATE OR REPLACE FUNCTION public.sign_provider_handoff_authorization(
  p_handoff_id uuid,
  p_full_name text,
  p_signature_data text,
  p_expires_at timestamptz,
  p_authorization_scope text DEFAULT 'handoff_metadata'
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE v_handoff public.provider_handoffs; v_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  SELECT * INTO v_handoff FROM public.provider_handoffs WHERE id = p_handoff_id FOR UPDATE;
  IF v_handoff.id IS NULL OR v_handoff.status <> 'pending' THEN RAISE EXCEPTION 'Pending handoff required'; END IF;
  IF v_handoff.user_id <> auth.uid() OR NOT public.is_family_member(v_handoff.family_id, auth.uid()) THEN
    RAISE EXCEPTION 'Only the named transition subject may authorize this handoff';
  END IF;
  IF btrim(COALESCE(p_full_name, '')) = '' OR btrim(COALESCE(p_signature_data, '')) = '' THEN
    RAISE EXCEPTION 'Name and signature are required';
  END IF;
  IF p_expires_at <= now() OR p_expires_at > now() + interval '90 days' THEN
    RAISE EXCEPTION 'Authorization expiration must be within 90 days';
  END IF;
  IF p_authorization_scope NOT IN ('handoff_metadata', 'handoff_and_summary') THEN
    RAISE EXCEPTION 'Invalid authorization scope';
  END IF;
  IF v_handoff.transition_summary_id IS NOT NULL AND p_authorization_scope <> 'handoff_and_summary' THEN
    RAISE EXCEPTION 'This handoff includes a transition summary';
  END IF;
  UPDATE public.provider_handoff_authorizations
  SET revoked_at = now(), revoked_by = auth.uid()
  WHERE handoff_id = p_handoff_id AND revoked_at IS NULL;
  INSERT INTO public.provider_handoff_authorizations (
    handoff_id, user_id, organization_id, authorization_scope, full_name,
    signature_data_encrypted, signature_hash, expires_at
  ) VALUES (
    p_handoff_id, auth.uid(), v_handoff.to_organization_id, p_authorization_scope, btrim(p_full_name),
    public.encrypt_sensitive(p_signature_data), encode(extensions.digest(p_signature_data, 'sha256'), 'hex'), p_expires_at
  ) RETURNING id INTO v_id;
  RETURN v_id;
END
$$;

CREATE OR REPLACE FUNCTION public.sign_transition_handoff_consent(
  p_handoff_id uuid, p_full_name text, p_signature_data text,
  p_consent_scope text DEFAULT 'transition_summary', p_expires_at timestamptz DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE v_handoff public.provider_handoffs; v_id uuid; v_encrypted text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  SELECT * INTO v_handoff FROM public.provider_handoffs WHERE id = p_handoff_id FOR UPDATE;
  IF v_handoff.id IS NULL OR v_handoff.transition_summary_id IS NULL THEN
    RAISE EXCEPTION 'Handoff with transition summary required';
  END IF;
  IF v_handoff.user_id <> auth.uid() OR NOT public.is_family_member(v_handoff.family_id, auth.uid()) THEN
    RAISE EXCEPTION 'Only the transition subject may consent';
  END IF;
  IF v_handoff.status <> 'pending' THEN RAISE EXCEPTION 'Consent can only be signed for a pending handoff'; END IF;
  IF btrim(p_full_name) = '' OR btrim(p_signature_data) = '' THEN RAISE EXCEPTION 'Name and signature required'; END IF;
  IF p_consent_scope NOT IN ('transition_summary', 'transition_and_follow_up') THEN RAISE EXCEPTION 'Invalid consent scope'; END IF;
  IF p_expires_at IS NOT NULL AND p_expires_at <= now() THEN RAISE EXCEPTION 'Consent expiry must be in the future'; END IF;
  IF p_expires_at IS NULL OR p_expires_at > now() + interval '90 days' THEN
    RAISE EXCEPTION 'Consent expiration must be within 90 days';
  END IF;

  -- One subject action atomically authorizes the handoff metadata and the
  -- recipient-bound transition summary. If either insert fails, neither is kept.
  UPDATE public.provider_handoff_authorizations SET revoked_at = now(), revoked_by = auth.uid()
  WHERE handoff_id = p_handoff_id AND revoked_at IS NULL;
  INSERT INTO public.provider_handoff_authorizations (
    handoff_id, user_id, organization_id, authorization_scope, full_name,
    signature_data_encrypted, signature_hash, expires_at
  ) VALUES (
    p_handoff_id, auth.uid(), v_handoff.to_organization_id, 'handoff_and_summary', btrim(p_full_name),
    public.encrypt_sensitive(p_signature_data), encode(extensions.digest(p_signature_data, 'sha256'), 'hex'), p_expires_at
  );

  UPDATE public.transition_summary_consents SET revoked_at = now(), revoked_by = auth.uid()
  WHERE provider_handoff_id = p_handoff_id AND revoked_at IS NULL;
  v_encrypted := public.encrypt_sensitive(p_signature_data);
  INSERT INTO public.transition_summary_consents (
    transition_summary_id, provider_handoff_id, user_id, organization_id,
    full_name, signature_data, signature_data_encrypted, consent_version,
    consented_via, consent_recorded_by, patient_signature_hash,
    patient_acknowledged_at, notes, consent_scope, expires_at
  ) VALUES (
    v_handoff.transition_summary_id, p_handoff_id, auth.uid(), v_handoff.to_organization_id,
    btrim(p_full_name), '[SIGNATURE ON FILE]', v_encrypted, '2.0',
    'patient_signature', auth.uid(), encode(extensions.digest(p_signature_data, 'sha256'), 'hex'),
    now(), p_notes, p_consent_scope, p_expires_at
  ) RETURNING id INTO v_id;
  RETURN v_id;
END
$$;

CREATE OR REPLACE FUNCTION public.respond_to_provider_handoff(
  p_handoff_id uuid, p_response text, p_notes text DEFAULT NULL
)
RETURNS public.provider_handoffs
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE v_handoff public.provider_handoffs;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  SELECT * INTO v_handoff FROM public.provider_handoffs WHERE id = p_handoff_id FOR UPDATE;
  IF v_handoff.id IS NULL THEN RAISE EXCEPTION 'Handoff not found'; END IF;
  IF p_response NOT IN ('accepted', 'declined') THEN RAISE EXCEPTION 'Response must be accepted or declined'; END IF;
  IF v_handoff.status <> 'pending' THEN RAISE EXCEPTION 'Handoff is no longer pending'; END IF;
  IF NOT (public.is_org_admin(v_handoff.to_organization_id, auth.uid()) OR public.is_super_admin(auth.uid())) THEN
    RAISE EXCEPTION 'Receiving organization admin required';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.provider_handoff_authorizations a
    WHERE a.handoff_id = v_handoff.id AND a.user_id = v_handoff.user_id
      AND a.organization_id = v_handoff.to_organization_id
      AND a.revoked_at IS NULL AND a.expires_at > now()
  ) THEN RAISE EXCEPTION 'Active recipient-specific subject authorization required'; END IF;
  IF p_response = 'accepted' AND v_handoff.transition_summary_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.transition_summary_consents c
    WHERE c.provider_handoff_id = v_handoff.id
      AND c.transition_summary_id = v_handoff.transition_summary_id
      AND c.organization_id = v_handoff.to_organization_id
      AND c.user_id = v_handoff.user_id AND c.revoked_at IS NULL
      AND (c.expires_at IS NULL OR c.expires_at > now())
  ) THEN RAISE EXCEPTION 'Active recipient-specific patient consent required'; END IF;

  UPDATE public.provider_handoffs SET
    status = p_response::public.handoff_status,
    accepted_by = CASE WHEN p_response = 'accepted' THEN auth.uid() ELSE NULL END,
    accepted_at = CASE WHEN p_response = 'accepted' THEN now() ELSE NULL END,
    declined_at = CASE WHEN p_response = 'declined' THEN now() ELSE NULL END,
    declined_reason = CASE WHEN p_response = 'declined' THEN p_notes ELSE NULL END,
    response_notes = p_notes, last_transition_at = now(), updated_at = now()
  WHERE id = p_handoff_id RETURNING * INTO v_handoff;
  INSERT INTO public.provider_handoff_events (handoff_id, event_type, actor_user_id, notes)
  VALUES (p_handoff_id, p_response, auth.uid(), p_notes);
  RETURN v_handoff;
END
$$;

CREATE OR REPLACE FUNCTION public.complete_provider_handoff(p_handoff_id uuid, p_notes text DEFAULT NULL)
RETURNS public.provider_handoffs
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE v_handoff public.provider_handoffs;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  SELECT * INTO v_handoff FROM public.provider_handoffs WHERE id = p_handoff_id FOR UPDATE;
  IF v_handoff.id IS NULL OR v_handoff.status <> 'accepted' THEN RAISE EXCEPTION 'Accepted handoff required'; END IF;
  IF NOT (v_handoff.initiated_by = auth.uid() OR public.is_org_admin(v_handoff.from_organization_id, auth.uid())
          OR public.is_super_admin(auth.uid())) THEN RAISE EXCEPTION 'Referring organization must close the loop'; END IF;
  UPDATE public.provider_handoffs SET status = 'completed', completed_by = auth.uid(), completed_at = now(),
    completion_notes = p_notes, last_transition_at = now(), updated_at = now()
  WHERE id = p_handoff_id RETURNING * INTO v_handoff;
  INSERT INTO public.provider_handoff_events (handoff_id, event_type, actor_user_id, notes)
  VALUES (p_handoff_id, 'completed', auth.uid(), p_notes);
  RETURN v_handoff;
END
$$;

CREATE OR REPLACE FUNCTION public.cancel_provider_handoff(p_handoff_id uuid, p_reason text)
RETURNS public.provider_handoffs
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE v_handoff public.provider_handoffs;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  SELECT * INTO v_handoff FROM public.provider_handoffs WHERE id = p_handoff_id FOR UPDATE;
  IF v_handoff.id IS NULL OR v_handoff.status <> 'pending' THEN RAISE EXCEPTION 'Pending handoff required'; END IF;
  IF NOT (v_handoff.initiated_by = auth.uid() OR public.is_org_admin(v_handoff.from_organization_id, auth.uid())
          OR public.is_super_admin(auth.uid())) THEN RAISE EXCEPTION 'Referring organization admin required'; END IF;
  IF btrim(p_reason) = '' THEN RAISE EXCEPTION 'Cancellation reason required'; END IF;
  UPDATE public.provider_handoffs SET status = 'cancelled', cancelled_by = auth.uid(), cancelled_at = now(),
    cancellation_reason = p_reason, last_transition_at = now(), updated_at = now()
  WHERE id = p_handoff_id RETURNING * INTO v_handoff;
  INSERT INTO public.provider_handoff_events (handoff_id, event_type, actor_user_id, notes)
  VALUES (p_handoff_id, 'cancelled', auth.uid(), p_reason);
  RETURN v_handoff;
END
$$;

-- Prevent clients from bypassing the lifecycle RPCs.
DROP POLICY IF EXISTS "Involved orgs can view handoffs" ON public.provider_handoffs;
CREATE POLICY provider_handoffs_select_authorized ON public.provider_handoffs
FOR SELECT TO authenticated USING (
  initiated_by = auth.uid() OR user_id = auth.uid() OR public.is_super_admin(auth.uid())
  OR public.is_org_admin(from_organization_id, auth.uid())
  OR (
    public.is_org_admin(to_organization_id, auth.uid()) AND EXISTS (
      SELECT 1 FROM public.provider_handoff_authorizations a
      WHERE a.handoff_id = provider_handoffs.id AND a.user_id = provider_handoffs.user_id
        AND a.organization_id = provider_handoffs.to_organization_id
        AND a.revoked_at IS NULL AND a.expires_at > now()
    )
  )
);
REVOKE INSERT, UPDATE ON public.provider_handoffs FROM authenticated, anon;
GRANT SELECT ON public.provider_handoffs TO authenticated;
GRANT ALL ON public.provider_handoffs TO service_role;

-- Tighten receiving-summary access to the recipient-specific handoff consent.
DROP POLICY IF EXISTS "Receiving org can view with consent" ON public.transition_summaries;
CREATE POLICY "Receiving org can view with recipient handoff consent"
ON public.transition_summaries FOR SELECT TO authenticated
USING (
  is_shared_with_next_provider = true AND public.is_org_member(to_organization_id, auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.provider_handoffs ph
    JOIN public.transition_summary_consents c ON c.provider_handoff_id = ph.id
    WHERE ph.transition_summary_id = transition_summaries.id
      AND ph.to_organization_id = transition_summaries.to_organization_id
      AND ph.status IN ('accepted', 'completed')
      AND c.organization_id = ph.to_organization_id AND c.user_id = ph.user_id
      AND c.revoked_at IS NULL AND (c.expires_at IS NULL OR c.expires_at > now())
  )
);

-- ---------------------------------------------------------------------------
-- Explicit benchmark re-consent and privacy-safe server aggregates
-- ---------------------------------------------------------------------------
ALTER TABLE public.organizations
  ALTER COLUMN benchmark_opt_in SET DEFAULT false,
  ADD COLUMN IF NOT EXISTS benchmark_consent_at timestamptz,
  ADD COLUMN IF NOT EXISTS benchmark_consented_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS benchmark_consent_version text;

UPDATE public.organizations
SET benchmark_opt_in = false,
    benchmark_consent_at = NULL,
    benchmark_consented_by = NULL,
    benchmark_consent_version = NULL
WHERE benchmark_opt_in IS DISTINCT FROM false
   OR benchmark_consent_at IS NOT NULL
   OR benchmark_consented_by IS NOT NULL
   OR benchmark_consent_version IS NOT NULL;

ALTER TABLE public.organizations
  ADD CONSTRAINT organizations_benchmark_consent_check CHECK (
    (benchmark_opt_in = false AND benchmark_consent_at IS NULL AND benchmark_consented_by IS NULL AND benchmark_consent_version IS NULL)
    OR (benchmark_opt_in = true AND benchmark_consent_at IS NOT NULL AND benchmark_consented_by IS NOT NULL
        AND length(btrim(benchmark_consent_version)) > 0)
  );

CREATE OR REPLACE FUNCTION public.set_organization_benchmark_consent(
  p_organization_id uuid, p_opt_in boolean, p_consent_version text DEFAULT '2026-08-02'
)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT (public.is_org_admin(p_organization_id, auth.uid()) OR public.is_super_admin(auth.uid())) THEN
    RAISE EXCEPTION 'Organization admin required';
  END IF;
  IF p_opt_in AND btrim(COALESCE(p_consent_version, '')) = '' THEN RAISE EXCEPTION 'Consent version required'; END IF;
  UPDATE public.organizations SET
    benchmark_opt_in = p_opt_in,
    benchmark_consent_at = CASE WHEN p_opt_in THEN now() ELSE NULL END,
    benchmark_consented_by = CASE WHEN p_opt_in THEN auth.uid() ELSE NULL END,
    benchmark_consent_version = CASE WHEN p_opt_in THEN p_consent_version ELSE NULL END,
    updated_at = now()
  WHERE id = p_organization_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Organization not found'; END IF;
  RETURN true;
END
$$;

CREATE OR REPLACE FUNCTION public.get_provider_outcome_aggregates(
  p_organization_id uuid,
  p_window_start date DEFAULT (current_date - 90),
  p_window_end date DEFAULT current_date
)
RETURNS TABLE (
  metric_key text, cohort_size bigint, numerator bigint,
  metric_value numeric, suppressed boolean
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE v_cohort bigint;
BEGIN
  IF auth.uid() IS NULL OR NOT (public.is_org_admin(p_organization_id, auth.uid()) OR public.is_super_admin(auth.uid())) THEN
    RAISE EXCEPTION 'Organization admin required';
  END IF;
  IF p_window_start IS NULL OR p_window_end IS NULL OR p_window_start > p_window_end
     OR p_window_end > current_date OR p_window_start < p_window_end - 730 THEN
    RAISE EXCEPTION 'Invalid reporting window';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.organizations o WHERE o.id = p_organization_id AND o.outcome_tracking_enabled) THEN
    RAISE EXCEPTION 'Outcome tracking is not enabled';
  END IF;

  SELECT count(DISTINCT fm.user_id) INTO v_cohort
  FROM public.family_members fm
  JOIN public.families f ON f.id = fm.family_id
  WHERE f.organization_id = p_organization_id
    AND (fm.role = 'recovering' OR fm.is_primary_patient = true)
    AND fm.joined_at::date BETWEEN p_window_start AND p_window_end;

  RETURN QUERY
  WITH cohort AS (
    SELECT DISTINCT fm.user_id, fm.family_id
    FROM public.family_members fm
    JOIN public.families f ON f.id = fm.family_id
    WHERE f.organization_id = p_organization_id
      AND (fm.role = 'recovering' OR fm.is_primary_patient = true)
      AND fm.joined_at::date BETWEEN p_window_start AND p_window_end
  ), metrics AS (
    SELECT 'sobriety_stability_rate'::text AS key,
      count(*)::bigint AS denom,
      count(*) FILTER (WHERE EXISTS (
        SELECT 1 FROM public.sobriety_journeys sj
        WHERE sj.user_id = c.user_id AND sj.family_id = c.family_id AND sj.is_active
      ))::bigint AS num,
      count(*) FILTER (WHERE EXISTS (
        SELECT 1 FROM public.sobriety_journeys sj
        WHERE sj.user_id = c.user_id AND sj.family_id = c.family_id AND sj.is_active
      ))::numeric / NULLIF(count(*), 0) AS val
    FROM cohort c
    UNION ALL
    SELECT 'independent_living_rate',
      count(*)::bigint,
      count(*) FILTER (WHERE EXISTS (
        SELECT 1 FROM public.care_phases cp
        WHERE cp.user_id = c.user_id AND cp.family_id = c.family_id
          AND cp.is_current AND cp.phase_type = 'independent'
      ))::bigint,
      count(*) FILTER (WHERE EXISTS (
        SELECT 1 FROM public.care_phases cp
        WHERE cp.user_id = c.user_id AND cp.family_id = c.family_id
          AND cp.is_current AND cp.phase_type = 'independent'
      ))::numeric / NULLIF(count(*), 0)
    FROM cohort c
    UNION ALL
    SELECT 'completed_handoff_rate',
      count(*)::bigint,
      count(*) FILTER (WHERE EXISTS (
        SELECT 1 FROM public.provider_handoffs ph
        WHERE ph.user_id = c.user_id AND ph.family_id = c.family_id AND ph.status = 'completed'
      ))::bigint,
      count(*) FILTER (WHERE EXISTS (
        SELECT 1 FROM public.provider_handoffs ph
        WHERE ph.user_id = c.user_id AND ph.family_id = c.family_id AND ph.status = 'completed'
      ))::numeric / NULLIF(count(*), 0)
    FROM cohort c
    UNION ALL
    SELECT 'average_days_in_care', count(DISTINCT c.user_id)::bigint, NULL::bigint,
      avg((COALESCE(cp.ended_at, now())::date - cp.started_at::date))::numeric
    FROM cohort c
    JOIN public.care_phases cp ON cp.user_id = c.user_id AND cp.family_id = c.family_id
  )
  SELECT m.key, CASE WHEN m.denom < 10 THEN NULL ELSE m.denom END,
    CASE WHEN m.denom < 10 THEN NULL ELSE m.num END,
    CASE WHEN m.denom < 10 THEN NULL ELSE round(m.val, 4) END, m.denom < 10
  FROM metrics m;
END
$$;

CREATE OR REPLACE FUNCTION public.get_provider_benchmark_aggregates(
  p_provider_category text DEFAULT NULL,
  p_window_start date DEFAULT (current_date - 90),
  p_window_end date DEFAULT current_date
)
RETURNS TABLE (
  metric_key text, organization_count bigint, cohort_size bigint,
  numerator bigint, metric_value numeric, suppressed boolean
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE v_caller_org uuid; v_org_count bigint; v_cohort bigint;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF NOT public.is_super_admin(auth.uid()) THEN
    SELECT om.organization_id INTO v_caller_org
    FROM public.organization_members om JOIN public.organizations o ON o.id = om.organization_id
    WHERE om.user_id = auth.uid() AND om.role IN ('owner', 'admin') AND o.outcome_tracking_enabled
    ORDER BY om.joined_at LIMIT 1;
    IF v_caller_org IS NULL THEN RAISE EXCEPTION 'Eligible organization admin required'; END IF;
  END IF;
  IF p_window_start IS NULL OR p_window_end IS NULL OR p_window_start > p_window_end
     OR p_window_end > current_date OR p_window_start < p_window_end - 730 THEN
    RAISE EXCEPTION 'Invalid reporting window';
  END IF;

  SELECT count(DISTINCT f.organization_id), count(DISTINCT fm.user_id)
  INTO v_org_count, v_cohort
  FROM public.family_members fm
  JOIN public.families f ON f.id = fm.family_id
  JOIN public.organizations o ON o.id = f.organization_id
  WHERE o.benchmark_opt_in AND o.benchmark_consent_at IS NOT NULL
    AND o.outcome_tracking_enabled
    AND (p_provider_category IS NULL OR o.provider_category = p_provider_category)
    AND (fm.role = 'recovering' OR fm.is_primary_patient = true)
    AND fm.joined_at::date BETWEEN p_window_start AND p_window_end;

  RETURN QUERY
  WITH cohort AS (
    SELECT DISTINCT fm.user_id, fm.family_id
    FROM public.family_members fm
    JOIN public.families f ON f.id = fm.family_id
    JOIN public.organizations o ON o.id = f.organization_id
    WHERE o.benchmark_opt_in AND o.benchmark_consent_at IS NOT NULL
      AND o.outcome_tracking_enabled
      AND (p_provider_category IS NULL OR o.provider_category = p_provider_category)
      AND (fm.role = 'recovering' OR fm.is_primary_patient = true)
      AND fm.joined_at::date BETWEEN p_window_start AND p_window_end
  ), metrics AS (
    SELECT 'sobriety_stability_rate'::text AS key,
      count(*)::bigint AS denom,
      count(*) FILTER (WHERE EXISTS (
        SELECT 1 FROM public.sobriety_journeys sj
        WHERE sj.user_id = c.user_id AND sj.family_id = c.family_id AND sj.is_active
      ))::bigint AS num,
      count(*) FILTER (WHERE EXISTS (
        SELECT 1 FROM public.sobriety_journeys sj
        WHERE sj.user_id = c.user_id AND sj.family_id = c.family_id AND sj.is_active
      ))::numeric / NULLIF(count(*), 0) AS val
    FROM cohort c
    UNION ALL
    SELECT 'independent_living_rate',
      count(*)::bigint,
      count(*) FILTER (WHERE EXISTS (
        SELECT 1 FROM public.care_phases cp WHERE cp.user_id = c.user_id
          AND cp.family_id = c.family_id AND cp.is_current AND cp.phase_type = 'independent'
      ))::bigint,
      count(*) FILTER (WHERE EXISTS (
        SELECT 1 FROM public.care_phases cp WHERE cp.user_id = c.user_id
          AND cp.family_id = c.family_id AND cp.is_current AND cp.phase_type = 'independent'
      ))::numeric / NULLIF(count(*), 0)
    FROM cohort c
    UNION ALL
    SELECT 'completed_handoff_rate',
      count(*)::bigint,
      count(*) FILTER (WHERE EXISTS (
        SELECT 1 FROM public.provider_handoffs ph WHERE ph.user_id = c.user_id
          AND ph.family_id = c.family_id AND ph.status = 'completed'
      ))::bigint,
      count(*) FILTER (WHERE EXISTS (
        SELECT 1 FROM public.provider_handoffs ph WHERE ph.user_id = c.user_id
          AND ph.family_id = c.family_id AND ph.status = 'completed'
      ))::numeric / NULLIF(count(*), 0)
    FROM cohort c
    UNION ALL
    SELECT 'average_days_in_care', count(DISTINCT c.user_id)::bigint, NULL::bigint,
      avg((COALESCE(cp.ended_at, now())::date - cp.started_at::date))::numeric
    FROM cohort c JOIN public.care_phases cp ON cp.user_id = c.user_id AND cp.family_id = c.family_id
  )
  SELECT m.key,
    CASE WHEN v_org_count < 3 OR m.denom < 20 THEN NULL ELSE v_org_count END,
    CASE WHEN v_org_count < 3 OR m.denom < 20 THEN NULL ELSE m.denom END,
    CASE WHEN v_org_count < 3 OR m.denom < 20 THEN NULL ELSE m.num END,
    CASE WHEN v_org_count < 3 OR m.denom < 20 THEN NULL ELSE round(m.val, 4) END,
    v_org_count < 3 OR m.denom < 20
  FROM metrics m;
END
$$;

-- ---------------------------------------------------------------------------
-- Function privilege boundary (default EXECUTE is granted to PUBLIC).
-- ---------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.has_family_professional_capability(uuid, uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.can_manage_family_work(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.can_manage_coordination_case(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_family_professional_capability(uuid, uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_manage_family_work(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_manage_coordination_case(uuid, uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.create_family_professional_invitation(uuid, text, text, text[], timestamptz) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.accept_family_professional_invitation(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.revoke_family_professional_invitation(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.create_coordination_case(uuid, text, public.coordination_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.add_coordination_case_member(uuid, uuid, public.coordination_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.remove_coordination_case_member(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.create_provider_handoff(uuid, uuid, uuid, uuid, uuid, text, timestamptz, public.transfer_reason, text, boolean) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.sign_provider_handoff_authorization(uuid, text, text, timestamptz, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.sign_transition_handoff_consent(uuid, text, text, text, timestamptz, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.respond_to_provider_handoff(uuid, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.complete_provider_handoff(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.cancel_provider_handoff(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.set_organization_benchmark_consent(uuid, boolean, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_provider_outcome_aggregates(uuid, date, date) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_provider_benchmark_aggregates(text, date, date) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.create_family_professional_invitation(uuid, text, text, text[], timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_family_professional_invitation(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_family_professional_invitation(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_coordination_case(uuid, text, public.coordination_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_coordination_case_member(uuid, uuid, public.coordination_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_coordination_case_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_provider_handoff(uuid, uuid, uuid, uuid, uuid, text, timestamptz, public.transfer_reason, text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sign_provider_handoff_authorization(uuid, text, text, timestamptz, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sign_transition_handoff_consent(uuid, text, text, text, timestamptz, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.respond_to_provider_handoff(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_provider_handoff(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_provider_handoff(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_organization_benchmark_consent(uuid, boolean, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_provider_outcome_aggregates(uuid, date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_provider_benchmark_aggregates(text, date, date) TO authenticated;

COMMENT ON FUNCTION public.get_provider_outcome_aggregates(uuid, date, date) IS
  'Privacy-safe organization aggregate; suppresses metrics below 10 distinct families and never returns row identifiers.';
COMMENT ON FUNCTION public.get_provider_benchmark_aggregates(text, date, date) IS
  'Opt-in benchmark aggregate; suppresses below 3 organizations or 10 distinct families and never returns row identifiers.';