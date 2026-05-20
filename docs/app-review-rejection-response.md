# App Review Rejection Response

Review date: April 28, 2026
Submission ID: 23d45628-a4ad-4d79-8aac-fdbda92268a5
Version reviewed: 1.0 (11)
Review device: iPad Air 11-inch (M3)

## What changed for resubmission

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

Thank you for the review. We have updated the iOS app to address the issues noted in Submission ID 23d45628-a4ad-4d79-8aac-fdbda92268a5.

For Guideline 4.2, the iOS app now opens to an app-focused workspace with direct access to pre-populated family and provider demo workspaces, subscription purchase/restore paths, and account settings. The in-app `/demo` area now opens on App Review Demo Mode with populated review paths instead of placeholder/customization content. This replaces the prior marketing-style first screen in the native app.

For Guideline 3.1.1, the family and provider subscriptions are now available for purchase inside the iOS app using Apple In-App Purchase through RevenueCat. Web checkout and coupon checkout are not available inside the native iOS app.

For Guideline 5.1.1(v), account deletion is available in the app from Dashboard -> Settings -> Delete Account. We have included a physical-device screen recording in the App Review Information notes showing the full deletion flow.

For Guideline 2.1(a), we have provided a working demo account in App Review Information. The account includes pre-populated family and provider content so Review can inspect secure family communication, accountability/check-ins, FIIS recovery intelligence, financial requests, boundaries, documents, and related workflows.

Thank you.
