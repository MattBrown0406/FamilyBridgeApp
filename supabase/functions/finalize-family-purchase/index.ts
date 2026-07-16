import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { enqueueSpineEvent } from "../_shared/spine.ts";


const FAMILY_PLAN_ID = "GEMWDEES3W2AVLKCHDOZESQF";

function generateActivationCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
    if (i === 3 || i === 7) result += "-";
  }
  return result;
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

interface Body { orderId: string; email: string; }

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));

  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const squareAccessToken = Deno.env.get("SQUARE_ACCESS_TOKEN");
    if (!squareAccessToken) throw new Error("Square credentials not configured");

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const resendFrom = Deno.env.get("RESEND_FROM") || "FamilyBridge <noreply@familybridgeapp.com>";

    const { orderId, email }: Body = await req.json();
    const normalizedOrderId = (orderId || "").trim();
    const normalizedEmail = (email || "").trim().toLowerCase();
    if (!normalizedOrderId) throw new Error("orderId is required");
    if (!normalizedEmail) throw new Error("email is required");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const purchaseRefHash = await sha256Hex(normalizedOrderId);

    // Idempotency
    const { data: existing } = await supabase
      .from("activation_codes")
      .select("code")
      .eq("purchase_ref_hash", purchaseRefHash)
      .maybeSingle();
    if (existing?.code) {
      return new Response(
        JSON.stringify({ success: true, inviteCode: existing.code, alreadyIssued: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Step A: Look up the Order to get its tenders/payments. The Orders API gives
    // us a definitive payment list scoped to THIS order (unlike the Payments
    // search which can return unrelated historical results).
    const orderRes = await fetch(`https://connect.squareup.com/v2/orders/${encodeURIComponent(normalizedOrderId)}`, {
      headers: {
        "Square-Version": "2024-01-18",
        Authorization: `Bearer ${squareAccessToken}`,
      },
    });
    const orderJson = await orderRes.json();
    if (!orderRes.ok || orderJson?.errors) {
      console.error("Square order lookup error:", orderJson);
      return new Response(JSON.stringify({
        success: false,
        error: "Could not look up your order. Please try again in a moment.",
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const order = orderJson.order;
    const tenders: any[] = order?.tenders || [];
    const orderState: string = order?.state;

    // Square Checkout Payment Links can leave the Order in OPEN state even after
    // the card tender/payment is captured. Treat the underlying Payment record as
    // the source of truth; only block when the order has no tender/payment yet.
    if (tenders.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: "Payment has not been completed yet. If you just paid, please wait a few seconds and retry.",
        diagnostics: { orderState, tenderCount: tenders.length },
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Step B: Verify the underlying payment is COMPLETED and card-backed
    const completedTender = tenders.find((tender: any) => tender?.payment_id && tender?.card_details?.status === "CAPTURED") || tenders.find((tender: any) => tender?.payment_id);
    const paymentId = completedTender?.payment_id;
    if (!paymentId) {
      return new Response(JSON.stringify({
        success: false, error: "Order has no payment record yet.",
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const payRes = await fetch(`https://connect.squareup.com/v2/payments/${paymentId}`, {
      headers: {
        "Square-Version": "2024-01-18",
        Authorization: `Bearer ${squareAccessToken}`,
      },
    });
    const payJson = await payRes.json();
    const payment = payJson.payment;
    if (!payment || payment.status !== "COMPLETED") {
      return new Response(JSON.stringify({
        success: false,
        error: `Payment is not complete (status: ${payment?.status || "unknown"}).`,
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const customerId: string | undefined = payment.customer_id;
    if (!customerId) {
      console.error("Payment has no customer_id; cannot attach recurring subscription", paymentId);
      return new Response(JSON.stringify({
        success: false,
        error: "Payment captured, but customer record is missing. Please contact support.",
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Step C: Save the card-on-file from this payment so we can attach it to the subscription
    let cardId: string | null = null;
    try {
      const cardBody = {
        idempotency_key: crypto.randomUUID(),
        source_id: paymentId,
        card: { customer_id: customerId },
      };
      const cardRes = await fetch("https://connect.squareup.com/v2/cards", {
        method: "POST",
        headers: {
          "Square-Version": "2024-01-18",
          Authorization: `Bearer ${squareAccessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cardBody),
      });
      const cardJson = await cardRes.json();
      if (cardJson.errors) {
        console.error("Failed to save card on file:", cardJson.errors);
      } else {
        cardId = cardJson.card?.id || null;
        console.log("Saved card on file:", cardId);
      }
    } catch (e) {
      console.error("Card save error:", e);
    }

    // Step D: Create the recurring subscription, starting NEXT month (today is month 1, already paid).
    let subscriptionId: string | null = null;
    if (cardId) {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() + 1);
      const subBody: any = {
        idempotency_key: crypto.randomUUID(),
        location_id: payment.location_id,
        plan_variation_id: FAMILY_PLAN_ID,
        customer_id: customerId,
        card_id: cardId,
        start_date: startDate.toISOString().split("T")[0],
      };
      try {
        const subRes = await fetch("https://connect.squareup.com/v2/subscriptions", {
          method: "POST",
          headers: {
            "Square-Version": "2024-01-18",
            Authorization: `Bearer ${squareAccessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(subBody),
        });
        const subJson = await subRes.json();
        if (subJson.errors) {
          console.error("Failed to create recurring subscription:", subJson.errors);
        } else {
          subscriptionId = subJson.subscription?.id || null;
          console.log("Created recurring subscription:", subscriptionId);
        }
      } catch (e) {
        console.error("Subscription create error:", e);
      }
    } else {
      console.warn("Skipping recurring subscription creation — no card-on-file");
    }

    // Step E: Issue activation code
    const inviteCode = generateActivationCode();
    const { data: emailEncrypted } = await supabase.rpc("encrypt_sensitive", { plain_text: normalizedEmail });
    const { data: purchaseEncrypted } = await supabase.rpc("encrypt_sensitive", { plain_text: normalizedOrderId });
    const { data: customerEncrypted } = await supabase.rpc("encrypt_sensitive", { plain_text: customerId });
    const { data: subEncrypted } = subscriptionId
      ? await supabase.rpc("encrypt_sensitive", { plain_text: subscriptionId })
      : { data: null };
    const customerHash = await sha256Hex(customerId);

    const { error: insertError } = await supabase.from("activation_codes").insert({
      code: inviteCode,
      email_encrypted: emailEncrypted,
      purchase_ref_encrypted: purchaseEncrypted,
      purchase_ref_hash: purchaseRefHash,
      square_customer_id_encrypted: customerEncrypted,
      square_customer_id_hash: customerHash,
      square_subscription_id_encrypted: subEncrypted,
      expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      is_used: false,
    });
    if (insertError) {
      console.error("Error inserting activation code:", insertError);
      throw new Error("Failed to create invite code");
    }

    // Best-effort email
    if (resendApiKey) {
      try {
        const appUrl = "https://familybridgeapp.com";
        const setupUrl = `${appUrl}/family-setup?inviteCode=${encodeURIComponent(inviteCode)}`;
        const resend = new Resend(resendApiKey);
        await resend.emails.send({
          from: resendFrom,
          to: [normalizedEmail],
          subject: "Your FamilyBridge Invite Code",
          html: `<p>Your FamilyBridge subscription is active. Invite code: <b>${inviteCode}</b></p>
                 <p><a href="${setupUrl}">Set up your family group</a></p>`,
        });
      } catch (e) { console.error("Email send error:", e); }
    }

    await enqueueSpineEvent("payment", {
      email: normalizedEmail,
      payment: {
        id: paymentId,
        processor: "square",
        amount_cents: payment.amount_money?.amount ?? 0,
        kind: "family_subscription",
      },
    }, supabase);

    return new Response(JSON.stringify({
      success: true,
      inviteCode,
      subscriptionId,
      cardSaved: !!cardId,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("finalize-family-purchase error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
