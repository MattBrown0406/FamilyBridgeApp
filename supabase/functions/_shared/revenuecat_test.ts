import {
  assertEquals,
  assertThrows,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  getLatestRevenueCatNonSubscriptionPurchase,
  type RevenueCatSubscriber,
  secureCompare,
  validateRevenueCatWebhookPayload,
} from "./revenuecat.ts";

const PRODUCT_ID = "com.familybridgeapp.app.crisis_moderation_daily";
const EXPECTED_APPS = {
  ios_app: "APP_STORE",
  android_app: "PLAY_STORE",
} as const;

Deno.test("selects a fresh production native purchase with an exact transaction match", () => {
  const now = new Date("2026-07-16T12:00:00.000Z");
  const subscriber: RevenueCatSubscriber = {
    non_subscriptions: {
      [PRODUCT_ID]: [
        {
          id: "old",
          product_identifier: PRODUCT_ID,
          purchase_date: "2026-07-16T10:00:00.000Z",
          store: "app_store",
          is_sandbox: false,
        },
        {
          id: "wanted",
          product_identifier: PRODUCT_ID,
          purchase_date: "2026-07-16T11:59:00.000Z",
          store: "play_store",
          is_sandbox: false,
        },
      ],
    },
  };

  const purchase = getLatestRevenueCatNonSubscriptionPurchase(
    subscriber,
    PRODUCT_ID,
    new Date("2026-07-16T11:00:00.000Z"),
    "wanted",
    now,
  );
  assertEquals(purchase?.id, "wanted");
});

Deno.test("supports Android base-plan product keys", () => {
  const now = new Date("2026-07-16T12:00:00.000Z");
  const subscriber: RevenueCatSubscriber = {
    non_subscriptions: {
      [`${PRODUCT_ID}:daily`]: [{
        id: "android-txn",
        purchase_date: "2026-07-16T11:59:00.000Z",
        store: "play_store",
        is_sandbox: false,
      }],
    },
  };

  assertEquals(
    getLatestRevenueCatNonSubscriptionPurchase(
      subscriber,
      PRODUCT_ID,
      new Date(now.getTime() - 3_600_000),
      "android-txn",
      now,
    )?.id,
    "android-txn",
  );
});

Deno.test("rejects stale, future, non-native, and mismatched purchases", () => {
  const now = new Date("2026-07-16T12:00:00.000Z");
  const subscriber: RevenueCatSubscriber = {
    non_subscriptions: {
      [PRODUCT_ID]: [
        { id: "stale", purchase_date: "2026-07-15T10:00:00.000Z", store: "app_store", is_sandbox: false },
        { id: "future", purchase_date: "2026-07-16T12:06:00.000Z", store: "app_store", is_sandbox: false },
        { id: "stripe", purchase_date: "2026-07-16T11:59:00.000Z", store: "stripe", is_sandbox: false },
      ],
    },
  };
  const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  for (const transactionId of ["stale", "future", "stripe", "missing"]) {
    assertEquals(
      getLatestRevenueCatNonSubscriptionPurchase(
        subscriber,
        PRODUCT_ID,
        cutoff,
        transactionId,
        now,
      ),
      null,
    );
  }
});

Deno.test("rejects sandbox purchases by default and allows only an explicit test override", () => {
  const now = new Date("2026-07-16T12:00:00.000Z");
  const subscriber: RevenueCatSubscriber = {
    non_subscriptions: {
      [PRODUCT_ID]: [{
        id: "sandbox-txn",
        purchase_date: "2026-07-16T11:59:00.000Z",
        store: "app_store",
        is_sandbox: true,
      }],
    },
  };
  const args = [
    subscriber,
    PRODUCT_ID,
    new Date(now.getTime() - 3_600_000),
    "sandbox-txn",
    now,
  ] as const;

  assertEquals(getLatestRevenueCatNonSubscriptionPurchase(...args), null);
  assertEquals(
    getLatestRevenueCatNonSubscriptionPurchase(...args, true)?.id,
    "sandbox-txn",
  );
});

Deno.test("constant-time comparison helper checks the complete authorization value", () => {
  assertEquals(secureCompare("Bearer webhook-secret", "Bearer webhook-secret"), true);
  assertEquals(secureCompare("Bearer webhook-secret", "Bearer webhook-secreu"), false);
  assertEquals(secureCompare("short", "longer"), false);
});

Deno.test("validates app, store, environment, and canonical product for Android", () => {
  const now = Date.now();
  const event = validateRevenueCatWebhookPayload(
    {
      api_version: "1.0",
      event: {
        id: "event-1",
        type: "CANCELLATION",
        app_id: "android_app",
        app_user_id: "00000000-0000-4000-8000-000000000001",
        product_id: `${PRODUCT_ID}:daily`,
        transaction_id: "GPA.1234-5678",
        original_transaction_id: "GPA.1234-5678",
        event_timestamp_ms: now,
        purchased_at_ms: now - 1000,
        environment: "PRODUCTION",
        store: "PLAY_STORE",
        entitlement_ids: [],
        cancel_reason: "CUSTOMER_SUPPORT",
      },
    },
    EXPECTED_APPS,
    [PRODUCT_ID],
  );

  assertEquals(event.product_id, PRODUCT_ID);
  assertEquals(event.transaction_id, "GPA.1234-5678");
  assertEquals(event.store, "PLAY_STORE");
});

Deno.test("rejects wrong app, mismatched store, sandbox, unknown product, and missing transaction", () => {
  const baseEvent = {
    id: "event-2",
    type: "NON_RENEWING_PURCHASE",
    app_id: "android_app",
    app_user_id: "$RCAnonymousID:abc",
    product_id: PRODUCT_ID,
    transaction_id: "txn",
    event_timestamp_ms: Date.now(),
    environment: "PRODUCTION",
    store: "PLAY_STORE",
  };

  const invalidCases: Array<[Record<string, unknown>, string]> = [
    [{ ...baseEvent, app_id: "wrong-app" }, "app id"],
    [{ ...baseEvent, store: "APP_STORE" }, "store"],
    [{ ...baseEvent, environment: "SANDBOX" }, "environment"],
    [{ ...baseEvent, product_id: "evil.product" }, "not allowed"],
    [{ ...baseEvent, transaction_id: undefined }, "transaction id"],
  ];

  for (const [event, message] of invalidCases) {
    assertThrows(
      () =>
        validateRevenueCatWebhookPayload(
          { api_version: "1.0", event },
          EXPECTED_APPS,
          [PRODUCT_ID],
        ),
      Error,
      message,
    );
  }
});

Deno.test("allows sandbox webhooks only when explicitly configured", () => {
  const event = validateRevenueCatWebhookPayload(
    {
      api_version: "1.0",
      event: {
        id: "sandbox-event",
        type: "NON_RENEWING_PURCHASE",
        app_id: "ios_app",
        app_user_id: "user-1",
        product_id: PRODUCT_ID,
        transaction_id: "sandbox-txn",
        event_timestamp_ms: Date.now(),
        environment: "SANDBOX",
        store: "APP_STORE",
      },
    },
    EXPECTED_APPS,
    [PRODUCT_ID],
    ["SANDBOX"],
  );
  assertEquals(event.environment, "SANDBOX");
});
