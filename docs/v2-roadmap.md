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

### ⚡ 1.4 Location-drift monitor — rewire so it actually catches drift

**Problem:** The `useLocationDriftMonitor` hook is well-written but wired into
the wrong place. Audit on 2026-05-27 found:

🔴 **Critical bugs**

1. **Monitoring never starts at check-in time.** The hook only attaches inside
   `MeetingCheckout.tsx`, which one-shot-queries for a pending check-in when it
   mounts. After a fresh check-in, the user must leave + re-enter the FamilyChat
   page for `MeetingCheckout` to refetch and start watching. If they don't, the
   100-yard threshold check never executes for that session.
2. **Monitoring stops the moment the user navigates away from FamilyChat.** The
   hook is tied to a React component lifecycle. Switching pages inside the app,
   backgrounding the app, or locking the phone halts `watchPosition`. On iOS we
   only have `NSLocationWhenInUseUsageDescription` — confirmed in
   `ios/App/App/Info.plist` — so as soon as the app backgrounds, geolocation
   stops firing entirely.

🟡 **Significant bugs**

3. **One-size-fits-all 1-hour checkout window.** DB trigger `set_checkout_due_at`
   (migration `20251230170331`) blindly sets `checkout_due_at = checked_in_at
   (rounded to hour) + 1h` for every check-in type — AA, medical, therapy, work,
   gym, court. A medical appointment with travel + wait is rarely under an hour;
   a court appearance can be all day. The overdue-checkout alert fires 1h15m
   later (`20251231062957`), producing lots of false positives.
4. **No persistence of drift events.** When drift is detected, the warning
   posts a chat message and a `notifications` row, but nothing is written to
   `meeting_checkins` itself. Can't query "did anyone drift on their last 10
   meetings?" FIIS score can't use it.
5. **One-shot warning per session.** `warningPostedRef.current = true` after
   the first alert. Someone who drifts → returns → drifts to a third location
   only triggers the FIRST warning. If they go meeting → bar → liquor store,
   family sees one alert about leaving the meeting and nothing about the
   actual concerning destination.

🟢 **Minor / quality issues**

6. **100-yard threshold may be too aggressive.** GPS jitter — especially
   indoors at a church basement or medical office — can fluctuate 30-100
   yards on consumer phones. Recommend 150-200 yards OR requiring 2
   consecutive over-threshold readings before firing.
7. **Reverse-geocoder hits Nominatim with no API key.** OpenStreetMap's
   public service is rate-limited at 1 req/sec. If two family members drift
   simultaneously, one silently fails to get an address. Should swap to the
   existing Google Places setup we already pay for.
8. **No duration UX in `LifeAppointmentCheckin`.** The DB trigger does set
   `checkout_due_at` for medical/therapy check-ins, but the user can't tell
   the app the actual duration of their appointment, so 50-minute therapy
   sessions and 3-hour medical visits both end up with the same 1h window.

**Build (web-only, no review needed for items 1-7):**

1. Move `useLocationDriftMonitor` UP a level. Best home: a new
   `<ActiveCheckinWatcher>` component mounted near the top of
   `FamilyChat.tsx` (or even `App.tsx` inside the auth-required wrapper), so
   it persists across all in-app navigation while the user has an open
   check-in. Drive it from a realtime `meeting_checkins` subscription —
   start watching the moment a row appears with no `checked_out_at`, stop
   the moment one is set.
2. Replace the one-shot fetch with a realtime channel so drift starts at the
   *instant* of check-in submission, not on next page refresh.
3. Add a `default_duration_minutes` parameter to `meeting_checkins` (or
   compute it client-side per `meeting_type` and pass to the insert). For
   AA/NA/Al-Anon default 60min, therapy 50min, court "open ended"
   (suppress overdue alert), medical default 90min, gym 60min. Let the user
   override via a dropdown on the check-in form.
4. Update the DB trigger to respect a provided `checkout_due_at` instead of
   always overwriting it. Or replace the trigger with explicit client-side
   computation.
5. Write drift events to a new `checkin_drift_events` table
   `(id, checkin_id, family_id, user_id, captured_at, distance_yards,
   latitude, longitude, address, severity)`. Index on `family_id,
   captured_at`. Feed into FIIS score weights.
6. Repost the warning when the user drifts to a *new* location (>50yds from
   the previous drift point). Track last-warned-position in a ref.
7. Bump threshold default to 200yds and require 2 consecutive
   over-threshold readings (debounce).
8. Swap Nominatim → Google Places reverse geocode (reuse the credentials
   already wired into `check-liquor-license`).
9. Add a banner on the FamilyChat page: "Drift monitoring is active while
   the app is open. Open the app to keep monitoring after a check-in."

**Build (native, defer to 2.1 Firebase release):**

10. Add `@capacitor/background-geolocation` with iOS
    `NSLocationAlwaysAndWhenInUseUsageDescription` and Android
    `ACCESS_BACKGROUND_LOCATION` permission, so drift monitoring continues
    when the app backgrounds. This triggers a heavier Apple Review process
    + a privacy nutrition label update.

**Estimated effort:** ~half a day for web items 1-9. Native item 10 batches
into the v2.1 Firebase release.

**Files:** `src/hooks/useLocationDriftMonitor.tsx`, new
`src/components/ActiveCheckinWatcher.tsx`, `src/pages/FamilyChat.tsx`,
`src/components/MeetingCheckin.tsx`,
`src/components/LifeAppointmentCheckin.tsx`,
`supabase/migrations/<new>_checkin_drift_events.sql`,
`supabase/migrations/<new>_dynamic_checkout_due.sql`.

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

_Last updated: 2026-05-27 (post-conference audit — added 1.4 location-drift findings)_
_Maintainer: Matt Brown · agent: Hermes (C-3PO)_
