-- Revoke the bogus activation code issued without payment confirmation
UPDATE public.activation_codes
SET expires_at = now() - interval '1 second',
    updated_at = now()
WHERE code = 'E63Y-2CGW-83XJ';

INSERT INTO public.activation_code_audit_log (activation_code_id, action, performed_by, performed_at, details)
SELECT id, 'manual_revoke', 'system', now(),
       jsonb_build_object('reason', 'Issued by webhook on subscription.created without verified payment method; orphan Square subscription canceled')
FROM public.activation_codes
WHERE code = 'E63Y-2CGW-83XJ';