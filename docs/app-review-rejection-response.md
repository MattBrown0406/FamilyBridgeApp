# App Review Rejection Response

Review date: May 24, 2026
Submission ID: [replace with current App Store Connect submission ID]
Version reviewed: 1.0 (15)
Review device: iPad Air 11-inch (M3) and iPhone 17 Pro Max
Review OS: iPadOS 26.5 and iOS 26.5

## What changed for resubmission

### Guideline 2.1 - Performance - App Completeness

Apple reported that an alert appeared after a successful In-App Purchase. We traced the iOS purchase handlers for family and provider subscriptions. The app was waiting for the RevenueCat entitlement to appear in the returned customer info immediately after StoreKit reported a successful purchase. In the App Review sandbox, the transaction can complete before the entitlement refresh is visible, which caused the app to show: "Purchase completed, but access has not updated yet. Please try Restore Purchases."

The iOS purchase flow now treats the successful StoreKit/RevenueCat transaction product identifier as a successful purchase signal for the post-purchase screen, while still accepting the entitlement when it is already present. After a successful family or provider subscription, the app shows success copy and routes reviewers to the correct setup path instead of showing an error alert.

Verification path:

1. Sign in with the App Review demo account.
2. Open Family subscription purchase or Provider subscription purchase.
3. Start the native App Store purchase.
4. Complete the sandbox purchase sheet.
5. Confirm FamilyBridge shows a success message and continues to Family Setup or Provider Setup without an error alert.
6. Restore Purchases remains available if the sandbox entitlement update is delayed or the reviewer reinstalls the app.

### Guideline 4.2 - Minimum Functionality

The iOS app now opens to a native app launch workspace instead of the public marketing homepage. The first screen gives reviewers direct access to:

- Family Workspace Demo
- Provider Workspace Demo
- Full Feature Demo Index
- Family subscription purchase/restore
- Provider subscription purchase/restore
- Account deletion path

The `/demo` area now opens on an App Review Demo Mode tab instead of a provider branding/customization placeholder. Reviewers can inspect complete, populated family and provider workspaces without creating content first. This makes the submitted iOS build behave as an app workspace on iPhone and iPad, not as a wrapped public website.

### Guideline 3.1.1 - In-App Purchase

The iOS purchase CTAs now route directly to the in-app family and provider subscription screens. Family and provider subscriptions are offered through RevenueCat/App Store In-App Purchase on iPhone and iPad. Web checkout and coupon checkout remain unavailable inside the native iOS app.

Before resubmission, confirm in App Store Connect and RevenueCat:

- `com.familybridgeapp.app.family_monthly` is attached to the submitted build.
- `com.familybridgeapp.app.provider_monthly_v2` is attached to the submitted build.
- `com.familybridgeapp.app.provider_quarterly_v2` is attached to the submitted build.
- RevenueCat offering `family` contains the family monthly product.
- RevenueCat offering `provider` contains the provider monthly and quarterly products.
- `VITE_REVENUECAT_APPLE_API_KEY` is present in the production iOS build environment.
- Sandbox purchase and restore work on a physical iPad or iPhone.

### Guideline 5.1.1(v) - Account Deletion

Account deletion is available in the app at:

Dashboard -> Settings -> Delete Account

The app calls the `delete-account` Supabase edge function. That function verifies the signed-in user, removes related app data and uploaded files where available, deletes profile data, and deletes the Supabase Auth user.

Before resubmission, record a physical-device screen recording showing:

1. Sign in with the App Review demo account.
2. Open Dashboard.
3. Tap Settings.
4. Tap Delete Account.
5. Confirm deletion.
6. Show the account is signed out or no longer accessible.

Upload that recording in App Store Connect Review Notes.

### Guideline 2.1(a) - Information Needed

Provide a working App Review demo account in App Store Connect. The account must be pre-populated with content so Apple can review:

- Secure Family Communication
- Accountability and Check-ins
- FIIS Recovery Intelligence
- Financial Requests
- Boundaries
- Documents
- Provider/moderator workspace if applicable

A demo video alone is not enough. Apple must be able to sign in and inspect the app.

## Reply To Apple

Hello,

Thank you for the review. We have updated the iOS In-App Purchase post-purchase handling for version 1.0 (15).

Apple reported that an alert appeared after a successful In-App Purchase. We traced this to the app checking for a RevenueCat entitlement immediately after StoreKit completed the sandbox transaction. In some sandbox review cases, StoreKit/RevenueCat returns a successful purchase transaction before the entitlement is visible in customer info, so the app showed an unnecessary error alert.

The app now treats the successful StoreKit/RevenueCat product identifier as a successful purchase signal for the immediate post-purchase experience, while still honoring the entitlement when it is already present. After a successful Family or Provider subscription purchase, FamilyBridge now shows success copy and continues to the appropriate setup screen instead of displaying an error alert. Restore Purchases remains available for delayed entitlement refreshes or reinstalls.

Reviewer verification steps:
1. Sign in with the App Review demo account.
2. Open Family subscription purchase or Provider subscription purchase.
3. Complete the native App Store sandbox purchase.
4. Confirm the app shows a success message and routes to Family Setup or Provider Setup without an error alert.

Thank you.
