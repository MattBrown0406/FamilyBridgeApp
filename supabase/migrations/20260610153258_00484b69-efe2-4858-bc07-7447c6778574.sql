
-- ============ 1. family_documents extensions ============
ALTER TABLE public.family_documents
  ADD COLUMN IF NOT EXISTS fiis_analysis_status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS fiis_analysis_error text,
  ADD COLUMN IF NOT EXISTS fiis_summary jsonb,
  ADD COLUMN IF NOT EXISTS values_extracted integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS goals_extracted integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS recommendations_extracted integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS drug_tests_extracted integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_fiis_attempt_at timestamptz;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'family_documents_fiis_analysis_status_check') THEN
    ALTER TABLE public.family_documents
      ADD CONSTRAINT family_documents_fiis_analysis_status_check
      CHECK (fiis_analysis_status IS NULL OR fiis_analysis_status IN ('pending','processing','complete','no_findings','failed','needs_review'));
  END IF;
END $$;

-- ============ 2. family_boundaries extensions ============
ALTER TABLE public.family_boundaries
  ADD COLUMN IF NOT EXISTS source_document_id uuid REFERENCES public.family_documents(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS source_type text;

CREATE INDEX IF NOT EXISTS family_boundaries_source_document_id_idx
  ON public.family_boundaries(source_document_id);

CREATE UNIQUE INDEX IF NOT EXISTS family_boundaries_unique_source_content
  ON public.family_boundaries (family_id, source_document_id, lower(trim(content)))
  WHERE source_document_id IS NOT NULL;

-- ============ 3. aftercare_recommendations extensions ============
ALTER TABLE public.aftercare_recommendations
  ADD COLUMN IF NOT EXISTS source_document_id uuid REFERENCES public.family_documents(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS source_evidence_quote text,
  ADD COLUMN IF NOT EXISTS minimum_expected_per_week numeric,
  ADD COLUMN IF NOT EXISTS accountability_relevant boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS checkin_category text,
  ADD COLUMN IF NOT EXISTS provider_name text,
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS end_date date;

CREATE INDEX IF NOT EXISTS aftercare_recommendations_source_document_id_idx
  ON public.aftercare_recommendations(source_document_id);
CREATE INDEX IF NOT EXISTS aftercare_recommendations_plan_type_idx
  ON public.aftercare_recommendations(plan_id, recommendation_type);
CREATE INDEX IF NOT EXISTS aftercare_recommendations_plan_category_idx
  ON public.aftercare_recommendations(plan_id, checkin_category);

CREATE UNIQUE INDEX IF NOT EXISTS aftercare_recommendations_unique_source_title
  ON public.aftercare_recommendations (plan_id, source_document_id, lower(trim(title)))
  WHERE source_document_id IS NOT NULL;

-- ============ 4. accountability_plan_targets ============
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
  review_status text NOT NULL DEFAULT 'pending',
  approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at timestamptz,
  rejected_reason text,
  is_active boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add columns to existing table if it predates this migration
ALTER TABLE public.accountability_plan_targets
  ADD COLUMN IF NOT EXISTS source_document_id uuid REFERENCES public.family_documents(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS source_aftercare_recommendation_id uuid REFERENCES public.aftercare_recommendations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS expected_frequency text,
  ADD COLUMN IF NOT EXISTS minimum_expected_per_week numeric,
  ADD COLUMN IF NOT EXISTS checkin_category text,
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS end_date date,
  ADD COLUMN IF NOT EXISTS importance text NOT NULL DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS evidence_quote text,
  ADD COLUMN IF NOT EXISTS review_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS rejected_reason text,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.accountability_plan_targets TO authenticated;
GRANT ALL ON public.accountability_plan_targets TO service_role;

CREATE INDEX IF NOT EXISTS apt_family_idx ON public.accountability_plan_targets(family_id);
CREATE INDEX IF NOT EXISTS apt_target_user_idx ON public.accountability_plan_targets(target_user_id);
CREATE INDEX IF NOT EXISTS apt_source_doc_idx ON public.accountability_plan_targets(source_document_id);
CREATE INDEX IF NOT EXISTS apt_source_rec_idx ON public.accountability_plan_targets(source_aftercare_recommendation_id);
CREATE INDEX IF NOT EXISTS apt_type_idx ON public.accountability_plan_targets(target_type);
CREATE INDEX IF NOT EXISTS apt_active_idx ON public.accountability_plan_targets(is_active);
CREATE INDEX IF NOT EXISTS apt_review_idx ON public.accountability_plan_targets(review_status);

ALTER TABLE public.accountability_plan_targets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS apt_select ON public.accountability_plan_targets;
CREATE POLICY apt_select ON public.accountability_plan_targets
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.family_members fm WHERE fm.family_id = accountability_plan_targets.family_id AND fm.user_id = auth.uid())
    OR public.is_managing_org_member(family_id, auth.uid())
    OR public.is_super_admin(auth.uid())
  );

DROP POLICY IF EXISTS apt_modify ON public.accountability_plan_targets;
CREATE POLICY apt_modify ON public.accountability_plan_targets
  FOR ALL TO authenticated
  USING (
    public.is_family_admin_or_moderator(family_id, auth.uid())
    OR public.is_managing_org_member(family_id, auth.uid())
    OR public.is_super_admin(auth.uid())
  )
  WITH CHECK (
    public.is_family_admin_or_moderator(family_id, auth.uid())
    OR public.is_managing_org_member(family_id, auth.uid())
    OR public.is_super_admin(auth.uid())
  );

DROP TRIGGER IF EXISTS apt_updated_at ON public.accountability_plan_targets;
CREATE TRIGGER apt_updated_at BEFORE UPDATE ON public.accountability_plan_targets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ 5. drug_test_results ============
CREATE TABLE IF NOT EXISTS public.drug_test_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  target_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  entered_by uuid NOT NULL REFERENCES auth.users(id),
  source_document_id uuid REFERENCES public.family_documents(id) ON DELETE SET NULL,
  test_date date NOT NULL,
  test_type text,
  panel text,
  result text NOT NULL,
  substances_detected text[],
  testing_provider text,
  specimen_type text,
  notes text,
  attachment_document_id uuid REFERENCES public.family_documents(id) ON DELETE SET NULL,
  verification_status text NOT NULL DEFAULT 'manual',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.drug_test_results
  ADD COLUMN IF NOT EXISTS source_document_id uuid REFERENCES public.family_documents(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS attachment_document_id uuid REFERENCES public.family_documents(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS testing_provider text,
  ADD COLUMN IF NOT EXISTS specimen_type text,
  ADD COLUMN IF NOT EXISTS panel text;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.drug_test_results TO authenticated;
GRANT ALL ON public.drug_test_results TO service_role;

CREATE INDEX IF NOT EXISTS dtr_family_date_idx ON public.drug_test_results(family_id, test_date DESC);
CREATE INDEX IF NOT EXISTS dtr_user_date_idx ON public.drug_test_results(target_user_id, test_date DESC);
CREATE INDEX IF NOT EXISTS dtr_result_idx ON public.drug_test_results(result);
CREATE INDEX IF NOT EXISTS dtr_source_doc_idx ON public.drug_test_results(source_document_id);
CREATE INDEX IF NOT EXISTS dtr_attachment_doc_idx ON public.drug_test_results(attachment_document_id);

ALTER TABLE public.drug_test_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS dtr_select ON public.drug_test_results;
CREATE POLICY dtr_select ON public.drug_test_results
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.family_members fm WHERE fm.family_id = drug_test_results.family_id AND fm.user_id = auth.uid())
    OR public.is_managing_org_member(family_id, auth.uid())
    OR public.is_super_admin(auth.uid())
  );

DROP POLICY IF EXISTS dtr_modify ON public.drug_test_results;
CREATE POLICY dtr_modify ON public.drug_test_results
  FOR ALL TO authenticated
  USING (
    public.is_family_admin_or_moderator(family_id, auth.uid())
    OR public.is_managing_org_member(family_id, auth.uid())
    OR public.is_super_admin(auth.uid())
  )
  WITH CHECK (
    public.is_family_admin_or_moderator(family_id, auth.uid())
    OR public.is_managing_org_member(family_id, auth.uid())
    OR public.is_super_admin(auth.uid())
  );

DROP TRIGGER IF EXISTS dtr_updated_at ON public.drug_test_results;
CREATE TRIGGER dtr_updated_at BEFORE UPDATE ON public.drug_test_results
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ 6. accountability_acknowledgements ============
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

CREATE INDEX IF NOT EXISTS aack_family_created_idx ON public.accountability_acknowledgements(family_id, created_at DESC);
CREATE INDEX IF NOT EXISTS aack_user_created_idx ON public.accountability_acknowledgements(target_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS aack_source_target_idx ON public.accountability_acknowledgements(source_target_id);
CREATE INDEX IF NOT EXISTS aack_unread_idx ON public.accountability_acknowledgements(is_read);

CREATE UNIQUE INDEX IF NOT EXISTS accountability_ack_dedupe_target_window
  ON public.accountability_acknowledgements (source_target_id, window_start, acknowledgement_type)
  WHERE source_target_id IS NOT NULL;

ALTER TABLE public.accountability_acknowledgements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS aack_select ON public.accountability_acknowledgements;
CREATE POLICY aack_select ON public.accountability_acknowledgements
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.family_members fm WHERE fm.family_id = accountability_acknowledgements.family_id AND fm.user_id = auth.uid())
    OR public.is_managing_org_member(family_id, auth.uid())
    OR public.is_super_admin(auth.uid())
  );

DROP POLICY IF EXISTS aack_modify ON public.accountability_acknowledgements;
CREATE POLICY aack_modify ON public.accountability_acknowledgements
  FOR ALL TO authenticated
  USING (
    public.is_family_admin_or_moderator(family_id, auth.uid())
    OR public.is_managing_org_member(family_id, auth.uid())
    OR public.is_super_admin(auth.uid())
  )
  WITH CHECK (
    public.is_family_admin_or_moderator(family_id, auth.uid())
    OR public.is_managing_org_member(family_id, auth.uid())
    OR public.is_super_admin(auth.uid())
  );

-- ============ 7. accountability_exceptions ============
CREATE TABLE IF NOT EXISTS public.accountability_exceptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  target_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  target_id uuid REFERENCES public.accountability_plan_targets(id) ON DELETE SET NULL,
  exception_type text NOT NULL,
  reason text NOT NULL,
  approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  starts_at date,
  ends_at date,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.accountability_exceptions TO authenticated;
GRANT ALL ON public.accountability_exceptions TO service_role;

CREATE INDEX IF NOT EXISTS aexc_family_idx ON public.accountability_exceptions(family_id);
CREATE INDEX IF NOT EXISTS aexc_user_idx ON public.accountability_exceptions(target_user_id);
CREATE INDEX IF NOT EXISTS aexc_target_idx ON public.accountability_exceptions(target_id);
CREATE INDEX IF NOT EXISTS aexc_window_idx ON public.accountability_exceptions(starts_at, ends_at);

ALTER TABLE public.accountability_exceptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS aexc_select ON public.accountability_exceptions;
CREATE POLICY aexc_select ON public.accountability_exceptions
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.family_members fm WHERE fm.family_id = accountability_exceptions.family_id AND fm.user_id = auth.uid())
    OR public.is_managing_org_member(family_id, auth.uid())
    OR public.is_super_admin(auth.uid())
  );

DROP POLICY IF EXISTS aexc_modify ON public.accountability_exceptions;
CREATE POLICY aexc_modify ON public.accountability_exceptions
  FOR ALL TO authenticated
  USING (
    public.is_family_admin_or_moderator(family_id, auth.uid())
    OR public.is_managing_org_member(family_id, auth.uid())
    OR public.is_super_admin(auth.uid())
  )
  WITH CHECK (
    public.is_family_admin_or_moderator(family_id, auth.uid())
    OR public.is_managing_org_member(family_id, auth.uid())
    OR public.is_super_admin(auth.uid())
  );
