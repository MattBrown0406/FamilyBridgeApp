CREATE OR REPLACE FUNCTION public.notify_family_on_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  sender_name TEXT;
BEGIN
  SELECT full_name INTO sender_name
  FROM public.profiles
  WHERE id = NEW.sender_id;

  INSERT INTO public.notifications (user_id, family_id, type, title, body, related_id)
  SELECT DISTINCT recipient.user_id,
    NEW.family_id,
    'message',
    'New message from ' || COALESCE(sender_name, 'a family member'),
    LEFT(NEW.content, 100),
    NEW.id
  FROM (
    SELECT fm.user_id
    FROM public.family_members fm
    WHERE fm.family_id = NEW.family_id

    UNION

    SELECT om.user_id
    FROM public.families f
    JOIN public.organization_members om ON om.organization_id = f.organization_id
    WHERE f.id = NEW.family_id
      AND om.role::text IN ('owner', 'admin', 'moderator', 'staff')

    UNION

    SELECT fcm.user_id
    FROM public.family_co_moderators fcm
    WHERE fcm.family_id = NEW.family_id
      AND fcm.is_active = true

    UNION

    SELECT tmr.assigned_moderator_id AS user_id
    FROM public.temporary_moderator_requests tmr
    WHERE tmr.family_id = NEW.family_id
      AND tmr.assigned_moderator_id IS NOT NULL
      AND tmr.status = 'active'
      AND tmr.expires_at > now()

    UNION

    SELECT pmr.assigned_moderator_id AS user_id
    FROM public.paid_moderator_requests pmr
    WHERE pmr.family_id = NEW.family_id
      AND pmr.assigned_moderator_id IS NOT NULL
      AND pmr.status = 'active'
      AND (pmr.expires_at IS NULL OR pmr.expires_at > now())
  ) AS recipient
  WHERE recipient.user_id IS NOT NULL
    AND recipient.user_id <> NEW.sender_id;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS on_notification_created_send_push ON public.notifications;
DROP TRIGGER IF EXISTS on_notification_insert_push ON public.notifications;
CREATE TRIGGER on_notification_insert_push
  AFTER INSERT ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_push_notification();