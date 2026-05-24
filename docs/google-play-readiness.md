# FamilyBridge Google Play readiness

Last reviewed: 2026-05-23

## Android app identity
- Package name: `app.lovable.feec162303784a959c1635217b29129c`
- App name: `FamilyBridge`
- Version: `1.0`
- Version code: `1`
- Target SDK: `36`
- Min SDK: `24`

Do not change the package name after the first Google Play upload unless you intend to publish a separate app listing.

## Billing setup required before production review
FamilyBridge sells digital subscriptions and the 24-hour guidance window, so Android builds must use Google Play Billing.

The native Android purchase flow now routes through RevenueCat when `VITE_REVENUECAT_GOOGLE_API_KEY` is present. Without that key, Android purchase pages show a setup warning instead of exposing a web checkout or email-only purchase path.

Before submitting to Google Play:
1. Create or confirm the Android app in RevenueCat using the package name above.
2. Copy the Android public SDK key from RevenueCat and set it as `VITE_REVENUECAT_GOOGLE_API_KEY` in the production build environment.
3. Create the matching Google Play products/subscriptions and connect them in RevenueCat:
   - `com.familybridgeapp.app.family_monthly` with base plan `monthly`
   - `com.familybridgeapp.app.provider_monthly_v2` with base plan `monthly`
   - `com.familybridgeapp.app.provider_quarterly_v2` with base plan `quarterly`
   - `com.familybridgeapp.app.crisis_moderation_daily`
   - In RevenueCat, Google subscription products may appear as `product_id:base_plan_id`, such as `com.familybridgeapp.app.family_monthly:monthly`.
4. Confirm the RevenueCat offerings include:
   - `family`
   - `provider`
   - `crisis_moderation`
5. Upload a test build to a Play testing track and test purchases from the Play-installed app, not a sideloaded build.

## Build commands
Use these after the Google RevenueCat key is available:

```bash
npm run build
npx cap sync android
cd android
./gradlew :app:bundleRelease
```

Expected Play upload artifact:

```text
android/app/build/outputs/bundle/release/app-release.aab
```

Release signing is wired through `android/keystore.properties` when that local file exists. The local upload key files are intentionally ignored by git:

```text
android/keystore.properties
android/keystores/familybridge-upload-key.jks
```

Keep this upload key available for future Google Play updates. If you replace it after the first Play upload, the new key must be registered with Play Console before it can sign future releases.

## Review notes
- Family and provider subscriptions are front-facing before sign-in.
- After a native purchase, users are routed to an account setup path so the subscription can be attached to a FamilyBridge account.
- The 24-hour Professional Guidance Window remains signed-in because it must attach to an existing family workspace.
- Web/Square checkout is not shown on native Android purchase paths.
