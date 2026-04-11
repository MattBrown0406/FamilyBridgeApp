# RevenueCat setup for FamilyBridge iOS

This app is being moved from a web-checkout model to native iOS subscriptions with RevenueCat.

## Proposed RevenueCat model

### Offerings

- `family`
- `provider`

### Entitlements

- `fiis_support`
- `fiis_provider`

### Products

- `com.familybridgeapp.app.family_monthly`
- `com.familybridgeapp.app.provider_monthly_v2`
- `com.familybridgeapp.app.provider_quarterly_v2`
- `com.familybridgeapp.app.provider_annual`

## Offering mapping

### `family` offering

- Monthly package → `com.familybridgeapp.app.family_monthly`
- Grants entitlement `fiis_support`

### `provider` offering

- Monthly package → `com.familybridgeapp.app.provider_monthly_v2`
- Three-month package → `com.familybridgeapp.app.provider_quarterly_v2`
- Annual package → `com.familybridgeapp.app.provider_annual`
- Grants entitlement `fiis_provider`

## App-side assumptions

- RevenueCat `appUserID` should be the Supabase auth user id.
- Native purchases should require login first, then unlock family/provider setup in-app.
- The current iPhone web-handoff flow should stay disabled until the full entitlement path is live.

## Still needed after SDK wiring

- Add `VITE_REVENUECAT_APPLE_API_KEY` to the app environment.
- Create the RevenueCat offerings, entitlements, and products above.
- Add a backend sync path so FamilyBridge can trust RevenueCat entitlements server-side for family setup and provider activation.
- Replace the remaining activation-code dependency for iOS subscription purchases.
