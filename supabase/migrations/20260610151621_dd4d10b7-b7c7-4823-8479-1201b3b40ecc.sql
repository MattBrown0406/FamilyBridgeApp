CREATE TABLE IF NOT EXISTS public.accountability_acknowledgements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  target_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  source_target_id uuid REFERENCES public.accountability_plan_targets(id) ON DELETE SET NULL,
  source_type text NOT NULL DEFAULT 'aftercare_overperformance',
  acknowledgement_type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  metric_label text,
  expected_value numeric,
  actual_value numeric,
  window_start date,
  window_end date,
  severity text NOT NULL DEFAULT 'positive',
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.accountability_acknowledgements TO authenticated;
GRANT ALL ON public.accountability_acknowledgements TO service_role;

ALTER TABLE public.accountability_acknowledgements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Family members view acknowledgements"
ON public.accountability_acknowledgements
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.family_members fm
    WHERE fm.family_id = accountability_acknowledgements.family_id
      AND fm.user_id = auth.uid()
  )
);

CREATE POLICY "Target user views own acknowledgements"
ON public.accountability_acknowledgements
FOR SELECT
TO authenticated
USING (target_user_id = auth.uid());

CREATE POLICY "Admins and moderators manage acknowledgements"
ON public.accountability_acknowledgements
FOR ALL
TO authenticated
USING (
  public.is_family_admin_or_moderator(family_id, auth.uid())
  OR public.is_super_admin(auth.uid())
)
WITH CHECK (
  public.is_family_admin_or_moderator(family_id, auth.uid())
  OR public.is_super_admin(auth.uid())
);

CREATE INDEX IF NOT EXISTS idx_ack_family_created ON public.accountability_acknowledgements (family_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ack_target_user_created ON public.accountability_acknowledgements (target_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ack_source_target ON public.accountability_acknowledgements (source_target_id);
CREATE INDEX IF NOT EXISTS idx_ack_is_read ON public.accountability_acknowledgements (is_read);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_ack_source_window_type
  ON public.accountability_acknowledgements (source_target_id, window_start, acknowledgement_type)
  WHERE source_target_id IS NOT NULL;
