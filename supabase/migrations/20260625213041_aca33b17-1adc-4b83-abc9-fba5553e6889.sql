
-- 1. activation_code_access_log: drop the broken WITH CHECK false policy; service_role bypasses RLS so no policy needed for legitimate logging.
DROP POLICY IF EXISTS "Service can insert access logs" ON public.activation_code_access_log;

-- 2. crm_integrations: remove org-admin SELECT policy that exposed encrypted OAuth tokens; only the owner can read tokens.
DROP POLICY IF EXISTS "Org admins can view org integrations" ON public.crm_integrations;

-- 3. provider_inquiries: add an explicit fail-closed INSERT policy so direct client/PostgREST inserts are clearly denied. The submit-provider-inquiry edge function uses service_role and bypasses RLS.
DROP POLICY IF EXISTS "Block direct provider inquiry inserts" ON public.provider_inquiries;
CREATE POLICY "Block direct provider inquiry inserts"
  ON public.provider_inquiries
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (false);

-- 4. spine_outbox: explicit fail-closed policy documenting that only service_role (edge functions) may access this internal outbox.
DROP POLICY IF EXISTS "Block all client access to spine outbox" ON public.spine_outbox;
CREATE POLICY "Block all client access to spine outbox"
  ON public.spine_outbox
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);
