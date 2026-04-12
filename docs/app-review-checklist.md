# FamilyBridge App Review checklist

Last reviewed: 2026-04-11

Legend: PASS = looks review-ready in repo, FAIL = likely rejection risk, OPEN = needs submission-time proof or follow-up.

## 1) Payments and purchase flows
- PASS: iPhone purchase flows use native App Store subscriptions via RevenueCat for family and provider plans, with restore buttons and account-first gating (`src/pages/FamilyPurchase.tsx`, `src/pages/ProviderPurchase.tsx`, `src/hooks/useRevenueCat.tsx`).
- PASS: Web checkout appears suppressed on iPhone, reducing obvious external-purchase steering risk.
- OPEN: Android still appears to hand users into a web/email-assisted purchase flow, which is fine for iOS review but should stay clearly out of the iOS binary review path.
- OPEN: `docs/revenuecat-setup.md` still says the migration is in progress and lists backend/setup work as still needed. Make sure the shipped build reflects a fully working entitlement path.

## 2) Account creation, sign-in, restore, and deletion
- PASS: Sign-in or account creation is required before iPhone subscription purchase.
- PASS: Restore Purchases is present for family and provider subscriptions.
- FAIL: In-app deletion is incomplete for App Store expectations. The dashboard deletes app tables, but explicitly leaves the auth account behind: `// Sign out the user (the auth.users record will remain but user data is deleted)` in `src/pages/Dashboard.tsx`.
- OPEN: Confirm deletion also handles uploaded files, family chat artifacts, invites, and any retained server-side records tied to the account.

## 3) Privacy disclosures and data handling
- PASS: Privacy Policy and Terms pages exist in-app and are linked from the footer (`/privacy`, `/terms`).
- PASS: iOS permission strings exist for camera, Face ID, location, microphone, photos, and speech recognition (`ios/App/App/Info.plist`).
- PASS: Repo shows multiple privacy-minded controls, including RLS hardening, masked views, encrypted payment fields, and old-location anonymization in Supabase migrations.
- FAIL: `ios/App/App/PrivacyInfo.xcprivacy` is still a scaffold with empty `NSPrivacyCollectedDataTypes` and empty `NSPrivacyAccessedAPITypes`, even though the app clearly collects account, chat, file/image, location, payment-related, and device data. This is a serious submission-readiness gap.
- OPEN: App Store Connect privacy nutrition answers are not represented in repo. They must match actual behavior, optional AI processing, and all third-party SDK data use.

## 4) Permissions and sensitive features
- PASS: Permission copy is user-initiated and generally specific to the feature being used.
- OPEN: Location, microphone, camera, speech recognition, uploaded documents, and medication-label analysis all increase review sensitivity. Reviewer notes should explain why each permission is optional and user-triggered.
- OPEN: If push notifications are enabled in the shipped iOS target, confirm prompt timing, entitlement setup, and reviewer test steps.

## 5) Content, safety, and misleading-claims risk
- PASS: Terms and public crisis help disclaim that the app is not a medical, mental health, or crisis service.
- FAIL: Some copy can read as coercive or harmful in a safety-sensitive app. Example from `src/pages/FamilyChat.tsx`: failure to answer location requests "may result in the loss of cell phone service, vehicle privileges, financial support or other natural consequences." This is likely review-sensitive and could trigger questions about abuse, intimidation, or harmful real-world consequences.
- OPEN: Marketing and in-app claims around addiction recovery, AI insights, risk scoring, and "verified" meeting/location behavior should be reviewed carefully to avoid implying clinical efficacy, guaranteed accuracy, or safety outcomes.

## 6) Metadata and submission prep
- OPEN: Repo does not show App Store metadata, privacy nutrition answers, age rating, screenshots, reviewer demo account, or review notes.
- OPEN: Bundle/app identity still contains Lovable scaffolding in repo (`appId: app.lovable...` in `capacitor.config.ts`, generic Lovable README). Confirm final iOS target metadata is production-clean.
- OPEN: Provide a reviewer path covering sign-in, subscription purchase, restore, family setup, privacy policy, and account deletion.

## Highest-priority actions before submission
1. Fix account deletion so the actual account is deleted, not just local/app tables.
2. Replace the placeholder privacy manifest scaffold with a real, audited `PrivacyInfo.xcprivacy`.
3. Review and soften coercive location/consequence language that may look unsafe or abusive in App Review.
4. Prepare reviewer notes, demo credentials, and App Store privacy answers that exactly match the shipped build.
