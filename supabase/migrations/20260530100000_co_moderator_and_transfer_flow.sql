-- ============================================================
-- CO-MODERATOR ROLE + FAMILY CO-MODERATORS TABLE
-- + ORG TRANSFER INVITES (for orgs not yet on FamilyBridge)
-- + TWO-PARTY HANDSHAKE ENHANCEMENTS ON PROVIDER_HANDOFFS
-- ============================================================

-- 1. Add co_moderator to the family_role enum
ALTER TYPE public.family_role ADD VALUE IF NOT EXISTS 'co_moderator';

-- 2. Add transfer_reason enum
DO $$ BEGIN
  CREATE TYPE public.transfer_reason AS ENUM (
    'step_up',
    'step_down',
    'relapse_higher_loc',
    'aftercare_transition',
    'sober_living',
    'provider_change',
    'geographic_move',
    'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. Add co_moderator_remain flag + transfer_reason to provider_handoffs
ALTER TABLE public.provider_handoffs
  ADD COLUMN IF NOT EXISTS referring_user_remains_co_mod BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS transfer_reason public.transfer_reason,
  ADD COLUMN IF NOT EXISTS transfer_reason_notes TEXT,
  ADD COLUMN IF NOT EXISTS declined_reason TEXT,
  ADD COLUMN IF NOT EXISTS declined_at TIMESTAMP WITH TIME ZONE;

-- 4. Family co_moderators table
-- Tracks users who retain co-moderator access after a family is transferred
CREATE TABLE IF NOT EXISTS public.family_co_moderators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  granted_by UUID NOT NULL,
  granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  -- source handoff that created this relationship (nullable for manually added)
  handoff_id UUID REFERENCES public.provider_handoffs(id) ON DELETE SET NULL,
  -- the org they came from (for display / context)
  referring_organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  -- human-readable label shown in the family group (e.g. "Interventionist", "Prior Case Manager")
  display_label TEXT NOT NULL DEFAULT 'Co-Moderator',
  is_active BOOLEAN NOT NULL DEFAULT true,
  revoked_at TIMESTAMP WITH TIME ZONE,
  revoked_by UUID,
  UNIQUE(family_id, user_id)
);

ALTER TABLE public.family_co_moderators ENABLE ROW LEVEL SECURITY;

-- 5. Org transfer invites
-- For orgs not yet registered on FamilyBridge
-- Stores the intent so when they sign up they can auto-receive the pending handoff
CREATE TABLE IF NOT EXISTS public.org_transfer_invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  from_organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL,
  invited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  -- target org info (pre-registration)
  org_name TEXT NOT NULL,
  contact_name TEXT,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  -- optional level of care context
  target_level_of_care public.care_phase_type,
  -- notes to include in invite email
  invite_message TEXT,
  -- transfer details to carry over once they register
  transfer_reason public.transfer_reason,
  transfer_reason_notes TEXT,
  referring_user_remains_co_mod BOOLEAN NOT NULL DEFAULT false,
  -- status lifecycle
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'registered', 'linked', 'expired', 'cancelled')),
  -- secure token for the invite link (families.app.lovable... + token)
  invite_token TEXT NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '30 days'),
  -- once they register and link
  linked_organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  linked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.org_transfer_invites ENABLE ROW LEVEL SECURITY;

-- 6. RLS: family_co_moderators

-- The primary moderator of the family (and org admins) can manage co-moderators
DROP POLICY IF EXISTS "Family moderator can manage co_moderators"
  ON public.family_co_moderators;
CREATE POLICY "Family moderator can manage co_moderators"
  ON public.family_co_moderators FOR ALL
  USING (
    public.is_family_moderator(family_id, auth.uid())
    OR public.is_managing_org_member(family_id, auth.uid())
  )
  WITH CHECK (
    public.is_family_moderator(family_id, auth.uid())
    OR public.is_managing_org_member(family_id, auth.uid())
  );

-- Co-moderators can see their own record
DROP POLICY IF EXISTS "Co-moderators can view their own record"
  ON public.family_co_moderators;
CREATE POLICY "Co-moderators can view their own record"
  ON public.family_co_moderators FOR SELECT
  USING (user_id = auth.uid());

-- Family members can see who the co-moderators are
DROP POLICY IF EXISTS "Family members can see co_moderators"
  ON public.family_co_moderators;
CREATE POLICY "Family members can see co_moderators"
  ON public.family_co_moderators FOR SELECT
  USING (public.is_family_member(family_id, auth.uid()));

-- 7. RLS: org_transfer_invites

DROP POLICY IF EXISTS "Sending org can manage invites"
  ON public.org_transfer_invites;
CREATE POLICY "Sending org can manage invites"
  ON public.org_transfer_invites FOR ALL
  USING (public.is_org_member(from_organization_id, auth.uid()))
  WITH CHECK (public.is_org_member(from_organization_id, auth.uid()));

-- Super admins can view all invites (for admin panel)
DROP POLICY IF EXISTS "Super admins can view all invites"
  ON public.org_transfer_invites;
CREATE POLICY "Super admins can view all invites"
  ON public.org_transfer_invites FOR SELECT
  USING (public.is_super_admin(auth.uid()));

-- 8. RLS: extend provider_handoffs so co-mod referrer can see their handoffs
-- (The existing "Involved orgs can view handoffs" policy covers the org side.
--  This covers solo interventionists with no org.)
DROP POLICY IF EXISTS "Initiator can always view their own handoffs"
  ON public.provider_handoffs;
CREATE POLICY "Initiator can always view their own handoffs"
  ON public.provider_handoffs FOR SELECT
  USING (initiated_by = auth.uid());

-- 9. Helper: check if a user is a co_moderator of a family
CREATE OR REPLACE FUNCTION public.is_family_co_moderator(_family_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.family_co_moderators fcm
    WHERE fcm.family_id = _family_id
      AND fcm.user_id = _user_id
      AND fcm.is_active = true
  )
$$;

-- 10. Extend existing RLS on family_members so co-mods can see all family members
-- (They already have a family_members row with role = 'co_moderator', so existing
--  is_family_member() checks pass automatically once we insert that row.)

-- 11. Trigger: when provider_handoffs is accepted → auto-insert family_co_moderators row
--     if referring_user_remains_co_mod = true
CREATE OR REPLACE FUNCTION public.handle_handoff_accepted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only fire on status transition to 'accepted'
  IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN

    -- Update family's organization_id to the new org
    UPDATE public.families
    SET organization_id = NEW.to_organization_id
    WHERE id = NEW.family_id;

    -- If referrer wants to remain as co-moderator
    IF NEW.referring_user_remains_co_mod = true THEN
      -- Upsert into family_co_moderators
      INSERT INTO public.family_co_moderators (
        family_id,
        user_id,
        granted_by,
        handoff_id,
        referring_organization_id,
        display_label
      )
      SELECT
        NEW.family_id,
        NEW.initiated_by,
        NEW.accepted_by,
        NEW.id,
        NEW.from_organization_id,
        -- Try to derive a label from their role in the sending org
        COALESCE(
          (SELECT INITCAP(REPLACE(om.role::TEXT, '_', ' '))
           FROM public.organization_members om
           WHERE om.user_id = NEW.initiated_by
             AND om.organization_id = NEW.from_organization_id
           LIMIT 1),
          'Co-Moderator'
        )
      ON CONFLICT (family_id, user_id) DO UPDATE
        SET is_active = true,
            revoked_at = NULL,
            handoff_id = EXCLUDED.handoff_id,
            display_label = EXCLUDED.display_label;

      -- Also add/update the family_members row with co_moderator role
      INSERT INTO public.family_members (family_id, user_id, role)
      VALUES (NEW.family_id, NEW.initiated_by, 'co_moderator')
      ON CONFLICT (family_id, user_id) DO UPDATE
        SET role = 'co_moderator';
    END IF;

  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_handoff_accepted ON public.provider_handoffs;
CREATE TRIGGER on_handoff_accepted
  AFTER UPDATE ON public.provider_handoffs
  FOR EACH ROW EXECUTE FUNCTION public.handle_handoff_accepted();

-- 12. Function to get all families a user is co-moderating
CREATE OR REPLACE FUNCTION public.get_co_moderated_families(_user_id UUID)
RETURNS TABLE (
  family_id UUID,
  family_name TEXT,
  organization_id UUID,
  organization_name TEXT,
  display_label TEXT,
  granted_at TIMESTAMP WITH TIME ZONE,
  member_count BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    f.id AS family_id,
    f.name AS family_name,
    f.organization_id,
    o.name AS organization_name,
    fcm.display_label,
    fcm.granted_at,
    (SELECT COUNT(*) FROM public.family_members fm2 WHERE fm2.family_id = f.id) AS member_count
  FROM public.family_co_moderators fcm
  JOIN public.families f ON f.id = fcm.family_id
  LEFT JOIN public.organizations o ON o.id = f.organization_id
  WHERE fcm.user_id = _user_id
    AND fcm.is_active = true
  ORDER BY fcm.granted_at DESC
$$;

-- 13. Indexes
CREATE INDEX IF NOT EXISTS idx_family_co_mods_user ON public.family_co_moderators(user_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_family_co_mods_family ON public.family_co_moderators(family_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_org_transfer_invites_token ON public.org_transfer_invites(invite_token) WHERE status = 'sent';
CREATE INDEX IF NOT EXISTS idx_org_transfer_invites_email ON public.org_transfer_invites(contact_email) WHERE status = 'sent';
CREATE INDEX IF NOT EXISTS idx_provider_handoffs_initiator ON public.provider_handoffs(initiated_by);
