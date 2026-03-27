// Product Configuration
// These IDs are used for subscription management and checkout flows

export const BUNDLE_ID = "app.lovable.feec162303784a959c1635217b29129c";

// Square Subscription Plan IDs (from Square Dashboard)
export const SQUARE_PLAN_IDS = {
  family_monthly: "NXU2LLO56OWLAN3OWJV55VHT",
  provider_monthly: "J5JSSBKZASUKMISQBLISFUZP",
  provider_quarterly: "MYPV3BWPOMVKFCGKFLD5CMLU",
  provider_annual: "JJFJPR2WOCB6PIJZL4TUUQGF",
} as const;

export const PRODUCTS = {
  family: {
    monthly: {
      id: `${BUNDLE_ID}.family_monthly`,
      squarePlanId: SQUARE_PLAN_IDS.family_monthly,
      price: 19.99,
      period: "month",
      displayName: "Family Monthly",
    },
  },
  provider: {
    monthly: {
      id: `${BUNDLE_ID}.provider_monthly_v2`,
      squarePlanId: SQUARE_PLAN_IDS.provider_monthly,
      price: 250,
      period: "month",
      displayName: "Provider Monthly",
    },
    quarterly: {
      id: `${BUNDLE_ID}.provider_quarterly_v2`,
      squarePlanId: SQUARE_PLAN_IDS.provider_quarterly,
      price: 629,
      period: "3 months",
      displayName: "Provider Quarterly",
    },
    annual: {
      id: `${BUNDLE_ID}.provider_annual`,
      squarePlanId: SQUARE_PLAN_IDS.provider_annual,
      price: 2500,
      period: "year",
      displayName: "Provider Annual",
      webOnly: true,
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

// Get Square Plan ID based on subscription type and billing period
export function getSquarePlanId(
  subscriptionType: SubscriptionType,
  billingPeriod: BillingPeriod = "monthly"
): string {
  if (subscriptionType === "family") {
    return SQUARE_PLAN_IDS.family_monthly;
  }
  switch (billingPeriod) {
    case "annual":
      return SQUARE_PLAN_IDS.provider_annual;
    case "quarterly":
      return SQUARE_PLAN_IDS.provider_quarterly;
    default:
      return SQUARE_PLAN_IDS.provider_monthly;
  }
}

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
