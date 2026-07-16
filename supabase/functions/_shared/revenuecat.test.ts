// Billing-path unit tests (Section 4.1) — run with: deno test supabase/functions/_shared/
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  getLatestRevenueCatNonSubscriptionPurchase,
  hasActiveRevenueCatEntitlement,
  type RevenueCatSubscriber,
} from "./revenuecat.ts";

const future = new Date(Date.now() + 86_400_000).toISOString(); // +1 day
const past = new Date(Date.now() - 86_400_000).toISOString();   // -1 day

Deno.test("entitlement: active when expires_date is in the future", () => {
  const sub: RevenueCatSubscriber = { entitlements: { pro: { expires_date: future } } };
  assertEquals(hasActiveRevenueCatEntitlement(sub, "pro"), true);
});

Deno.test("entitlement: inactive when expires_date is in the past", () => {
  const sub: RevenueCatSubscriber = { entitlements: { pro: { expires_date: past } } };
  assertEquals(hasActiveRevenueCatEntitlement(sub, "pro"), false);
});

Deno.test("entitlement: grace period keeps access alive past expiry", () => {
  const sub: RevenueCatSubscriber = {
    entitlements: { pro: { expires_date: past, grace_period_expires_date: future } },
  };
  assertEquals(hasActiveRevenueCatEntitlement(sub, "pro"), true);
});

Deno.test("entitlement: expired grace period denies access", () => {
  const sub: RevenueCatSubscriber = {
    entitlements: { pro: { expires_date: past, grace_period_expires_date: past } },
  };
  assertEquals(hasActiveRevenueCatEntitlement(sub, "pro"), false);
});

Deno.test("entitlement: lifetime (no expires_date) is active", () => {
  const sub: RevenueCatSubscriber = { entitlements: { pro: {} } };
  assertEquals(hasActiveRevenueCatEntitlement(sub, "pro"), true);
});

Deno.test("entitlement: missing entitlement / null subscriber are inactive", () => {
  assertEquals(hasActiveRevenueCatEntitlement({ entitlements: {} }, "pro"), false);
  assertEquals(hasActiveRevenueCatEntitlement(null, "pro"), false);
  assertEquals(hasActiveRevenueCatEntitlement(undefined, "pro"), false);
});

Deno.test("non-subscription: returns latest purchase after cutoff", () => {
  const t1 = new Date(Date.now() - 3_600_000).toISOString();
  const t2 = new Date(Date.now() - 60_000).toISOString();
  const sub: RevenueCatSubscriber = {
    non_subscriptions: {
      guidance_window: [
        { id: "a", purchase_date: t1, store: "app_store", is_sandbox: false },
        { id: "b", purchase_date: t2, store: "app_store", is_sandbox: false },
      ],
    },
  };
  const latest = getLatestRevenueCatNonSubscriptionPurchase(
    sub, "guidance_window", new Date(Date.now() - 7_200_000), "b",
  );
  assertEquals(latest?.id, "b");
});

Deno.test("non-subscription: ignores purchases before cutoff and malformed rows", () => {
  const old = new Date(Date.now() - 86_400_000 * 30).toISOString();
  const sub: RevenueCatSubscriber = {
    non_subscriptions: {
      guidance_window: [
        { id: "old", purchase_date: old },
        { id: null, purchase_date: new Date().toISOString() },
        { id: "no-date" },
      ],
    },
  };
  const latest = getLatestRevenueCatNonSubscriptionPurchase(
    sub, "guidance_window", new Date(Date.now() - 3_600_000), "old",
  );
  assertEquals(latest, null);
});

Deno.test("non-subscription: unknown product returns null", () => {
  assertEquals(getLatestRevenueCatNonSubscriptionPurchase({}, "nope", new Date(), "missing"), null);
});
