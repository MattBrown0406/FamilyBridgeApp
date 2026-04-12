export type RevenueCatEntitlement = {
  expires_date?: string | null;
  grace_period_expires_date?: string | null;
  product_identifier?: string | null;
  purchase_date?: string | null;
};

export type RevenueCatSubscriber = {
  entitlements?: Record<string, RevenueCatEntitlement | undefined>;
  original_app_user_id?: string;
};

const REVENUECAT_API_BASE = "https://api.revenuecat.com/v1";

function getRevenueCatApiKey() {
  return Deno.env.get("REVENUECAT_SECRET_API_KEY")?.trim() || null;
}

export async function getRevenueCatSubscriber(appUserId: string): Promise<RevenueCatSubscriber | null> {
  const apiKey = getRevenueCatApiKey();

  if (!apiKey) {
    throw new Error("RevenueCat API key is not configured on the server");
  }

  const response = await fetch(`${REVENUECAT_API_BASE}/subscribers/${encodeURIComponent(appUserId)}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`RevenueCat lookup failed: ${response.status} ${text}`);
  }

  const payload = await response.json();
  return payload?.subscriber ?? null;
}

export function hasActiveRevenueCatEntitlement(
  subscriber: RevenueCatSubscriber | null | undefined,
  entitlementId: string,
) {
  const entitlement = subscriber?.entitlements?.[entitlementId];

  if (!entitlement) {
    return false;
  }

  if (entitlement.grace_period_expires_date) {
    return new Date(entitlement.grace_period_expires_date) > new Date();
  }

  if (!entitlement.expires_date) {
    return true;
  }

  return new Date(entitlement.expires_date) > new Date();
}
