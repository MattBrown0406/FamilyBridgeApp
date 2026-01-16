-- Ensure RLS is enabled and forced on organizations table
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations FORCE ROW LEVEL SECURITY;

-- The existing policies already restrict access to org members only
-- Just verify they are in place (these will no-op if they exist)
DO $$
BEGIN
  -- Check if the select policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'organizations' 
    AND policyname = 'Org members can view their organization'
  ) THEN
    CREATE POLICY "Org members can view their organization"
    ON public.organizations
    FOR SELECT
    USING (is_org_member(id, auth.uid()));
  END IF;
END $$;