# FamilyBridge v2 Roadmap

_Planning doc — issues to ship in the 2-4 weeks after the May 2026 provider conference._

This list captures everything Matt + Hermes identified as "real but not pre-conference work." Items marked ⚡ ship as web-only and don't require an App Store / Play Store review. Items marked 📱 require a native binary release.

---

## Tier 1 — Ship within 1 week of conference

### ✅ ⚡ 1.1 Inbound provider-inquiry capture
**Status:** Shipped in pre-conference v2 batch.

- `provider_inquiries` table with RLS gated by `is_super_admin()`
- `submit-provider-inquiry` edge function with Resend email notification + basic spam heuristics
- `ProviderInquiryForm` component embedded above the CTA card on `/for-providers`
- Captures UTM params from URL for source tracking

**To do:**
- Optional: add HubSpot Contacts sync to push qualified inquiries into the
  Provider Lead lifecycle stage. Currently they're emailed + stored in
  Supabase only.
- Build a `/super-admin/provider-inquiries` admin view to triage incoming
  leads (read directly from Supabase for now via SQL editor).

### ⚡ 1.2 Google Calendar Appointment Schedule wiring
**Problem:** `calendarUrl` in `ForProviders.tsx` is currently a `mailto:` fallback.

**Build:**
- Once Matt creates the Appointment Schedule in `calendar.google.com`, paste the URL into `ForProviders.tsx` (line marked `// TODO`).
- Test that Book-a-call button actually books a calendar slot.

**Files:** `src/pages/ForProviders.tsx` (single-line config swap).

### ⚡ 1.3 Meeting Finder — quality + monthly health check
**Problem:** 73 of 119 AA region feeds were dead — purged in commit `e6ea155`. New feeds rot constantly as central offices update WordPress / move hosts.

**Build:**
- Add a Hermes cron job (already runnable from this Hermes instance — does not live in the app) that hits every feed in `REGION_GROUPS` weekly and emails Matt a digest of any newly broken ones.
- Add a "Last verified live" timestamp shown in the UI under each region selection.
- Consider expanding back into more cities by switching from per-city TSML feeds to the Code4Recovery central-query API which aggregates many regions into one stable JSON endpoint.

**Files:** new Hermes cron script + `src/components/MeetingFinder.tsx`.

---

## Tier 2 — Native app work, requires Apple/Google review

### 📱 2.1 Native push notifications (iOS + Android)
**Problem:** `useWebPushNotifications.tsx` and the VAPID stack work in desktop browsers, but the native apps have **no push notification support at all**. The Android Gradle build literally logs "google-services.json not found, google-services plugin not applied. Push Notifications won't work." iOS has no APNS capability configured.

**This is the biggest gap.** Providers expect real-time alerts on their phones, not just when their browser is open.

**Build:**
1. `npm install @capacitor/push-notifications`
2. **Android (FCM):**
   - Create Firebase project for FamilyBridge
   - Add Android app to project → download `google-services.json` → drop in `android/app/`
   - Add `apply plugin: 'com.google.gms.google-services'` to `android/app/build.gradle`
   - Add Firebase classpath to root `build.gradle`
3. **iOS (APNS):**
   - In Apple Developer Portal, create APNS Auth Key (.p8 file) — save in `/root/.hermes/secrets/familybridge_apns/`
   - In Xcode, enable Push Notifications capability + Background Modes → Remote notifications
   - In Firebase console, upload the APNS key (Firebase also handles iOS via FCM, easier than rolling own APNS server)
4. **App code (`src/main.tsx` or new `useNativePush.ts`):**
   - On app launch, register for push: `await PushNotifications.requestPermissions()` → `register()`
   - Listen for `'registration'` event → persist FCM token to `push_subscriptions` table (add a new `fcm_token` column or use `endpoint` field with `fcm:` prefix)
5. **Server-side (`supabase/functions/send-push-notification/`):**
   - Branch on subscription shape: if it's a web-push subscription, use `webpush.sendNotification` (current code). If it's an FCM token, POST to the FCM HTTP v1 API.
   - Store Firebase service account JSON in Supabase secret `FCM_SERVICE_ACCOUNT_JSON`.

**Estimated effort:** 1-2 days of focused work. **Requires app review** on both stores before users get it.

**Files:** `android/app/build.gradle`, `android/build.gradle`, `ios/App/App/Info.plist`, `ios/App/App/Capabilities`, `src/hooks/useNativePush.ts` (new), `src/main.tsx`, `supabase/functions/send-push-notification/index.ts`.

### 📱 2.2 In-app deep linking for invite emails
**Problem:** When the email/SMS invite contains `familybridgeapp.com/join?code=XXX`, tapping it on a phone that has the app installed opens the link in Safari, not the app.

**Status (web half shipped):** `public/.well-known/apple-app-site-association`
and `public/.well-known/assetlinks.json` are now hosted at the domain
root, with `_headers` enforcing `Content-Type: application/json`. The
files have TEAMIDPLACEHOLDER and PLACEHOLDER_SHA256_FINGERPRINT tokens
that need to be replaced before they're functional — see file comments.

**Still to do (native half):**
- Replace TEAMIDPLACEHOLDER in apple-app-site-association with your
  Apple Developer Team ID
- Replace PLACEHOLDER_SHA256_FINGERPRINT in assetlinks.json with the
  output of `keytool -list -v -keystore familybridge-upload.keystore`
  (plus the Play App Signing fingerprint from Play Console)
- iOS: add `app.lovable...` Associated Domain entitlement, enable
  Associated Domains capability in Xcode
- Android: add intent filter with `autoVerify="true"` to
  AndroidManifest.xml
- In Capacitor app: listen for `appUrlOpen` event and route via
  React Router

**Files:** native config + the now-live `public/.well-known/` static files.

### 📱 2.3 Native biometric unlock
**Problem:** `capacitor-native-biometric` is already in `package.json` but isn't wired into the auth flow.

**Build:** On successful login, prompt "Use Face ID to sign in faster next time?" → store an opaque auth token in secure keychain → on next launch, biometric prompt → token → Supabase session restore.

**Files:** `src/hooks/useAuth.tsx`, new `src/hooks/useBiometricSignIn.ts`.

---

## Tier 3 — Stretch / "nice to have"

### ✅ ⚡ 3.1 `useWebPushNotifications.tsx` mobile-exclusion bug
**Status:** Fixed in pre-conference v2 batch. The UA-sniff was removed —
all browsers that have `'Notification' in window` are now supported,
including mobile Safari 16.4+ and the Capacitor webview.

### ⚡ 3.2 Demo page inner experience polish
The `/demo` launcher tabs now show rich preview cards (shipped commit `774da07`), but the inner `DemoFamily.tsx` (2,847 lines) and `DemoProvider.tsx` (1,006 lines) could use a once-over for:
- Loading states / empty states feeling more "lived in"
- Chat thread examples with realistic recovery-context conversations
- A "skip the tour, give me a quick walkthrough" highlight reel for time-pressed providers

### ⚡ 3.3 `/for-providers` page additions
- Embed a 60-second Loom video of Matt walking through the FIIS™ panel
- Add a "Featured providers" logo strip (with permission) — instant credibility
- Add a 2-3 testimonial pull-quotes section between the value cards and the outcomes panel

### ⚡ 3.4 Stripe / RevenueCat parity for providers
Provider purchases currently route through RevenueCat (native) or Square (web). Add Stripe Connect for direct provider billing so larger orgs can pay via invoice/ACH instead of credit-card-via-app-store.

### 📱 3.5 Offline mode for family check-ins
The most-used family screens (check-in, daily emotional pulse) should work offline and sync on reconnect. Capacitor has `@capacitor/network` and IndexedDB persistence is straightforward via `@tanstack/react-query` persister.

### 📱 3.6 Apple Watch / wearable companion
Quick-reply to family messages from watch, daily mood check-in tap, sponsor-call streak. Months of work, but a strong differentiator.

---

## Out of scope / explicitly NOT doing

- Building our own native push server (FCM/APNS direct) — just use Firebase. Faster, free, less ops.
- Adding Android-only or iOS-only features that fragment the product
- Anything that requires a new App Store category submission

---

_Last updated: 2026-05-27 (pre-conference planning)_
_Maintainer: Matt Brown · agent: Hermes (C-3PO)_
