# RevenueCat setup for FamilyBridge iOS

This app is being moved from a web-checkout model to native iOS subscriptions with RevenueCat.

## Proposed RevenueCat model

### Offerings

- `family`
- `provider`
- `crisis_moderation`

### Entitlements

- `fiis_support`
- `fiis_provider`

### Products

- `com.familybridgeapp.app.family_monthly`
- `com.familybridgeapp.app.provider_monthly_v2`
- `com.familybridgeapp.app.provider_quarterly_v2`
- `com.familybridgeapp.app.provider_annual`
- `com.familybridgeapp.app.crisis_moderation_daily`

## Offering mapping

### `family` offering

- Monthly package → `com.familybridgeapp.app.family_monthly`
- Grants entitlement `fiis_support`

### `provider` offering

- Monthly package → `com.familybridgeapp.app.provider_monthly_v2`
- Three-month package → `com.familybridgeapp.app.provider_quarterly_v2`
- Annual package → `com.familybridgeapp.app.provider_annual`
- Grants entitlement `fiis_provider`

### `crisis_moderation` offering

- One-time package → `com.familybridgeapp.app.crisis_moderation_daily`
- App Store type: consumable in-app purchase
- Activates one 24-hour Professional Guidance Window inside the selected family.
- After the App Store purchase succeeds, the app calls `activate-native-moderator-purchase`, which creates an active `paid_moderator_requests` record.

## App-side assumptions

- RevenueCat `appUserID` should be the Supabase auth user id.
- Native purchases should require login first, then unlock family/provider setup in-app.
- The current iOS web-handoff flow should stay disabled until the full entitlement path is live.
- The iOS Professional Guidance Window flow must load the `crisis_moderation` offering and must not send users to Square or external checkout.

## Still needed after SDK wiring

- Add `VITE_REVENUECAT_APPLE_API_KEY` to the app environment.
- Create the RevenueCat offerings, entitlements, and products above.
- Create the App Store Connect in-app purchase for `com.familybridgeapp.app.crisis_moderation_daily` and submit it with the app.
- Add a backend sync path so FamilyBridge can trust RevenueCat entitlements server-side for family setup and provider activation.
- Replace the remaining activation-code dependency for iOS subscription purchases.
