-- Provider handoff new columns
ALTER TABLE public.provider_handoffs
  ADD COLUMN IF NOT EXISTS referring_user_remains_co_mod BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS transfer_reason public.transfer_reason,
  ADD COLUMN IF NOT EXISTS transfer_reason_notes TEXT,
  ADD COLUMN IF NOT EXISTS declined_reason TEXT,
  ADD COLUMN IF NOT EXISTS declined_at TIMESTAMP WITH TIME ZONE;

-- family_co_moderators
CREATE TABLE IF NOT EXISTS public.family_co_moderators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  granted_by UUID NOT NULL,
  granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  handoff_id UUID REFERENCES public.provider_handoffs(id) ON DELETE SET NULL,
  referring_organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  display_label TEXT NOT NULL DEFAULT 'Co-Moderator',
  is_active BOOLEAN NOT NULL DEFAULT true,
  revoked_at TIMESTAMP WITH TIME ZONE,
  revoked_by UUID,
  UNIQUE(family_id, user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.family_co_moderators TO authenticated;
GRANT ALL ON public.family_co_moderators TO service_role;

ALTER TABLE public.family_co_moderators ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "Co-moderators can view their own record"
  ON public.family_co_moderators FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Family members can see co_moderators"
  ON public.family_co_moderators FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.family_members fm
    WHERE fm.family_id = family_co_moderators.family_id
      AND fm.user_id = auth.uid()
  ));

-- org_transfer_invites
CREATE TABLE IF NOT EXISTS public.org_transfer_invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  from_organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL,
  invited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  org_name TEXT NOT NULL,
  contact_name TEXT,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  target_level_of_care public.care_phase_type,
  invite_message TEXT,
  transfer_reason public.transfer_reason,
  transfer_reason_notes TEXT,
  referring_user_remains_co_mod BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent','registered','linked','expired','cancelled')),
  invite_token TEXT NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '30 days'),
  linked_organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  linked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.org_transfer_invites TO authenticated;
GRANT ALL ON public.org_transfer_invites TO service_role;

ALTER TABLE public.org_transfer_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sending org can manage invites"
  ON public.org_transfer_invites FOR ALL
  USING (public.is_org_member(from_organization_id, auth.uid()))
  WITH CHECK (public.is_org_member(from_organization_id, auth.uid()));

CREATE POLICY "Super admins can view all invites"
  ON public.org_transfer_invites FOR SELECT
  USING (public.is_super_admin(auth.uid()));

-- Allow initiator to see their own handoffs
DROP POLICY IF EXISTS "Initiator can always view their own handoffs" ON public.provider_handoffs;
CREATE POLICY "Initiator can always view their own handoffs"
  ON public.provider_handoffs FOR SELECT
  USING (initiated_by = auth.uid());

-- Helper function
CREATE OR REPLACE FUNCTION public.is_family_co_moderator(_family_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.family_co_moderators
    WHERE family_id = _family_id AND user_id = _user_id AND is_active = true
  )
$$;

-- Trigger on handoff acceptance
CREATE OR REPLACE FUNCTION public.handle_handoff_accepted()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
    UPDATE public.families SET organization_id = NEW.to_organization_id WHERE id = NEW.family_id;

    IF NEW.referring_user_remains_co_mod = true THEN
      INSERT INTO public.family_co_moderators (
        family_id, user_id, granted_by, handoff_id, referring_organization_id, display_label
      )
      SELECT
        NEW.family_id, NEW.initiated_by, NEW.accepted_by, NEW.id, NEW.from_organization_id,
        COALESCE(
          (SELECT INITCAP(REPLACE(om.role::TEXT, '_', ' '))
           FROM public.organization_members om
           WHERE om.user_id = NEW.initiated_by AND om.organization_id = NEW.from_organization_id
           LIMIT 1),
          'Co-Moderator'
        )
      ON CONFLICT (family_id, user_id) DO UPDATE
        SET is_active = true, revoked_at = NULL,
            handoff_id = EXCLUDED.handoff_id, display_label = EXCLUDED.display_label;

      INSERT INTO public.family_members (family_id, user_id, role)
      VALUES (NEW.family_id, NEW.initiated_by, 'co_moderator'::public.family_role)
      ON CONFLICT (family_id, user_id) DO UPDATE SET role = 'co_moderator'::public.family_role;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_handoff_accepted ON public.provider_handoffs;
CREATE TRIGGER on_handoff_accepted
  AFTER UPDATE ON public.provider_handoffs
  FOR EACH ROW EXECUTE FUNCTION public.handle_handoff_accepted();

-- RPC: get_co_moderated_families
CREATE OR REPLACE FUNCTION public.get_co_moderated_families(_user_id UUID)
RETURNS TABLE (
  family_id UUID, family_name TEXT, organization_id UUID, organization_name TEXT,
  display_label TEXT, granted_at TIMESTAMP WITH TIME ZONE, member_count BIGINT
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    f.id, f.name, f.organization_id, o.name,
    fcm.display_label, fcm.granted_at,
    (SELECT COUNT(*) FROM public.family_members fm2 WHERE fm2.family_id = f.id)
  FROM public.family_co_moderators fcm
  JOIN public.families f ON f.id = fcm.family_id
  LEFT JOIN public.organizations o ON o.id = f.organization_id
  WHERE fcm.user_id = _user_id AND fcm.is_active = true
  ORDER BY fcm.granted_at DESC
$$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_family_co_mods_user ON public.family_co_moderators(user_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_family_co_mods_family ON public.family_co_moderators(family_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_org_transfer_invites_token ON public.org_transfer_invites(invite_token) WHERE status = 'sent';
CREATE INDEX IF NOT EXISTS idx_org_transfer_invites_email ON public.org_transfer_invites(contact_email) WHERE status = 'sent';
CREATE INDEX IF NOT EXISTS idx_provider_handoffs_initiator ON public.provider_handoffs(initiated_by);