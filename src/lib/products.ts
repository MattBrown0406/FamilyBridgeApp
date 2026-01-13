// In-App Purchase Product Configuration
// These IDs must match exactly what's configured in App Store Connect and Google Play Console

export const BUNDLE_ID = "app.lovable.feec162303784a959c1635217b29129c";

export const PRODUCTS = {
  family: {
    monthly: {
      id: `${BUNDLE_ID}.family_monthly`,
      price: 19.99,
      period: "month",
      displayName: "Family Monthly",
    },
  },
  provider: {
    monthly: {
      id: `${BUNDLE_ID}.provider_monthly`,
      price: 250,
      period: "month",
      displayName: "Provider Monthly",
    },
    annual: {
      id: `${BUNDLE_ID}.provider_annual`,
      price: 2500,
      period: "year",
      displayName: "Provider Annual",
    },
  },
} as const;

// Product IDs array for fetching from stores
export const ALL_PRODUCT_IDS = [
  PRODUCTS.family.monthly.id,
  PRODUCTS.provider.monthly.id,
  PRODUCTS.provider.annual.id,
];

// Subscription types
export type SubscriptionType = "family" | "provider";
export type BillingPeriod = "monthly" | "annual";

// Get product ID based on subscription type and billing period
export function getProductId(
  subscriptionType: SubscriptionType,
  billingPeriod: BillingPeriod = "monthly"
): string {
  if (subscriptionType === "family") {
    return PRODUCTS.family.monthly.id;
  }
  return billingPeriod === "annual"
    ? PRODUCTS.provider.annual.id
    : PRODUCTS.provider.monthly.id;
}

// Validate a product ID
export function isValidProductId(productId: string): boolean {
  return (ALL_PRODUCT_IDS as readonly string[]).includes(productId);
}
