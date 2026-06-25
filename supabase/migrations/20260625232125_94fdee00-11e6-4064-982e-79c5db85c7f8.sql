CREATE TABLE IF NOT EXISTS public.billing_audit_alerts (
  id bigserial PRIMARY KEY,
  issue_type text NOT NULL CHECK (issue_type IN (
    'subscription_id_missing_after_completed_payment',
    'activation_code_missing_after_completed_payment'
  )),
  payment_id text NOT NULL,
  order_id text,
  order_id_hash text,
  customer_id_hash text,
  amount_cents integer,
  currency text DEFAULT 'USD',
  payment_created_at timestamptz,
  payment_note text,
  product_type text CHECK (product_type IN ('family', 'provider', 'unknown')) DEFAULT 'unknown',
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'ignored')),
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  alert_sent_at timestamptz,
  resolved_at timestamptz,
  resolution_note text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (issue_type, payment_id)
);

CREATE INDEX IF NOT EXISTS billing_audit_alerts_status_idx
  ON public.billing_audit_alerts (status, first_seen_at DESC);
CREATE INDEX IF NOT EXISTS billing_audit_alerts_payment_idx
  ON public.billing_audit_alerts (payment_id);
CREATE INDEX IF NOT EXISTS billing_audit_alerts_order_hash_idx
  ON public.billing_audit_alerts (order_id_hash);

ALTER TABLE public.billing_audit_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins can view billing audit alerts" ON public.billing_audit_alerts;
CREATE POLICY "Super admins can view billing audit alerts"
ON public.billing_audit_alerts FOR SELECT TO authenticated
USING (public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Super admins can update billing audit alerts" ON public.billing_audit_alerts;
CREATE POLICY "Super admins can update billing audit alerts"
ON public.billing_audit_alerts FOR UPDATE TO authenticated
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));

GRANT SELECT, UPDATE ON public.billing_audit_alerts TO authenticated;
GRANT ALL ON public.billing_audit_alerts TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.billing_audit_alerts_id_seq TO service_role;

CREATE OR REPLACE FUNCTION public.touch_billing_audit_alerts_updated_at()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS touch_billing_audit_alerts_updated_at ON public.billing_audit_alerts;
CREATE TRIGGER touch_billing_audit_alerts_updated_at
BEFORE UPDATE ON public.billing_audit_alerts
FOR EACH ROW EXECUTE FUNCTION public.touch_billing_audit_alerts_updated_at();

-- Ensure only one cron job exists for this watchdog
DO $$
DECLARE j record;
BEGIN
  FOR j IN SELECT jobid FROM cron.job WHERE jobname = 'fb-audit-square-billing' LOOP
    PERFORM cron.unschedule(j.jobid);
  END LOOP;
END $$;

SELECT cron.schedule(
  'fb-audit-square-billing',
  '17 * * * *',
  $cron$
  SELECT net.http_post(
    url     := 'https://lljqptscpeamwfkzsezo.supabase.co/functions/v1/audit-square-billing',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || (
        SELECT decrypted_secret FROM vault.decrypted_secrets
        WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1
      )
    ),
    body    := jsonb_build_object('source', 'pg_cron')
  );
  $cron$
);

COMMENT ON TABLE public.billing_audit_alerts IS
'Billing watchdog alerts for completed Square web payments that did not produce an activation code or stored recurring subscription ID.';