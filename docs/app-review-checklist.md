# FamilyBridge App Review checklist

Last reviewed: 2026-04-11

Legend: PASS = looks review-ready in repo, FAIL = likely rejection risk, OPEN = needs submission-time proof or follow-up.

## 1) Payments and purchase flows
- PASS: iPhone purchase flows use native App Store subscriptions via RevenueCat for family and provider plans, with restore buttons and account-first gating (`src/pages/FamilyPurchase.tsx`, `src/pages/ProviderPurchase.tsx`, `src/hooks/useRevenueCat.tsx`).
- PASS: Web checkout appears suppressed on iPhone, reducing obvious external-purchase steering risk.
- OPEN: Android billing is intentionally out of scope for the current iOS submission. Do not submit the Android build until Google Play Billing or a compliant Android purchase strategy is ready.
- OPEN: `docs/revenuecat-setup.md` still says the migration is in progress and lists backend/setup work as still needed. Make sure the shipped build reflects a fully working entitlement path.

## 2) Account creation, sign-in, restore, and deletion
- PASS: Sign-in or account creation is required before iPhone subscription purchase.
- PASS: Restore Purchases is present for family and provider subscriptions.
- PASS: In-app deletion now invokes the authenticated `delete-account` edge function from `src/pages/Dashboard.tsx`; the function cleans related app rows/files where available and deletes the Supabase Auth user.
- OPEN: Confirm the deployed Supabase function has `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`, then test deletion with a disposable reviewer-style account.

## 3) Privacy disclosures and data handling
- PASS: Privacy Policy and Terms pages exist in-app and are linked from the footer (`/privacy`, `/terms`).
- PASS: iOS permission strings exist for camera, Face ID, location, microphone, photos, and speech recognition (`ios/App/App/Info.plist`).
- PASS: Repo shows multiple privacy-minded controls, including RLS hardening, masked views, encrypted payment fields, and old-location anonymization in Supabase migrations.
- PASS: `ios/App/App/PrivacyInfo.xcprivacy` now declares app-level collected data categories and app-only UserDefaults access reason `CA92.1`.
- OPEN: App Store Connect privacy nutrition answers are not represented in repo. They must match actual behavior, optional AI processing, and all third-party SDK data use.

## 4) Permissions and sensitive features
- PASS: Permission copy is user-initiated and generally specific to the feature being used.
- OPEN: Location, microphone, camera, speech recognition, uploaded documents, and medication-label analysis all increase review sensitivity. Reviewer notes should explain why each permission is optional and user-triggered.
- OPEN: If push notifications are enabled in the shipped iOS target, confirm prompt timing, entitlement setup, and reviewer test steps.

## 5) Content, safety, and misleading-claims risk
- PASS: Terms and public crisis help disclaim that the app is not a medical, mental health, or crisis service.
- PASS: The highest-risk location/check-in copy in `src/pages/FamilyChat.tsx` has been softened to lawful, calm, documented, recovery-aligned support language.
- OPEN: Marketing and in-app claims around addiction recovery, AI insights, risk scoring, and "verified" meeting/location behavior should be reviewed carefully to avoid implying clinical efficacy, guaranteed accuracy, or safety outcomes.

## 6) Metadata and submission prep
- OPEN: Repo does not show App Store metadata, privacy nutrition answers, age rating, screenshots, or final reviewer demo credentials.
- OPEN: Bundle/app identity still contains Lovable scaffolding in repo (`appId: app.lovable...` in `capacitor.config.ts`, generic Lovable README). Confirm final iOS target metadata is production-clean.
- PASS: Reviewer-notes draft exists at `docs/app-review-notes.md` and covers sign-in, subscription purchase, restore, family setup, privacy policy, permissions, and account deletion.

## Highest-priority actions before submission
1. Deploy and test the new `delete-account` Supabase function with a disposable account.
2. Audit App Store Connect privacy nutrition answers against `ios/App/App/PrivacyInfo.xcprivacy` and the shipped privacy policy.
3. Add real reviewer demo credentials to `docs/app-review-notes.md` before submission.
4. Confirm final iOS bundle ID, display metadata, screenshots, age rating, and App Review notes are production-clean.
