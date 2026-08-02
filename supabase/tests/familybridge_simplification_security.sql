BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SET search_path = public, extensions;
SELECT plan(29);

SELECT ok(NOT has_table_privilege('authenticated', 'public.provider_handoffs', 'insert'), 'authenticated cannot insert handoffs directly');
SELECT ok(NOT has_table_privilege('authenticated', 'public.provider_handoffs', 'update'), 'authenticated cannot update handoffs directly');
SELECT ok(NOT has_table_privilege('authenticated', 'public.family_actions', 'delete'), 'family actions preserve immutable history');
SELECT ok(NOT has_table_privilege('authenticated', 'public.family_decisions', 'delete'), 'family decisions preserve immutable history');
SELECT ok(NOT has_table_privilege('authenticated', 'public.org_transfer_invites', 'insert'), 'authenticated cannot insert external organization invitations directly');
SELECT ok(NOT has_function_privilege('anon', 'public.create_org_transfer_invitation(uuid,uuid,text,text,text,text,text,public.transfer_reason,text,boolean)', 'execute'), 'anonymous cannot create external organization invitations');
SELECT ok(NOT has_function_privilege('anon', 'public.create_provider_handoff(uuid,uuid,uuid,uuid,uuid,text,timestamptz,public.transfer_reason,text,boolean)', 'execute'), 'anonymous cannot call handoff creation');
SELECT ok(NOT has_function_privilege('authenticated', 'public.record_patient_consent(uuid,uuid,text,text)', 'execute'), 'legacy patient-consent bypass is revoked');
SELECT ok(NOT has_function_privilege('public', 'public.get_provider_outcome_aggregates(uuid,date,date)', 'execute'), 'outcome reporting is not public');
SELECT ok((SELECT relrowsecurity FROM pg_class WHERE oid = 'public.family_actions'::regclass), 'family actions have RLS');
SELECT ok((SELECT relrowsecurity FROM pg_class WHERE oid = 'public.family_professional_invitations'::regclass), 'professional invitations have RLS');
SELECT is((SELECT column_default FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'provider_notes' AND column_name = 'include_in_ai_analysis'), 'false', 'provider note AI inclusion defaults off');

INSERT INTO auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES
  ('10000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'owner@test.local', '', now(), now(), now()),
  ('10000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'receiver@test.local', '', now(), now(), now()),
  ('10000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'subject@test.local', '', now(), now(), now()),
  ('10000000-0000-0000-0000-000000000004', 'authenticated', 'authenticated', 'outsider@test.local', '', now(), now(), now()),
  ('10000000-0000-0000-0000-000000000005', 'authenticated', 'authenticated', 'professional@test.local', '', now(), now(), now());

SELECT set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000001","email":"owner@test.local","role":"authenticated"}', true);
INSERT INTO public.organizations (id, subdomain, name, created_by)
VALUES ('20000000-0000-0000-0000-000000000001', 'security-from', 'Security From', '10000000-0000-0000-0000-000000000001');
SELECT set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000002","email":"receiver@test.local","role":"authenticated"}', true);
INSERT INTO public.organizations (id, subdomain, name, created_by)
VALUES ('20000000-0000-0000-0000-000000000002', 'security-to', 'Security To', '10000000-0000-0000-0000-000000000002');
INSERT INTO public.families (id, name, created_by, organization_id, account_number)
VALUES ('30000000-0000-0000-0000-000000000001', 'Security Family', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'SECURITY-TEST');
INSERT INTO public.family_members (family_id, user_id, role, is_primary_patient)
VALUES
  ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'moderator', false),
  ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'recovering', true);

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000004","email":"outsider@test.local","role":"authenticated"}', true);
SELECT throws_ok(
  $$SELECT public.create_provider_handoff('30000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000002')$$,
  'P0001', 'Referring organization admin required', 'unrelated user cannot create a handoff from known IDs'
);
SELECT throws_ok(
  $$INSERT INTO public.provider_handoffs (user_id,family_id,from_organization_id,to_organization_id,initiated_by) VALUES ('10000000-0000-0000-0000-000000000003','30000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000004')$$,
  '42501', 'permission denied for table provider_handoffs', 'direct handoff insert is denied'
);

SELECT set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000001","email":"owner@test.local","role":"authenticated"}', true);
CREATE TEMP TABLE test_state AS
SELECT public.create_provider_handoff(
  '30000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000003',
  '20000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000002',
  NULL,'Minimum necessary handoff',now() + interval '7 days','provider_change',NULL,false
) AS handoff_id;
SELECT pass('authorized referring owner creates handoff through RPC');

SELECT set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000002","email":"receiver@test.local","role":"authenticated"}', true);
SELECT is((SELECT count(*)::integer FROM public.provider_handoffs WHERE id = (SELECT handoff_id FROM test_state)), 0, 'receiving organization cannot inspect handoff before subject authorization');
SELECT throws_ok(
  format('SELECT public.respond_to_provider_handoff(%L, %L, NULL)', (SELECT handoff_id FROM test_state), 'accepted'),
  'P0001', 'Active recipient-specific subject authorization required', 'receiver cannot accept before authorization'
);

SELECT set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000004","email":"outsider@test.local","role":"authenticated"}', true);
SELECT throws_ok(
  format('SELECT public.sign_provider_handoff_authorization(%L, %L, %L, now() + interval ''30 days'', %L)', (SELECT handoff_id FROM test_state), 'Out Sider', 'Out Sider', 'handoff_metadata'),
  'P0001', 'Only the named transition subject may authorize this handoff', 'unrelated user cannot authorize known handoff ID'
);

SELECT set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000003","email":"subject@test.local","role":"authenticated"}', true);
SELECT lives_ok(
  format('SELECT public.sign_provider_handoff_authorization(%L, %L, %L, now() + interval ''30 days'', %L)', (SELECT handoff_id FROM test_state), 'Transition Subject', 'Transition Subject', 'handoff_metadata'),
  'named subject can authorize exact receiving organization'
);
SELECT is((SELECT organization_id FROM public.provider_handoff_authorizations WHERE handoff_id = (SELECT handoff_id FROM test_state) AND revoked_at IS NULL), '20000000-0000-0000-0000-000000000002'::uuid, 'authorization is bound to receiving organization');

SELECT set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000002","email":"receiver@test.local","role":"authenticated"}', true);
SELECT is((SELECT count(*)::integer FROM public.provider_handoffs WHERE id = (SELECT handoff_id FROM test_state)), 1, 'receiver can inspect authorized handoff');
SELECT lives_ok(format('SELECT public.respond_to_provider_handoff(%L, %L, NULL)', (SELECT handoff_id FROM test_state), 'accepted'), 'authorized receiver can accept handoff');
SELECT is((SELECT count(*)::integer FROM public.provider_handoff_events WHERE handoff_id = (SELECT handoff_id FROM test_state)), 2, 'handoff event history records initiation and acceptance');

SELECT set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000003","email":"subject@test.local","role":"authenticated"}', true);
SELECT throws_ok(
  format('SELECT public.sign_provider_handoff_authorization(%L, %L, %L, now() + interval ''30 days'', %L)', (SELECT handoff_id FROM test_state), 'Transition Subject', 'Transition Subject', 'handoff_metadata'),
  'P0001', 'Pending handoff required', 'accepted handoff cannot be replay-authorized'
);

SELECT set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000001","email":"owner@test.local","role":"authenticated"}', true);
SELECT throws_ok(
  $$SELECT public.create_family_professional_invitation('30000000-0000-0000-0000-000000000001','professional@test.local','read_only_support',ARRAY['transitions.manage'],now()+interval '7 days')$$,
  'P0001', 'Capabilities exceed role template', 'role template blocks capability escalation'
);
CREATE TEMP TABLE invite_state AS
SELECT * FROM public.create_family_professional_invitation(
  '30000000-0000-0000-0000-000000000001','professional@test.local','read_only_support',ARRAY['family.read','actions.read','decisions.read','coordination.read'],now()+interval '7 days'
);
SELECT pass('authorized manager creates named professional invitation');

SELECT set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000004","email":"outsider@test.local","role":"authenticated"}', true);
SELECT throws_ok(
  format('SELECT public.accept_family_professional_invitation(%L)', (SELECT invite_token FROM invite_state)),
  'P0001', 'Invitation not found, expired, unavailable, or issued to another email', 'wrong authenticated email cannot claim invitation'
);
SELECT set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000005","email":"professional@test.local","role":"authenticated"}', true);
SELECT lives_ok(format('SELECT public.accept_family_professional_invitation(%L)', (SELECT invite_token FROM invite_state)), 'named recipient accepts invitation');
SELECT throws_ok(
  format('SELECT public.accept_family_professional_invitation(%L)', (SELECT invite_token FROM invite_state)),
  'P0001', 'Invitation not found, expired, unavailable, or issued to another email', 'accepted invitation cannot be replayed'
);

SELECT * FROM finish();
ROLLBACK;
