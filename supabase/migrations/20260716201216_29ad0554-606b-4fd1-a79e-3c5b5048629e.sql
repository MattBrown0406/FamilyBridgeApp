-- Server-verified native purchase metadata and RevenueCat webhook idempotency.

ALTER TABLE public.paid_moderator_requests
  ADD COLUMN IF NOT EXISTS native_store_transaction_id text,
  ADD COLUMN IF NOT EXISTS native_store text,
  ADD COLUMN IF NOT EXISTS native_product_id text,
  ADD COLUMN IF NOT EXISTS native_purchase_at timestamptz,
  ADD COLUMN IF NOT EXISTS native_refunded_at timestamptz;

WITH ranked_revenuecat_rows AS (
  SELECT id,
         substring(square_order_id FROM 12) AS transaction_id,
         row_number() OVER (PARTITION BY square_order_id ORDER BY created_at, id) AS occurrence
  FROM public.paid_moderator_requests
  WHERE square_order_id LIKE 'revenuecat:%'
    AND length(square_order_id) > 11
    AND native_store_transaction_id IS NULL
)
UPDATE public.paid_moderator_requests AS request
SET native_store_transaction_id = ranked.transaction_id,
    native_product_id = 'com.familybridgeapp.app.crisis_moderation_daily',
    native_purchase_at = COALESCE(request.payment_completed_at, request.created_at)
FROM ranked_revenuecat_rows AS ranked
WHERE request.id = ranked.id
  AND ranked.occurrence = 1;

CREATE UNIQUE INDEX IF NOT EXISTS paid_moderator_requests_native_transaction_uidx
  ON public.paid_moderator_requests (native_store_transaction_id)
  WHERE native_store_transaction_id IS NOT NULL;

CREATE TABLE public.revenuecat_webhook_events (
  event_id text PRIMARY KEY,
  event_type text NOT NULL,
  app_id text NOT NULL,
  app_user_id text NOT NULL,
  product_id text NOT NULL,
  transaction_id text,
  environment text NOT NULL CHECK (environment IN ('PRODUCTION', 'SANDBOX')),
  store text NOT NULL CHECK (store IN ('APP_STORE', 'PLAY_STORE')),
  event_timestamp timestamptz NOT NULL,
  processing_status text NOT NULL DEFAULT 'processing'
    CHECK (processing_status IN ('processing', 'completed', 'failed')),
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_error text,
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);

ALTER TABLE public.revenuecat_webhook_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.revenuecat_webhook_events FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.revenuecat_webhook_events TO service_role;

CREATE TABLE public.revenuecat_customer_product_state (
  app_id text NOT NULL,
  environment text NOT NULL CHECK (environment IN ('PRODUCTION', 'SANDBOX')),
  store text NOT NULL CHECK (store IN ('APP_STORE', 'PLAY_STORE')),
  app_user_id text NOT NULL,
  product_id text NOT NULL,
  lifecycle_key text NOT NULL,
  lifecycle_status text NOT NULL,
  entitlement_ids text[] NOT NULL DEFAULT '{}'::text[],
  transaction_id text,
  expiration_at timestamptz,
  last_event_id text NOT NULL REFERENCES public.revenuecat_webhook_events(event_id),
  last_event_type text NOT NULL,
  last_event_timestamp timestamptz NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (app_id, environment, store, app_user_id, product_id, lifecycle_key)
);

ALTER TABLE public.revenuecat_customer_product_state ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.revenuecat_customer_product_state FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.revenuecat_customer_product_state TO service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE public.paid_moderator_requests TO service_role;

CREATE OR REPLACE FUNCTION public.apply_revenuecat_lifecycle_event(
  p_event_id text,
  p_event_type text,
  p_event_timestamp timestamptz,
  p_app_id text,
  p_environment text,
  p_store text,
  p_app_user_id text,
  p_product_id text,
  p_lifecycle_key text,
  p_lifecycle_status text,
  p_entitlement_ids text[],
  p_transaction_id text,
  p_expiration_at timestamptz,
  p_native_action text DEFAULT 'none'
)
RETURNS boolean
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v_rows integer := 0;
BEGIN
  IF p_native_action NOT IN ('none', 'revoke', 'restore') THEN
    RAISE EXCEPTION 'invalid_native_action';
  END IF;
  IF p_lifecycle_key IS NULL OR pg_catalog.btrim(p_lifecycle_key) = '' THEN
    RAISE EXCEPTION 'invalid_lifecycle_key';
  END IF;

  INSERT INTO public.revenuecat_customer_product_state (
    app_id, environment, store, app_user_id, product_id, lifecycle_key,
    lifecycle_status, entitlement_ids, transaction_id, expiration_at,
    last_event_id, last_event_type, last_event_timestamp, updated_at
  ) VALUES (
    p_app_id, p_environment, p_store, p_app_user_id, p_product_id, p_lifecycle_key,
    p_lifecycle_status, COALESCE(p_entitlement_ids, '{}'::text[]),
    p_transaction_id, p_expiration_at, p_event_id, p_event_type,
    p_event_timestamp, now()
  )
  ON CONFLICT (app_id, environment, store, app_user_id, product_id, lifecycle_key) DO UPDATE SET
    lifecycle_status = EXCLUDED.lifecycle_status,
    entitlement_ids = EXCLUDED.entitlement_ids,
    transaction_id = COALESCE(EXCLUDED.transaction_id, revenuecat_customer_product_state.transaction_id),
    expiration_at = EXCLUDED.expiration_at,
    last_event_id = EXCLUDED.last_event_id,
    last_event_type = EXCLUDED.last_event_type,
    last_event_timestamp = EXCLUDED.last_event_timestamp,
    updated_at = now()
  WHERE (revenuecat_customer_product_state.last_event_timestamp,
         revenuecat_customer_product_state.last_event_id)
      < (EXCLUDED.last_event_timestamp, EXCLUDED.last_event_id);

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows = 0 THEN
    RETURN false;
  END IF;

  IF p_native_action = 'revoke' AND p_transaction_id IS NOT NULL THEN
    UPDATE public.paid_moderator_requests
    SET status = 'refunded',
        expires_at = LEAST(COALESCE(expires_at, now()), now()),
        completed_at = COALESCE(completed_at, now()),
        native_refunded_at = COALESCE(native_refunded_at, now()),
        updated_at = now()
    WHERE native_store_transaction_id = p_transaction_id
       OR square_order_id IN ('revenuecat:' || p_transaction_id, 'appstore:' || p_transaction_id);
  ELSIF p_native_action = 'restore' AND p_transaction_id IS NOT NULL THEN
    UPDATE public.paid_moderator_requests
    SET native_refunded_at = NULL,
        expires_at = COALESCE(activated_at, created_at) + interval '24 hours',
        status = CASE
          WHEN COALESCE(activated_at, created_at) + interval '24 hours' > now() THEN 'active'
          ELSE 'completed'
        END,
        completed_at = CASE
          WHEN COALESCE(activated_at, created_at) + interval '24 hours' > now() THEN NULL
          ELSE COALESCE(completed_at, now())
        END,
        updated_at = now()
    WHERE native_store_transaction_id = p_transaction_id
       OR square_order_id IN ('revenuecat:' || p_transaction_id, 'appstore:' || p_transaction_id);
  END IF;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.apply_revenuecat_lifecycle_event(
  text, text, timestamptz, text, text, text, text, text, text, text, text[], text, timestamptz, text
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_revenuecat_lifecycle_event(
  text, text, timestamptz, text, text, text, text, text, text, text, text[], text, timestamptz, text
) TO service_role;

COMMENT ON TABLE public.revenuecat_webhook_events IS
  'Service-role-only idempotency and audit records for authenticated RevenueCat webhooks; payloads are intentionally minimized.';
COMMENT ON TABLE public.revenuecat_customer_product_state IS
  'Service-role-only RevenueCat lifecycle projection partitioned by app, environment, store, and transaction/lifecycle stream.';