-- ============================================================
-- HANDOFF NOTIFICATION TYPES + AUTO-NOTIFY TRIGGERS
-- ============================================================

-- 1. Expand the notifications type constraint to include handoff + invite types
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check
CHECK (type = ANY (ARRAY[
  'message'::text,
  'financial_request'::text,
  'vote'::text,
  'member_joined'::text,
  'location_request'::text,
  'location_response'::text,
  'overdue_checkout'::text,
  'boundary_request'::text,
  'boundary_approved'::text,
  'paid_moderator_request'::text,
  'paid_moderator_activated'::text,
  -- New: handoff / transfer flow
  'handoff_request'::text,       -- Sent to all org admins when a new handoff arrives
  'handoff_accepted'::text,      -- Sent to initiator when receiving org accepts
  'handoff_declined'::text,      -- Sent to initiator when receiving org declines
  'org_transfer_invite'::text    -- Sent to initiator confirming an invite was queued
]));

-- 2. Trigger: notify receiving org admins when a new handoff_request is created
CREATE OR REPLACE FUNCTION public.notify_org_on_handoff_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  family_name_val TEXT;
  from_org_name   TEXT;
  org_admin       RECORD;
BEGIN
  -- Only fire on INSERT (new pending handoff)
  IF TG_OP != 'INSERT' THEN RETURN NEW; END IF;

  SELECT f.name INTO family_name_val
    FROM public.families f WHERE f.id = NEW.family_id;

  SELECT o.name INTO from_org_name
    FROM public.organizations o WHERE o.id = NEW.from_organization_id;

  -- Notify all admins + owners of the receiving org
  FOR org_admin IN
    SELECT om.user_id
      FROM public.organization_members om
     WHERE om.organization_id = NEW.to_organization_id
       AND om.role IN ('owner', 'admin', 'moderator')
  LOOP
    INSERT INTO public.notifications (
      user_id, family_id, type, title, body, related_id
    ) VALUES (
      org_admin.user_id,
      NEW.family_id,
      'handoff_request',
      'Transfer Request: ' || COALESCE(family_name_val, 'a family'),
      COALESCE(from_org_name, 'Another provider') || ' wants to transfer this family group to your organization. Review it in the Transfers tab.',
      NEW.id
    );
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_handoff_request_created ON public.provider_handoffs;
CREATE TRIGGER on_handoff_request_created
  AFTER INSERT ON public.provider_handoffs
  FOR EACH ROW EXECUTE FUNCTION public.notify_org_on_handoff_request();

-- 3. Trigger: notify initiator when handoff is accepted or declined
CREATE OR REPLACE FUNCTION public.notify_initiator_on_handoff_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  family_name_val TEXT;
  to_org_name     TEXT;
BEGIN
  -- Only fire on status change to 'accepted' or 'declined'
  IF TG_OP != 'UPDATE' THEN RETURN NEW; END IF;
  IF NEW.status = OLD.status THEN RETURN NEW; END IF;
  IF NEW.status NOT IN ('accepted', 'declined') THEN RETURN NEW; END IF;

  SELECT f.name INTO family_name_val
    FROM public.families f WHERE f.id = NEW.family_id;

  SELECT o.name INTO to_org_name
    FROM public.organizations o WHERE o.id = NEW.to_organization_id;

  IF NEW.status = 'accepted' THEN
    INSERT INTO public.notifications (
      user_id, family_id, type, title, body, related_id
    ) VALUES (
      NEW.initiated_by,
      NEW.family_id,
      'handoff_accepted',
      'Transfer Accepted ✓',
      COALESCE(to_org_name, 'The receiving program') || ' accepted the transfer of ' ||
        COALESCE(family_name_val, 'your family group') || '.' ||
        CASE WHEN NEW.referring_user_remains_co_mod
          THEN ' You''ve been added as co-moderator.'
          ELSE ''
        END,
      NEW.id
    );
  ELSIF NEW.status = 'declined' THEN
    INSERT INTO public.notifications (
      user_id, family_id, type, title, body, related_id
    ) VALUES (
      NEW.initiated_by,
      NEW.family_id,
      'handoff_declined',
      'Transfer Declined',
      COALESCE(to_org_name, 'The receiving program') || ' declined the transfer of ' ||
        COALESCE(family_name_val, 'your family group') || '.' ||
        CASE WHEN NEW.declined_reason IS NOT NULL
          THEN ' Reason: ' || NEW.declined_reason
          ELSE ' No reason was provided.'
        END,
      NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_handoff_status_changed ON public.provider_handoffs;
CREATE TRIGGER on_handoff_status_changed
  AFTER UPDATE ON public.provider_handoffs
  FOR EACH ROW EXECUTE FUNCTION public.notify_initiator_on_handoff_status();

-- 4. Trigger: notify initiator when an org_transfer_invite is created (confirms email was queued)
CREATE OR REPLACE FUNCTION public.notify_on_org_invite_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  family_name_val TEXT;
BEGIN
  SELECT f.name INTO family_name_val
    FROM public.families f WHERE f.id = NEW.family_id;

  INSERT INTO public.notifications (
    user_id, family_id, type, title, body, related_id
  ) VALUES (
    NEW.invited_by,
    NEW.family_id,
    'org_transfer_invite',
    'Invitation Sent',
    'An invitation to join FamilyBridge was sent to ' || NEW.contact_email ||
      ' for the ' || COALESCE(family_name_val, 'family') || ' transfer. ' ||
      'The family will be transferred automatically once they register.',
    NEW.id
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_org_invite_created ON public.org_transfer_invites;
CREATE TRIGGER on_org_invite_created
  AFTER INSERT ON public.org_transfer_invites
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_org_invite_created();
