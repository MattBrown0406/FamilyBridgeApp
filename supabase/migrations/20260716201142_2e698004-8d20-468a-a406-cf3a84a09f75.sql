-- Atomically redeem paid activation codes and create their family records.
-- The redeemed_family_id link makes retries with the same activation code idempotent.

ALTER TABLE public.activation_codes
  ADD COLUMN IF NOT EXISTS redeemed_family_id uuid
  REFERENCES public.families(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS family_invite_codes_invite_code_key
  ON public.family_invite_codes (invite_code);

CREATE OR REPLACE FUNCTION public.redeem_activation_code_and_create_family(
  p_activation_code text,
  p_family_name text,
  p_family_description text,
  p_admin_user_id uuid
)
RETURNS TABLE (
  family_id uuid,
  member_invite_code text,
  activation_code_id uuid,
  already_redeemed boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_activation public.activation_codes%ROWTYPE;
  v_family_id uuid;
  v_member_invite_code text;
BEGIN
  IF p_admin_user_id IS NULL THEN
    RAISE EXCEPTION USING
      ERRCODE = '42501',
      MESSAGE = 'authentication_required';
  END IF;

  IF p_activation_code IS NULL OR pg_catalog.btrim(p_activation_code) = '' THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      MESSAGE = 'activation_code_invalid';
  END IF;

  IF p_family_name IS NULL OR pg_catalog.btrim(p_family_name) = '' THEN
    RAISE EXCEPTION USING
      ERRCODE = '22023',
      MESSAGE = 'family_name_required';
  END IF;

  SELECT ac.*
    INTO v_activation
  FROM public.activation_codes AS ac
  WHERE ac.code = pg_catalog.upper(pg_catalog.btrim(p_activation_code))
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      MESSAGE = 'activation_code_invalid';
  END IF;

  IF v_activation.is_used THEN
    IF v_activation.used_by IS DISTINCT FROM p_admin_user_id THEN
      RAISE EXCEPTION USING
        ERRCODE = 'P0001',
        MESSAGE = 'activation_code_already_used';
    END IF;

    IF v_activation.redeemed_family_id IS NULL THEN
      RAISE EXCEPTION USING
        ERRCODE = 'P0001',
        MESSAGE = 'activation_code_already_used';
    END IF;

    SELECT fic.invite_code
      INTO v_member_invite_code
    FROM public.family_invite_codes AS fic
    WHERE fic.family_id = v_activation.redeemed_family_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION USING
        ERRCODE = 'P0001',
        MESSAGE = 'activation_redemption_incomplete';
    END IF;

    RETURN QUERY SELECT
      v_activation.redeemed_family_id,
      v_member_invite_code,
      v_activation.id,
      true;
    RETURN;
  END IF;

  IF v_activation.expires_at IS NOT NULL
     AND v_activation.expires_at <= pg_catalog.clock_timestamp() THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      MESSAGE = 'activation_code_expired';
  END IF;

  FOR v_attempt IN 1..10 LOOP
    v_member_invite_code := pg_catalog.substr(
      pg_catalog.md5(
        pg_catalog.random()::text
        || pg_catalog.clock_timestamp()::text
        || v_activation.id::text
        || v_attempt::text
      ),
      1,
      8
    );

    BEGIN
      INSERT INTO public.families (name, description, invite_code, created_by)
      VALUES (
        pg_catalog.btrim(p_family_name),
        NULLIF(pg_catalog.btrim(p_family_description), ''),
        v_member_invite_code,
        p_admin_user_id
      )
      RETURNING id INTO v_family_id;

      INSERT INTO public.family_invite_codes (family_id, invite_code)
      VALUES (v_family_id, v_member_invite_code);

      INSERT INTO public.family_members (family_id, user_id, role)
      VALUES (v_family_id, p_admin_user_id, 'admin'::public.family_role);

      EXIT;
    EXCEPTION WHEN unique_violation THEN
      IF v_attempt = 10 THEN
        RAISE EXCEPTION USING
          ERRCODE = 'P0001',
          MESSAGE = 'family_invite_code_generation_failed';
      END IF;
    END;
  END LOOP;

  UPDATE public.activation_codes AS ac
  SET is_used = true,
      used_by = p_admin_user_id,
      used_at = pg_catalog.clock_timestamp(),
      redeemed_family_id = v_family_id
  WHERE ac.id = v_activation.id
    AND ac.is_used = false;

  IF NOT FOUND THEN
    RAISE EXCEPTION USING
      ERRCODE = '40001',
      MESSAGE = 'activation_code_claim_conflict';
  END IF;

  RETURN QUERY SELECT
    v_family_id,
    v_member_invite_code,
    v_activation.id,
    false;
END;
$function$;

COMMENT ON FUNCTION public.redeem_activation_code_and_create_family(text, text, text, uuid)
  IS 'Service-only atomic and idempotent activation-code redemption and family creation.';

REVOKE ALL ON FUNCTION public.redeem_activation_code_and_create_family(text, text, text, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.redeem_activation_code_and_create_family(text, text, text, uuid) FROM anon;
REVOKE ALL ON FUNCTION public.redeem_activation_code_and_create_family(text, text, text, uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_activation_code_and_create_family(text, text, text, uuid) TO service_role;