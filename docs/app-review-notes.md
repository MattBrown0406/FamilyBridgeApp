# FamilyBridge App Review Notes

Use this as the reviewer-notes source when submitting the iOS build. Replace bracketed values before submitting.

## Reviewer Access

- Demo account email: [REPLACE_WITH_REVIEWER_EMAIL]
- Demo account password: [REPLACE_WITH_REVIEWER_PASSWORD]
- Demo family path: sign in, open Your Family Groups, select the reviewer family, then use Family Chat, Financial Requests, Documents, Boundaries, and Check-ins.
- Demo provider path: sign in with a provider/moderator account and open the Moderator Dashboard.

## Purchase And Restore

- Family and provider subscriptions use native App Store purchase flow through RevenueCat on iPhone.
- The Family Purchase and Provider Purchase screens both include Restore Purchases.
- The web checkout path is suppressed in the iOS native purchase flow.
- Subscription management and cancellation are handled through the user's Apple ID subscription settings.

## Account Deletion

- Users can delete their account from Dashboard, Settings, Delete Account.
- Deletion is initiated in app and handled by the `delete-account` Supabase function.
- The function verifies the active user session, removes related app data and uploaded files where available, deletes the user's profile data, and deletes the Supabase Auth user.

## Optional Permissions

- Camera: only requested when the user chooses to capture a receipt, medication label, or support document.
- Photo Library: only requested when the user chooses an existing receipt, medication label, or support document to upload.
- Location: only requested for user-initiated check-ins or location-aware support features.
- Microphone: only requested for live coaching or voice features the user starts.
- Speech Recognition: only used to convert speech to text during user-started live coaching sessions.
- Face ID: used only for secure account access on the user's device.

## Sensitive Feature Context

- FamilyBridge is not a medical, mental health, emergency, or crisis service.
- The app provides family coordination, documentation, communication, and support-plan organization.
- AI-assisted outputs are guidance and organization aids, not clinical diagnosis, emergency assessment, or guaranteed outcome prediction.
- Location check-ins and boundaries are optional coordination tools. App copy is framed around lawful, calm, documented, recovery-aligned support rather than threats or punitive action.

## Privacy Summary

- The iOS privacy manifest declares linked user data used for app functionality, support, analytics, and personalization where applicable.
- Tracking is declared as false.
- The manifest declares UserDefaults access using reason `CA92.1` for app-only local preferences/session state.
- App Store privacy nutrition answers should match the shipped app behavior and the data categories declared in `ios/App/App/PrivacyInfo.xcprivacy`.

## Final Manual Checks Before Submit

- Replace the reviewer credentials above with a working App Review demo account.
- Confirm the demo account can reach the purchase screen, restore button, family dashboard, moderator dashboard if applicable, privacy policy, terms, support, and delete-account flow.
- Confirm RevenueCat products and entitlements are live in the App Store sandbox environment.
- Confirm App Store Connect privacy answers match the privacy manifest and privacy policy.
- Confirm screenshots and age-rating answers match the submitted build.
