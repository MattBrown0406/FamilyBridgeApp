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
} as const;

export function getRevenueCatAppleApiKey() {
  return import.meta.env.VITE_REVENUECAT_APPLE_API_KEY?.trim() || null;
}

export function isRevenueCatNativeSupported() {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios";
}

export function isRevenueCatEnabled() {
  return isRevenueCatNativeSupported() && !!getRevenueCatAppleApiKey();
}

export async function ensureRevenueCatConfigured(appUserID: string) {
  const apiKey = getRevenueCatAppleApiKey();

  if (!apiKey || !isRevenueCatNativeSupported() || !appUserID) {
    return false;
  }

  const { isConfigured } = await Purchases.isConfigured();

  if (!isConfigured) {
    await Purchases.setLogLevel({
      level: import.meta.env.DEV ? LOG_LEVEL.DEBUG : LOG_LEVEL.INFO,
    });

    await Purchases.configure({
      apiKey,
      appUserID,
      storeKitVersion: STOREKIT_VERSION.DEFAULT,
      entitlementVerificationMode: ENTITLEMENT_VERIFICATION_MODE.INFORMATIONAL,
    });

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

export function getOfferingPackageByProductId(
  offering: PurchasesOffering | null | undefined,
  productId: string,
): PurchasesPackage | null {
  if (!offering) return null;

  return (
    offering.availablePackages.find((pkg) => pkg.product.identifier === productId) ?? null
  );
}
