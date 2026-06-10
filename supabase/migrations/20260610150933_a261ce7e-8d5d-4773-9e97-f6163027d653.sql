-- ============================================================
-- PART A: Expand aftercare_recommendations with source tracking
-- ============================================================

-- Drop the restrictive CHECK so we can accept the expanded taxonomy
ALTER TABLE public.aftercare_recommendations
  DROP CONSTRAINT IF EXISTS valid_recommendation_type;

ALTER TABLE public.aftercare_recommendations
  ADD CONSTRAINT valid_recommendation_type CHECK (
    recommendation_type IN (
      'therapy','meetings','outpatient','php','iop','residential',
      'sober_living','psychiatry','medical','medication_management',
      'drug_testing','case_management','family_therapy','wellness',
      'individual_therapy','couples_therapy','weekly_therapy',
      'meeting_attendance','alanon_meetings','other'
    )
  );

ALTER TABLE public.aftercare_recommendations
  ADD COLUMN IF NOT EXISTS source_document_id uuid REFERENCES public.family_documents(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS source_evidence_quote text,
  ADD COLUMN IF NOT EXISTS minimum_expected_per_week numeric,
  ADD COLUMN IF NOT EXISTS accountability_relevant boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS checkin_category text,
  ADD COLUMN IF NOT EXISTS provider_name text,
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS end_date date;

CREATE INDEX IF NOT EXISTS idx_aftercare_recs_source_doc
  ON public.aftercare_recommendations (source_document_id);
CREATE INDEX IF NOT EXISTS idx_aftercare_recs_plan_type
  ON public.aftercare_recommendations (plan_id, recommendation_type);
CREATE INDEX IF NOT EXISTS idx_aftercare_recs_plan_checkin_cat
  ON public.aftercare_recommendations (plan_id, checkin_category);

CREATE UNIQUE INDEX IF NOT EXISTS aftercare_recommendations_unique_source_title
  ON public.aftercare_recommendations (plan_id, source_document_id, lower(trim(title)))
  WHERE source_document_id IS NOT NULL;

-- ============================================================
-- PART B: accountability_plan_targets
-- ============================================================
CREATE TABLE IF NOT EXISTS public.accountability_plan_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  target_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  source_document_id uuid REFERENCES public.family_documents(id) ON DELETE SET NULL,
  source_aftercare_recommendation_id uuid REFERENCES public.aftercare_recommendations(id) ON DELETE SET NULL,
  target_type text NOT NULL,
  label text NOT NULL,
  checkin_category text,
  expected_frequency text,
  minimum_expected_per_week numeric,
  start_date date,
  end_date date,
  importance text NOT NULL DEFAULT 'medium',
  evidence_quote text,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.accountability_plan_targets TO authenticated;
GRANT ALL ON public.accountability_plan_targets TO service_role;

ALTER TABLE public.accountability_plan_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Family members can view plan targets"
  ON public.accountability_plan_targets FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.family_members fm
            WHERE fm.family_id = accountability_plan_targets.family_id
              AND fm.user_id = auth.uid())
    OR public.is_managing_org_member(family_id, auth.uid())
    OR public.is_professional_moderator(family_id, auth.uid())
    OR public.is_super_admin(auth.uid())
  );

CREATE POLICY "Authorized users can insert plan targets"
  ON public.accountability_plan_targets FOR INSERT
  TO authenticated
  WITH CHECK (
    public.can_manage_aftercare_plans(family_id, auth.uid())
    OR public.is_managing_org_member(family_id, auth.uid())
    OR public.is_super_admin(auth.uid())
  );

CREATE POLICY "Authorized users can update plan targets"
  ON public.accountability_plan_targets FOR UPDATE
  TO authenticated
  USING (
    public.can_manage_aftercare_plans(family_id, auth.uid())
    OR public.is_managing_org_member(family_id, auth.uid())
    OR public.is_super_admin(auth.uid())
  );

CREATE POLICY "Authorized users can delete plan targets"
  ON public.accountability_plan_targets FOR DELETE
  TO authenticated
  USING (
    public.can_manage_aftercare_plans(family_id, auth.uid())
    OR public.is_managing_org_member(family_id, auth.uid())
    OR public.is_super_admin(auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_apt_family ON public.accountability_plan_targets (family_id);
CREATE INDEX IF NOT EXISTS idx_apt_target_user ON public.accountability_plan_targets (target_user_id);
CREATE INDEX IF NOT EXISTS idx_apt_source_doc ON public.accountability_plan_targets (source_document_id);
CREATE INDEX IF NOT EXISTS idx_apt_type ON public.accountability_plan_targets (target_type);
CREATE INDEX IF NOT EXISTS idx_apt_active ON public.accountability_plan_targets (is_active);

-- Avoid duplicate targets on re-analysis of the same document
CREATE UNIQUE INDEX IF NOT EXISTS apt_unique_per_doc_type_label
  ON public.accountability_plan_targets
  (family_id, source_document_id, target_type, lower(trim(label)))
  WHERE source_document_id IS NOT NULL;

CREATE TRIGGER apt_updated_at
  BEFORE UPDATE ON public.accountability_plan_targets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- PART C: drug_test_results
-- ============================================================
CREATE TABLE IF NOT EXISTS public.drug_test_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  target_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  entered_by uuid NOT NULL REFERENCES auth.users(id),
  source_document_id uuid REFERENCES public.family_documents(id) ON DELETE SET NULL,
  attachment_document_id uuid REFERENCES public.family_documents(id) ON DELETE SET NULL,
  test_date date NOT NULL,
  test_type text,
  panel text,
  result text NOT NULL CHECK (result IN ('negative','positive','inconclusive','missed','refused','pending')),
  substances_detected text[],
  testing_provider text,
  notes text,
  is_manual_entry boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.drug_test_results TO authenticated;
GRANT ALL ON public.drug_test_results TO service_role;

ALTER TABLE public.drug_test_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Family members can view drug test results"
  ON public.drug_test_results FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.family_members fm
            WHERE fm.family_id = drug_test_results.family_id
              AND fm.user_id = auth.uid())
    OR public.is_managing_org_member(family_id, auth.uid())
    OR public.is_professional_moderator(family_id, auth.uid())
    OR public.is_super_admin(auth.uid())
  );

CREATE POLICY "Authorized users can insert drug test results"
  ON public.drug_test_results FOR INSERT
  TO authenticated
  WITH CHECK (
    entered_by = auth.uid()
    AND (
      public.can_manage_aftercare_plans(family_id, auth.uid())
      OR public.is_managing_org_member(family_id, auth.uid())
      OR public.is_super_admin(auth.uid())
    )
  );

CREATE POLICY "Authorized users can update drug test results"
  ON public.drug_test_results FOR UPDATE
  TO authenticated
  USING (
    public.can_manage_aftercare_plans(family_id, auth.uid())
    OR public.is_managing_org_member(family_id, auth.uid())
    OR public.is_super_admin(auth.uid())
  );

CREATE POLICY "Authorized users can delete drug test results"
  ON public.drug_test_results FOR DELETE
  TO authenticated
  USING (
    public.can_manage_aftercare_plans(family_id, auth.uid())
    OR public.is_managing_org_member(family_id, auth.uid())
    OR public.is_super_admin(auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_dtr_family_date ON public.drug_test_results (family_id, test_date DESC);
CREATE INDEX IF NOT EXISTS idx_dtr_user_date ON public.drug_test_results (target_user_id, test_date DESC);
CREATE INDEX IF NOT EXISTS idx_dtr_result ON public.drug_test_results (result);
CREATE INDEX IF NOT EXISTS idx_dtr_source_doc ON public.drug_test_results (source_document_id);

CREATE TRIGGER dtr_updated_at
  BEFORE UPDATE ON public.drug_test_results
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();