export type RevenueCatEntitlement = {
  expires_date?: string | null;
  grace_period_expires_date?: string | null;
  product_identifier?: string | null;
  purchase_date?: string | null;
};

export type RevenueCatNonSubscriptionPurchase = {
  id?: string | null;
  product_identifier?: string | null;
  purchase_date?: string | null;
  store?: string | null;
  is_sandbox?: boolean | null;
};

export type RevenueCatSubscriber = {
  entitlements?: Record<string, RevenueCatEntitlement | undefined>;
  non_subscriptions?: Record<
    string,
    RevenueCatNonSubscriptionPurchase[] | undefined
  >;
  original_app_user_id?: string;
};

export type RevenueCatWebhookEvent = {
  id: string;
  type: string;
  app_id: string;
  app_user_id: string;
  product_id: string;
  transaction_id: string | null;
  original_transaction_id: string | null;
  event_timestamp_ms: number;
  purchased_at_ms: number | null;
  expiration_at_ms: number | null;
  environment: "PRODUCTION" | "SANDBOX";
  store: "APP_STORE" | "PLAY_STORE";
  entitlement_ids: string[];
  cancel_reason: string | null;
};

const REVENUECAT_API_BASE = "https://api.revenuecat.com/v1";
const NATIVE_STORES = new Set(["app_store", "play_store"]);
const NATIVE_WEBHOOK_STORES = new Set(["APP_STORE", "PLAY_STORE"]);
const WEBHOOK_EVENT_TYPES = new Set([
  "TEST",
  "INITIAL_PURCHASE",
  "RENEWAL",
  "CANCELLATION",
  "UNCANCELLATION",
  "NON_RENEWING_PURCHASE",
  "SUBSCRIPTION_PAUSED",
  "EXPIRATION",
  "BILLING_ISSUE",
  "PRODUCT_CHANGE",
  "SUBSCRIPTION_EXTENDED",
  "REFUND_REVERSED",
  "TRANSFER",
  "TEMPORARY_ENTITLEMENT_GRANT",
]);
const SAFE_IDENTIFIER = /^[A-Za-z0-9._:$@+\-/]{1,255}$/;

function getRevenueCatApiKey() {
  return Deno.env.get("REVENUECAT_SECRET_API_KEY")?.trim() || null;
}

export async function getRevenueCatSubscriber(
  appUserId: string,
): Promise<RevenueCatSubscriber | null> {
  const apiKey = getRevenueCatApiKey();

  if (!apiKey) {
    throw new Error("RevenueCat API key is not configured on the server");
  }

  const response = await fetch(
    `${REVENUECAT_API_BASE}/subscribers/${encodeURIComponent(appUserId)}`,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    },
  );

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
  now = new Date(),
) {
  const entitlement = subscriber?.entitlements?.[entitlementId];

  if (!entitlement) {
    return false;
  }

  if (entitlement.grace_period_expires_date) {
    return new Date(entitlement.grace_period_expires_date) > now;
  }

  if (!entitlement.expires_date) {
    return true;
  }

  return new Date(entitlement.expires_date) > now;
}

export function isMatchingRevenueCatProductId(
  actualProductId: string | null | undefined,
  expectedProductId: string,
) {
  return actualProductId === expectedProductId ||
    actualProductId?.startsWith(`${expectedProductId}:`) === true;
}

export function getLatestRevenueCatNonSubscriptionPurchase(
  subscriber: RevenueCatSubscriber | null | undefined,
  productId: string,
  purchasedAfter: Date,
  transactionId: string,
  now = new Date(),
  allowSandbox = false,
) {
  const latestAllowedTime = now.getTime() + 5 * 60 * 1000;
  const matchingPurchases = Object.entries(subscriber?.non_subscriptions ?? {})
    .filter(([key]) => isMatchingRevenueCatProductId(key, productId))
    .flatMap(([, purchases]) => purchases ?? []);

  return matchingPurchases
    .filter((purchase) => {
      if (!purchase.id || !purchase.purchase_date) return false;
      if (purchase.id !== transactionId) return false;
      if (allowSandbox ? purchase.is_sandbox !== true : purchase.is_sandbox !== false) {
        return false;
      }
      if (
        purchase.product_identifier &&
        !isMatchingRevenueCatProductId(purchase.product_identifier, productId)
      ) return false;
      if (!NATIVE_STORES.has((purchase.store ?? "").toLowerCase())) {
        return false;
      }

      const purchaseTime = new Date(purchase.purchase_date).getTime();
      return Number.isFinite(purchaseTime) &&
        purchaseTime >= purchasedAfter.getTime() &&
        purchaseTime <= latestAllowedTime;
    })
    .sort((a, b) => {
      const aTime = new Date(a.purchase_date ?? 0).getTime();
      const bTime = new Date(b.purchase_date ?? 0).getTime();
      return bTime - aTime;
    })[0] ?? null;
}

export function secureCompare(value: string, expected: string): boolean {
  const encoder = new TextEncoder();
  const left = encoder.encode(value);
  const right = encoder.encode(expected);
  const length = Math.max(left.length, right.length);
  let difference = left.length ^ right.length;

  for (let index = 0; index < length; index += 1) {
    difference |= (left[index] ?? 0) ^ (right[index] ?? 0);
  }

  return difference === 0;
}

export function validateRevenueCatWebhookPayload(
  payload: unknown,
  expectedApps: Readonly<Record<string, "APP_STORE" | "PLAY_STORE">>,
  allowedProductIds: readonly string[],
  allowedEnvironments: readonly ("PRODUCTION" | "SANDBOX")[] = ["PRODUCTION"],
): RevenueCatWebhookEvent {
  if (!payload || typeof payload !== "object") {
    throw new Error("Webhook body must be an object");
  }
  const envelope = payload as Record<string, unknown>;
  if (envelope.api_version !== "1.0") {
    throw new Error("Unsupported RevenueCat webhook API version");
  }
  if (!envelope.event || typeof envelope.event !== "object") {
    throw new Error("Missing RevenueCat event");
  }

  const event = envelope.event as Record<string, unknown>;
  const id = requireSafeString(event.id, "event id");
  const type = requireSafeString(event.type, "event type").toUpperCase();
  const appId = requireSafeString(event.app_id, "app id");

  if (!WEBHOOK_EVENT_TYPES.has(type)) {
    throw new Error("Unsupported RevenueCat event type");
  }
  const isSyntheticTest = type === "TEST";
  const expectedStore = expectedApps[appId];
  if (!isSyntheticTest && !expectedStore) {
    throw new Error("RevenueCat app id does not match");
  }

  const appUserId = requireSafeString(event.app_user_id, "app user id");
  const rawProductId = requireSafeString(event.product_id, "product id");
  const productId = isSyntheticTest
    ? rawProductId
    : allowedProductIds.find((allowed) =>
      isMatchingRevenueCatProductId(rawProductId, allowed)
    );
  if (!productId) throw new Error("RevenueCat product is not allowed");

  const eventTimestamp = requireTimestamp(
    event.event_timestamp_ms,
    "event timestamp",
  );
  const now = Date.now();
  if (eventTimestamp > now + 5 * 60 * 1000) {
    throw new Error(
      "RevenueCat event timestamp is outside the accepted window",
    );
  }

  const environment = event.environment;
  if (environment !== "PRODUCTION" && environment !== "SANDBOX") {
    throw new Error("Invalid RevenueCat environment");
  }
  // RevenueCat's dashboard test event intentionally uses a fake app/product and
  // SANDBOX. It is safe to accept only because webhook authorization is checked
  // before this validator and TEST events never mutate lifecycle state.
  if (!isSyntheticTest && !allowedEnvironments.includes(environment)) {
    throw new Error("RevenueCat environment is not allowed");
  }

  const rawStore = requireSafeString(event.store, "store").toUpperCase();
  if (
    !NATIVE_WEBHOOK_STORES.has(rawStore) ||
    (!isSyntheticTest && rawStore !== expectedStore)
  ) {
    throw new Error("RevenueCat store does not match the configured app");
  }
  const store = rawStore as "APP_STORE" | "PLAY_STORE";

  const transactionId = optionalSafeString(
    event.transaction_id,
    "transaction id",
  );
  const originalTransactionId = optionalSafeString(
    event.original_transaction_id,
    "original transaction id",
  );
  if (
    productId.endsWith("crisis_moderation_daily") && type !== "TEST" &&
    !transactionId && !originalTransactionId
  ) {
    throw new Error("Guidance purchase event is missing a transaction id");
  }

  const entitlementIds = Array.isArray(event.entitlement_ids)
    ? event.entitlement_ids.map((value) =>
      requireSafeString(value, "entitlement id")
    )
    : [];

  return {
    id,
    type,
    app_id: appId,
    app_user_id: appUserId,
    product_id: productId,
    transaction_id: transactionId,
    original_transaction_id: originalTransactionId,
    event_timestamp_ms: eventTimestamp,
    purchased_at_ms: optionalTimestamp(
      event.purchased_at_ms,
      "purchase timestamp",
    ),
    expiration_at_ms: optionalTimestamp(
      event.expiration_at_ms,
      "expiration timestamp",
    ),
    environment,
    store,
    entitlement_ids: entitlementIds,
    cancel_reason: optionalSafeString(event.cancel_reason, "cancel reason"),
  };
}

function requireSafeString(value: unknown, field: string): string {
  if (typeof value !== "string" || !SAFE_IDENTIFIER.test(value)) {
    throw new Error(`Invalid ${field}`);
  }
  return value;
}

function optionalSafeString(value: unknown, field: string): string | null {
  if (value === null || value === undefined) return null;
  return requireSafeString(value, field);
}

function requireTimestamp(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`Invalid ${field}`);
  }
  return value;
}

function optionalTimestamp(value: unknown, field: string): number | null {
  if (value === null || value === undefined) return null;
  return requireTimestamp(value, field);
}
