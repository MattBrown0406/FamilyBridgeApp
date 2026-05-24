import { Capacitor } from "@capacitor/core";
import {
  ENTITLEMENT_VERIFICATION_MODE,
  LOG_LEVEL,
  Purchases,
  STOREKIT_VERSION,
  type CustomerInfo,
  type PurchasesOffering,
  type PurchasesPackage,
} from "@revenuecat/purchases-capacitor";

export type { PurchasesOffering, PurchasesPackage, CustomerInfo };

export const REVENUECAT_OFFERING_IDS = {
  family: "family",
  provider: "provider",
  guidance: "guidance",
  crisisModeration: "crisis_moderation",
} as const;

export const REVENUECAT_ENTITLEMENT_IDS = {
  family: "fiis_support",
  provider: "fiis_provider",
} as const;

export const REVENUECAT_PRODUCT_IDS = {
  familyMonthly: "com.familybridgeapp.app.family_monthly",
  providerMonthly: "com.familybridgeapp.app.provider_monthly_v2",
  providerQuarterly: "com.familybridgeapp.app.provider_quarterly_v2",
  providerAnnual: "com.familybridgeapp.app.provider_annual",
  guidanceWindowDaily: "com.familybridgeapp.app.crisis_moderation_daily",
  crisisModerationDaily: "com.familybridgeapp.app.crisis_moderation_daily",
} as const;

export const REVENUECAT_ANDROID_PRODUCT_IDS = {
  familyMonthly: `${REVENUECAT_PRODUCT_IDS.familyMonthly}:monthly`,
  providerMonthly: `${REVENUECAT_PRODUCT_IDS.providerMonthly}:monthly`,
  providerQuarterly: `${REVENUECAT_PRODUCT_IDS.providerQuarterly}:quarterly`,
  guidanceWindowDaily: REVENUECAT_PRODUCT_IDS.guidanceWindowDaily,
  crisisModerationDaily: REVENUECAT_PRODUCT_IDS.crisisModerationDaily,
} as const;

// RevenueCat iOS public app-specific API key.
// Safe to commit: this is a publishable client key, not a secret.
const REVENUECAT_APPLE_API_KEY_FALLBACK = "appl_uadXDmElJcifwXdVuQKnMdlVHeU";

export function getRevenueCatAppleApiKey() {
  const fromEnv = import.meta.env.VITE_REVENUECAT_APPLE_API_KEY?.trim();
  return fromEnv || REVENUECAT_APPLE_API_KEY_FALLBACK || null;
}

export function getRevenueCatGoogleApiKey() {
  return import.meta.env.VITE_REVENUECAT_GOOGLE_API_KEY?.trim() || null;
}

export function getRevenueCatApiKey() {
  const platform = Capacitor.getPlatform();

  if (platform === "ios") {
    return getRevenueCatAppleApiKey();
  }

  if (platform === "android") {
    return getRevenueCatGoogleApiKey();
  }

  return null;
}

export function isRevenueCatNativeSupported() {
  return Capacitor.isNativePlatform() && ["ios", "android"].includes(Capacitor.getPlatform());
}

export function isRevenueCatEnabled() {
  return isRevenueCatNativeSupported() && !!getRevenueCatApiKey();
}

export async function ensureRevenueCatConfigured(appUserID?: string | null) {
  const apiKey = getRevenueCatApiKey();

  if (!apiKey || !isRevenueCatNativeSupported()) {
    return false;
  }

  const { isConfigured } = await Purchases.isConfigured();

  if (!isConfigured) {
    await Purchases.setLogLevel({
      level: import.meta.env.DEV ? LOG_LEVEL.DEBUG : LOG_LEVEL.INFO,
    });

    const configureOptions = {
      apiKey,
      appUserID: appUserID ?? null,
      entitlementVerificationMode: ENTITLEMENT_VERIFICATION_MODE.INFORMATIONAL,
      ...(Capacitor.getPlatform() === "ios" ? { storeKitVersion: STOREKIT_VERSION.DEFAULT } : {}),
    };

    await Purchases.configure(configureOptions);

    return true;
  }

  if (!appUserID) {
    return true;
  }

  const { customerInfo } = await Purchases.logIn({ appUserID });
  return !!customerInfo;
}

export function hasRevenueCatEntitlement(
  customerInfo: CustomerInfo | null | undefined,
  entitlementId: string,
) {
  return !!customerInfo?.entitlements.active?.[entitlementId]?.isActive;
}

export async function getRevenueCatOffering(offeringId: string) {
  const offerings = await Purchases.getOfferings();
  return offerings.all[offeringId] ?? null;
}

export async function getRevenueCatPackageByProductId(productId: string): Promise<PurchasesPackage | null> {
  const offerings = await Purchases.getOfferings();
  const allOfferings = Object.values(offerings.all ?? {});

  for (const offering of allOfferings) {
    const packageMatch = getOfferingPackageByProductId(offering, productId);
    if (packageMatch) return packageMatch;
  }

  return null;
}

export function getOfferingPackageByProductId(
  offering: PurchasesOffering | null | undefined,
  productId: string,
): PurchasesPackage | null {
  if (!offering) return null;

  return (
    offering.availablePackages.find((pkg) => isMatchingRevenueCatProductId(pkg.product.identifier, productId)) ?? null
  );
}

export function isMatchingRevenueCatProductId(actualProductId: string, expectedProductId: string) {
  if (actualProductId === expectedProductId) {
    return true;
  }

  if (Capacitor.getPlatform() !== "android") {
    return false;
  }

  return actualProductId.startsWith(`${expectedProductId}:`);
}
