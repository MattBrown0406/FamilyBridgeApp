ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN (
    'message',
    'financial_request',
    'vote',
    'member_joined',
    'location_request',
    'location_response',
    'overdue_checkout',
    'handoff_request',
    'handoff_accepted',
    'handoff_declined',
    'org_transfer_invite'
  ));

CREATE OR REPLACE FUNCTION public.notify_handoff_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_family_name text;
  v_from_org_name text;
  v_user record;
BEGIN
  SELECT name INTO v_family_name FROM public.families WHERE id = NEW.family_id;
  SELECT name INTO v_from_org_name FROM public.organizations WHERE id = NEW.from_organization_id;

  FOR v_user IN
    SELECT DISTINCT om.user_id
    FROM public.organization_members om
    WHERE om.organization_id = NEW.to_organization_id
      AND om.role IN ('admin', 'moderator', 'owner')
  LOOP
    INSERT INTO public.notifications (user_id, type, title, body, family_id, is_read)
    VALUES (
      v_user.user_id,
      'handoff_request',
      'New care transfer request',
      COALESCE(v_from_org_name, 'A provider') || ' is requesting to transfer ' || COALESCE(v_family_name, 'a family') || ' to your organization.',
      NEW.family_id,
      false
    );
  END LOOP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_handoff_request_created ON public.provider_handoffs;
CREATE TRIGGER on_handoff_request_created
AFTER INSERT ON public.provider_handoffs
FOR EACH ROW
EXECUTE FUNCTION public.notify_handoff_request();

CREATE OR REPLACE FUNCTION public.notify_handoff_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_family_name text;
  v_to_org_name text;
BEGIN
  IF NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;

  SELECT name INTO v_family_name FROM public.families WHERE id = NEW.family_id;
  SELECT name INTO v_to_org_name FROM public.organizations WHERE id = NEW.to_organization_id;

  IF NEW.status = 'accepted' AND NEW.initiated_by IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, body, family_id, is_read)
    VALUES (
      NEW.initiated_by,
      'handoff_accepted',
      'Care transfer accepted',
      COALESCE(v_to_org_name, 'The receiving organization') || ' accepted the transfer of ' || COALESCE(v_family_name, 'the family') || '.',
      NEW.family_id,
      false
    );
  ELSIF NEW.status = 'declined' AND NEW.initiated_by IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, body, family_id, is_read)
    VALUES (
      NEW.initiated_by,
      'handoff_declined',
      'Care transfer declined',
      COALESCE(v_to_org_name, 'The receiving organization') || ' declined the transfer of ' || COALESCE(v_family_name, 'the family') || '.',
      NEW.family_id,
      false
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_handoff_status_changed ON public.provider_handoffs;
CREATE TRIGGER on_handoff_status_changed
AFTER UPDATE ON public.provider_handoffs
FOR EACH ROW
EXECUTE FUNCTION public.notify_handoff_status_change();

CREATE OR REPLACE FUNCTION public.notify_org_invite_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_family_name text;
BEGIN
  SELECT name INTO v_family_name FROM public.families WHERE id = NEW.family_id;

  IF NEW.invited_by IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, body, family_id, is_read)
    VALUES (
      NEW.invited_by,
      'org_transfer_invite',
      'Transfer invitation sent',
      'Invitation sent to ' || COALESCE(NEW.org_name, 'the receiving program') || ' for ' || COALESCE(v_family_name, 'the family') || '.',
      NEW.family_id,
      false
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_org_invite_created ON public.org_transfer_invites;
CREATE TRIGGER on_org_invite_created
AFTER INSERT ON public.org_transfer_invites
FOR EACH ROW
EXECUTE FUNCTION public.notify_org_invite_created();