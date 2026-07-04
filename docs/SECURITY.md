# FamilyBridge — Security Hardening Notes

_Last updated: July 2026 (Section 4 hardening pass)._

## What changed in this pass

### 1. CORS lockdown (all 74 edge functions)
Every function previously sent `Access-Control-Allow-Origin: *`. All now use
`_shared/cors.ts`, which echoes the request origin only if it is allowlisted:

- `https://familybridgeapp.com` / `https://www.familybridgeapp.com` (production)
- `*.lovable.app`, `*.lovableproject.com` (Lovable preview/published)
- `capacitor://localhost`, `https://localhost`, `http://localhost[:port]`,
  `127.0.0.1` (native apps + local dev)

Unknown origins receive the production origin header, so browsers refuse the
response. Non-browser callers (pg_cron, Square/Apple webhooks, curl) are
unaffected — CORS is a browser mechanism.

**If you add a custom domain, add it to `_shared/cors.ts`.**

### 2. Internal-function guard (16 functions)
These are never called by the app and are now service-role-only via
`_shared/internal-auth.ts` (`403 Forbidden` otherwise):

audit-square-billing, backfill-document-analysis, calculate-accountability-scores,
check-escalations, check-follow-up-reminders, check-medication-refills,
check-overdue-checkouts, drain-spine-outbox, expire-location-requests-sweep,
expire-temp-moderators, onboard-free-provider, refresh-fiis-learning,
retry-failed-payments, seed-deletion-test-account, seed-reviewer-family,
seed-reviewer-provider, weekly-family-report

pg_cron and cross-function invocations already send the service-role key, so
nothing breaks. To call one manually:

```
curl -X POST https://<ref>.supabase.co/functions/v1/<fn> \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
```

**Heads-up:** `seed-reviewer-*` (App Store reviewer accounts) and
`onboard-free-provider` now require the service key. If any external workflow
called these without it, that workflow needs the key added.

### 3. Secrets hygiene
`.env` is untracked and gitignored (`.env.example` added). The leaked values
were the Supabase anon/publishable keys — public by design (they ship in the
client bundle), so no emergency rotation is required. The rule going forward:
real secrets live ONLY in Supabase Edge Function secrets.

Optional cleanup: scrub `.env` from git history (`git filter-repo --path .env
--invert-paths` + force-push). Coordinate with Lovable sync before rewriting
history; it is cosmetic given the values are public anyway.

### 4. CI (`.github/workflows/ci.yml`)
- **Blocking:** web build (`vite build`) and edge-function unit tests
  (`deno test supabase/functions/_shared/`), which cover the RevenueCat
  entitlement/purchase logic used by billing.
- **Informative (continue-on-error):** `tsc --noEmit` and `eslint` — flip to
  blocking once the legacy findings are cleaned up.

## Known findings / follow-ups (not yet fixed)

1. **`verify_jwt = false` is set for ~40 functions** in `supabase/config.toml`.
   Many do their own auth internally (or are now service-role guarded), but a
   per-function review should confirm each client-facing one validates the
   caller (e.g. `getUser()` + membership checks). Priority candidates:
   `get-profiles`, `get-transition-summaries`, `analyze-*`, `fiis-*`.
2. **`app-store-notifications`** appears to do minimal verification of Apple's
   signed payloads (1 signature reference). Verify JWS signature validation
   against Apple's root certs.
3. **Migration squash:** 364 migration files. Squashing requires a dump of the
   live schema (`supabase db dump`) and coordination with Lovable, so it is a
   deliberate maintenance task: dump schema → new baseline migration → archive
   old files → verify `supabase db reset` locally reproduces production.
4. **TypeScript strictness:** `noImplicitAny` is off. New code should be
   written strict; enable per-flag once CI's typecheck job is green.
5. **RLS audit:** spot-check newer tables (post-2026 migrations) for missing
   or overly permissive policies, especially anything readable by `anon`.
