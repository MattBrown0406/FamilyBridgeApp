// Product Configuration
// These IDs are used for subscription management and checkout flows

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
      id: `${BUNDLE_ID}.provider_monthly_v2`,
      price: 250,
      period: "month",
      displayName: "Provider Monthly",
    },
    quarterly: {
      id: `${BUNDLE_ID}.provider_quarterly_v2`,
      price: 629,
      period: "3 months",
      displayName: "Provider Quarterly",
    },
    annual: {
      id: `${BUNDLE_ID}.provider_annual`,
      price: 2500,
      period: "year",
      displayName: "Provider Annual",
      webOnly: true, // Not available on mobile platforms
    },
  },
  crisisModeration: {
    daily: {
      id: `${BUNDLE_ID}.crisis_moderation_daily`,
      price: 150,
      period: "24 hours",
      displayName: "Crisis Moderation (24 Hours)",
      description: "24-hour crisis moderation session with an experienced interventionist",
    },
  },
} as const;

// Product IDs array for fetching from stores (excludes web-only products)
export const ALL_PRODUCT_IDS = [
  PRODUCTS.family.monthly.id,
  PRODUCTS.provider.monthly.id,
  PRODUCTS.provider.quarterly.id,
  PRODUCTS.crisisModeration.daily.id,
];

// All product IDs including web-only
export const ALL_PRODUCT_IDS_INCLUDING_WEB = [
  ...ALL_PRODUCT_IDS,
  PRODUCTS.provider.annual.id,
];

// Subscription types
export type SubscriptionType = "family" | "provider";
export type BillingPeriod = "monthly" | "quarterly" | "annual";

// Get product ID based on subscription type and billing period
export function getProductId(
  subscriptionType: SubscriptionType,
  billingPeriod: BillingPeriod = "monthly"
): string {
  if (subscriptionType === "family") {
    return PRODUCTS.family.monthly.id;
  }
  switch (billingPeriod) {
    case "annual":
      return PRODUCTS.provider.annual.id;
    case "quarterly":
      return PRODUCTS.provider.quarterly.id;
    default:
      return PRODUCTS.provider.monthly.id;
  }
}

// Validate a product ID
export function isValidProductId(productId: string): boolean {
  return (ALL_PRODUCT_IDS as readonly string[]).includes(productId);
}
