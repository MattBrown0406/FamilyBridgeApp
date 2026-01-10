-- Create a trigger function to send push notifications when notifications are inserted
CREATE OR REPLACE FUNCTION public.trigger_push_notification()
RETURNS TRIGGER AS $$
DECLARE
  payload jsonb;
BEGIN
  -- Build the payload for the push notification
  payload := jsonb_build_object(
    'user_ids', jsonb_build_array(NEW.user_id),
    'title', NEW.title,
    'body', NEW.body,
    'type', NEW.type,
    'data', jsonb_build_object(
      'family_id', NEW.family_id,
      'related_id', NEW.related_id,
      'url', CASE 
        WHEN NEW.family_id IS NOT NULL THEN '/family/' || NEW.family_id
        ELSE '/dashboard'
      END
    )
  );
  
  -- Use pg_net to call the edge function asynchronously
  PERFORM net.http_post(
    url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-push-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := payload
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the insert
    RAISE WARNING 'Push notification failed: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on notifications table
DROP TRIGGER IF EXISTS on_notification_insert_push ON public.notifications;
CREATE TRIGGER on_notification_insert_push
  AFTER INSERT ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_push_notification();

-- Add unique constraint to push_subscriptions for upsert
ALTER TABLE public.push_subscriptions 
  DROP CONSTRAINT IF EXISTS push_subscriptions_user_endpoint_unique;
ALTER TABLE public.push_subscriptions 
  ADD CONSTRAINT push_subscriptions_user_endpoint_unique UNIQUE (user_id, endpoint);