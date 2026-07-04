import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { isInternalRequest, forbiddenResponse } from "../_shared/internal-auth.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";


const SQUARE_VERSION = "2024-01-18";
const AUDIT_LOOKBACK_HOURS = 48;
const PAYMENT_GRACE_MINUTES = 15;

type BillingIssueType =
  | "subscription_id_missing_after_completed_payment"
  | "activation_code_missing_after_completed_payment";

interface SquarePayment {
  id: string;
  created_at?: string;
  status?: string;
  amount_money?: { amount?: number; currency?: string };
  customer_id?: string;
  order_id?: string;
  note?: string;
  receipt_url?: string;
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function detectProductType(note = ""): "family" | "provider" | "unknown" {
  const lower = note.toLowerCase();
  if (lower.includes("familybridge family subscription")) return "family";
  if (lower.includes("familybridge provider") || lower.includes("provider subscription")) return "provider";
  return "unknown";
}

function isFamilyBridgeWebSubscriptionPayment(payment: SquarePayment): boolean {
  const note = payment.note?.toLowerCase() || "";
  return payment.status === "COMPLETED"
    && !!payment.id
    && !!payment.order_id
    && !!payment.customer_id
    && note.includes("familybridge")
    && note.includes("subscription");
}

function isOutsideGraceWindow(payment: SquarePayment): boolean {
  if (!payment.created_at) return true;
  const created = new Date(payment.created_at).getTime();
  return Number.isFinite(created) && Date.now() - created > PAYMENT_GRACE_MINUTES * 60 * 1000;
}

async function listRecentSquarePayments(squareAccessToken: string): Promise<SquarePayment[]> {
  const begin = new Date(Date.now() - AUDIT_LOOKBACK_HOURS * 60 * 60 * 1000).toISOString();
  const url = new URL("https://connect.squareup.com/v2/payments");
  url.searchParams.set("begin_time", begin);
  url.searchParams.set("sort_order", "DESC");
  url.searchParams.set("limit", "100");

  const res = await fetch(url.toString(), {
    headers: {
      "Square-Version": SQUARE_VERSION,
      Authorization: `Bearer ${squareAccessToken}`,
      "Content-Type": "application/json",
    },
  });
  const json = await res.json();
  if (!res.ok || json.errors) {
    console.error("Square payments list error:", json);
    throw new Error("Unable to list Square payments for billing audit");
  }
  return json.payments || [];
}

async function sendAlertEmail(params: {
  resendApiKey?: string | null;
  resendFrom: string;
  issueType: BillingIssueType;
  payment: SquarePayment;
  productType: string;
}) {
  const { resendApiKey, resendFrom, issueType, payment, productType } = params;
  if (!resendApiKey) return;

  const resend = new Resend(resendApiKey);
  const amount = payment.amount_money?.amount != null
    ? `$${(payment.amount_money.amount / 100).toFixed(2)} ${payment.amount_money.currency || "USD"}`
    : "unknown amount";

  await resend.emails.send({
    from: resendFrom,
    to: ["support@familybridgeapp.com"],
    subject: "FamilyBridge billing audit alert: completed Square payment missing subscription data",
    html: `
      <h2>FamilyBridge billing audit alert</h2>
      <p><strong>Issue:</strong> ${issueType}</p>
      <p><strong>Product:</strong> ${productType}</p>
      <p><strong>Payment ID:</strong> ${payment.id}</p>
      <p><strong>Order ID:</strong> ${payment.order_id || "missing"}</p>
      <p><strong>Customer ID:</strong> ${payment.customer_id || "missing"}</p>
      <p><strong>Amount:</strong> ${amount}</p>
      <p><strong>Created:</strong> ${payment.created_at || "unknown"}</p>
      <p><strong>Note:</strong> ${payment.note || "none"}</p>
      ${payment.receipt_url ? `<p><a href="${payment.receipt_url}">Square receipt</a></p>` : ""}
      <p>This means Square captured a web subscription payment, but FamilyBridge did not find the expected stored recurring subscription ID or activation-code record during audit.</p>
      <p>Do not ignore this. Confirm the Square subscription manually, then mark the alert resolved in billing_audit_alerts.</p>
    `,
  });
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));
  if (!isInternalRequest(req)) {
    return forbiddenResponse(corsHeaders);
  }

  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const squareAccessToken = Deno.env.get("SQUARE_ACCESS_TOKEN");
    if (!squareAccessToken) throw new Error("Square credentials not configured");

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const resendFrom = Deno.env.get("RESEND_FROM") || "FamilyBridge <noreply@familybridgeapp.com>";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payments = await listRecentSquarePayments(squareAccessToken);
    const candidates = payments
      .filter(isFamilyBridgeWebSubscriptionPayment)
      .filter(isOutsideGraceWindow);

    const alerts: Array<{ paymentId: string; issueType: BillingIssueType }> = [];

    for (const payment of candidates) {
      const orderId = payment.order_id!;
      const customerId = payment.customer_id!;
      const orderHash = await sha256Hex(orderId);
      const customerHash = await sha256Hex(customerId);
      const productType = detectProductType(payment.note || "");

      const { data: activation, error: activationError } = await supabase
        .from("activation_codes")
        .select("id, square_subscription_id_encrypted")
        .eq("purchase_ref_hash", orderHash)
        .maybeSingle();

      if (activationError) {
        console.error("Billing audit activation lookup error", { paymentId: payment.id, activationError });
        continue;
      }

      let issueType: BillingIssueType | null = null;
      if (!activation) {
        issueType = "activation_code_missing_after_completed_payment";
      } else if (!activation.square_subscription_id_encrypted) {
        issueType = "subscription_id_missing_after_completed_payment";
      }

      if (!issueType) continue;

      const alertPayload = {
        issue_type: issueType,
        payment_id: payment.id,
        order_id: orderId,
        order_id_hash: orderHash,
        customer_id_hash: customerHash,
        amount_cents: payment.amount_money?.amount ?? null,
        currency: payment.amount_money?.currency || "USD",
        payment_created_at: payment.created_at || null,
        payment_note: payment.note || null,
        product_type: productType,
        last_seen_at: new Date().toISOString(),
        metadata: {
          square_receipt_url: payment.receipt_url || null,
          square_customer_id_present: !!payment.customer_id,
          audit_source: "audit-square-billing",
        },
      };

      const { data: existingAlert, error: existingAlertError } = await supabase
        .from("billing_audit_alerts")
        .select("id, status, alert_sent_at")
        .eq("issue_type", issueType)
        .eq("payment_id", payment.id)
        .maybeSingle();

      if (existingAlertError) {
        console.error("Billing audit alert lookup error", { paymentId: payment.id, issueType, existingAlertError });
        continue;
      }

      let alertRecord = existingAlert;
      if (existingAlert) {
        const { error: updateError } = await supabase
          .from("billing_audit_alerts")
          .update(alertPayload)
          .eq("id", existingAlert.id);
        if (updateError) {
          console.error("Billing audit alert update error", { paymentId: payment.id, issueType, updateError });
          continue;
        }
      } else {
        const { data: insertedAlert, error: insertError } = await supabase
          .from("billing_audit_alerts")
          .insert({ ...alertPayload, status: "open" })
          .select("id, status, alert_sent_at")
          .single();
        if (insertError) {
          console.error("Billing audit alert insert error", { paymentId: payment.id, issueType, insertError });
          continue;
        }
        alertRecord = insertedAlert;
      }

      if (alertRecord?.status === "open" && !alertRecord.alert_sent_at) {
        try {
          await sendAlertEmail({ resendApiKey, resendFrom, issueType, payment, productType });
          await supabase
            .from("billing_audit_alerts")
            .update({ alert_sent_at: new Date().toISOString() })
            .eq("id", alertRecord.id);
        } catch (emailError) {
          console.error("Billing audit alert email error", { paymentId: payment.id, issueType, emailError });
        }
      }

      alerts.push({ paymentId: payment.id, issueType });
    }

    return new Response(JSON.stringify({
      success: true,
      scanned: payments.length,
      candidates: candidates.length,
      alertsCreatedOrUpdated: alerts.length,
      alerts,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("audit-square-billing error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
