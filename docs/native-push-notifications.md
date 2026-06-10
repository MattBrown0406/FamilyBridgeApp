# Native Push Notifications

FamilyBridge supports two push channels in parallel:

- **Web push** — browsers via Service Worker + VAPID (`push_subscriptions` table)
- **Native push** — installed iOS / Android (Capacitor) apps via Firebase Cloud Messaging HTTP v1 (`native_push_tokens` table)

The `NotificationBell` UI auto-detects `Capacitor.isNativePlatform()` and uses the appropriate channel.

## What was implemented

- New table `public.native_push_tokens` (RLS: users manage their own tokens; service_role read/write for edge function).
- `@capacitor/push-notifications` plugin installed.
- `src/hooks/useNativePushNotifications.tsx` — requests permission, registers, stores token, handles tap routing.
- `NotificationBell` toggles between native and web push.
- `supabase/functions/send-push-notification` upgraded:
  - sends web push (unchanged) **and** native push via FCM HTTP v1
  - data payload includes `family_id`, `related_id`, `type`, `url`, `timestamp`
  - returns `{ web: { sent, total, failed, stale }, native: { sent, total, failed, stale, skipped_no_config, configured } }`
- iOS `AppDelegate.swift` forwards `didRegister*` callbacks to Capacitor.
- Android manifest adds `POST_NOTIFICATIONS`, `WAKE_LOCK`, and `c2dm.RECEIVE` permissions.

## Required Supabase Edge Function secrets

Set in **Project Settings → Functions → Secrets**:

| Secret | Purpose | Required for |
| --- | --- | --- |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` | Web push (existing) | Web |
| `FIREBASE_PROJECT_ID` | Firebase project that owns the apps | Native (iOS + Android) |
| `FIREBASE_CLIENT_EMAIL` | Service account email | Native |
| `FIREBASE_PRIVATE_KEY` | Service account private key (paste the full PEM; `\n` newlines are auto-normalized) | Native |

If `FIREBASE_*` are missing the edge function logs `"Firebase (FCM HTTP v1) not configured"` and **still sends web push** — it never hard-fails.

## Required Firebase setup

1. Create a Firebase project (or reuse one) at https://console.firebase.google.com.
2. **Add Android app** with package `app.lovable.feec162303784a959c1635217b29129c`. Download `google-services.json` and place it at `android/app/google-services.json` (do **not** commit).
3. **Add iOS app** with bundle id matching the Xcode target. Download `GoogleService-Info.plist` and add it to the Xcode project (drag into `App/App/`, check "Copy items if needed", target = App).
4. **APNs key**: in **Project Settings → Cloud Messaging → Apple app configuration**, upload an APNs Authentication Key (`.p8`) created in the Apple Developer portal under Certificates, Identifiers & Profiles → Keys → APNs.
5. **Service account for FCM HTTP v1**:
   - **Project Settings → Service accounts → Generate new private key** (downloads JSON).
   - From that JSON, set `FIREBASE_PROJECT_ID` (`project_id`), `FIREBASE_CLIENT_EMAIL` (`client_email`), and `FIREBASE_PRIVATE_KEY` (`private_key`, including the BEGIN/END markers).

### Why FCM for iOS

FCM HTTP v1 routes iOS messages through APNs but requires the device token to be an **FCM registration token**, not a raw APNs token. The app uses `@capacitor-firebase/messaging` to obtain that token after `@capacitor/push-notifications` completes OS-level registration. The FCM token (not the raw APNs token) is what gets stored in `native_push_tokens` and used by the edge function.

## Required Apple Developer / APNs setup

- Apple Developer account with the App ID for the FamilyBridge bundle id.
- **Push Notifications** capability enabled on the App ID.
- APNs Authentication Key (`.p8`) created and uploaded to Firebase (see above).
- Provisioning profile regenerated after enabling Push Notifications.

## Required Xcode capabilities (manual — Lovable cannot toggle these)

Open `ios/App/App.xcworkspace` in Xcode, select the **App** target → **Signing & Capabilities**, then:

1. Click **+ Capability** and add **Push Notifications**.
2. Click **+ Capability** and add **Background Modes**, then check:
   - ☑ Remote notifications
   - ☑ Background fetch (optional, recommended)
3. Confirm the **App** target → **General** → Bundle Identifier matches the one used in Apple Developer and Firebase.
4. Drag `GoogleService-Info.plist` into the App group, target = App.

## Android setup

- Place `google-services.json` at `android/app/google-services.json` (gitignored).
- `android/app/build.gradle` already auto-applies the Google Services plugin when the file is present.
- `POST_NOTIFICATIONS` runtime permission is requested by the plugin on Android 13+ (API 33).

## Testing steps

1. Build a fresh iOS/Android binary after `npx cap sync`.
2. Sign in to FamilyBridge on the device.
3. Open the bell → tap **Enable** → accept the OS permission prompt.
4. Verify a row in `public.native_push_tokens` with `platform = 'ios' | 'android'`, `enabled = true`.
5. Trigger a notification (e.g. post in family chat from a different account, or invoke the edge function directly):

   ```bash
   curl -X POST "$SUPABASE_URL/functions/v1/send-push-notification" \
     -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "user_ids": ["<uuid>"],
       "title": "Test",
       "body": "Hello from FCM",
       "type": "message",
       "data": { "family_id": "<family-uuid>" }
     }'
   ```

   Response includes `web` and `native` counts.
6. The notification should appear on the lock screen / banner; tapping it should open the app and navigate to `/family/<id>` (or `/moderator?tab=transfers` for handoffs).

## Does this require a new App Store Connect build?

**Yes.** `capacitor.config.ts` uses bundled `webDir: 'dist'` and the iOS native side gained:

- a new Capacitor plugin (`@capacitor/push-notifications`)
- new `AppDelegate` callbacks
- the Push Notifications + Background Modes capabilities (added manually in Xcode)

Submit a new build via Xcode → Archive → Distribute to App Store Connect.