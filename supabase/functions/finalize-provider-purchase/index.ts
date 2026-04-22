import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Provider plan variation IDs (STATIC pricing). Must stay in sync with
// create-square-checkout and src/lib/products.ts.
const PROVIDER_PLAN_IDS: Record<string, string> = {
  monthly: "BBC2S6S42PUSEC5E4TARE5SK",
  quarterly: "HCBQIKP5PX4OMSFTAS35XDLU",
  annual: "UQO7ZIJKHHBA377GMRNXEM4I",
};

// How far ahead to start the recurring subscription (today is period 1, already paid).
const PROVIDER_NEXT_START_OFFSET: Record<string, () => Date> = {
  monthly: () => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d;
  },
  quarterly: () => {
    const d = new Date();
    d.setMonth(d.getMonth() + 3);
    return d;
  },
  annual: () => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d;
  },
};

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

interface Body {
  orderId: string;
  email: string;
  billingPeriod?: "monthly" | "quarterly" | "annual";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const squareAccessToken = Deno.env.get("SQUARE_ACCESS_TOKEN");
    if (!squareAccessToken) throw new Error("Square credentials not configured");

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const resendFrom = Deno.env.get("RESEND_FROM") || "FamilyBridge <noreply@familybridgeapp.com>";

    const { orderId, email, billingPeriod = "monthly" }: Body = await req.json();
    const normalizedOrderId = (orderId || "").trim();
    const normalizedEmail = (email || "").trim().toLowerCase();
    const period = (billingPeriod || "monthly") as "monthly" | "quarterly" | "annual";
    const planId = PROVIDER_PLAN_IDS[period];
    const nextStartFn = PROVIDER_NEXT_START_OFFSET[period];

    if (!normalizedOrderId) throw new Error("orderId is required");
    if (!normalizedEmail) throw new Error("email is required");
    if (!planId || !nextStartFn) throw new Error(`Invalid billingPeriod: ${period}`);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const purchaseRefHash = await sha256Hex(normalizedOrderId);

    // Idempotency: if we already issued a code for this order, return it.
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

    // Step A: Look up the Order to verify state and get the payment id.
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

    if (orderState !== "COMPLETED" || tenders.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: "Payment has not been completed yet. If you just paid, please wait a few seconds and retry.",
        diagnostics: { orderState, tenderCount: tenders.length },
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Step B: Verify the underlying payment is COMPLETED.
    const paymentId = tenders[0]?.payment_id;
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
      console.error("Provider payment has no customer_id; cannot attach recurring subscription", paymentId);
      return new Response(JSON.stringify({
        success: false,
        error: "Payment captured, but customer record is missing. Please contact support.",
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Step C: Save the card-on-file from this payment.
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
        console.error("Failed to save provider card on file:", cardJson.errors);
      } else {
        cardId = cardJson.card?.id || null;
        console.log("Saved provider card on file:", cardId);
      }
    } catch (e) {
      console.error("Provider card save error:", e);
    }

    // Step D: Create the recurring subscription, starting at the NEXT period.
    let subscriptionId: string | null = null;
    if (cardId) {
      const startDate = nextStartFn();
      const subBody: any = {
        idempotency_key: crypto.randomUUID(),
        location_id: payment.location_id,
        plan_variation_id: planId,
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
          console.error("Failed to create provider recurring subscription:", subJson.errors);
        } else {
          subscriptionId = subJson.subscription?.id || null;
          console.log("Created provider recurring subscription:", subscriptionId);
        }
      } catch (e) {
        console.error("Provider subscription create error:", e);
      }
    } else {
      console.warn("Skipping provider recurring subscription creation — no card-on-file");
    }

    // Step E: Issue activation code (only after verified payment + subscription).
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
      console.error("Error inserting provider activation code:", insertError);
      throw new Error("Failed to create activation code");
    }

    // Best-effort email
    if (resendApiKey) {
      try {
        const appUrl = "https://familybridgeapp.com";
        const setupUrl = `${appUrl}/provider-admin?activationCode=${encodeURIComponent(inviteCode)}`;
        const resend = new Resend(resendApiKey);
        await resend.emails.send({
          from: resendFrom,
          to: [normalizedEmail],
          subject: "Your FamilyBridge Provider Activation Code",
          html: `<p>Your FamilyBridge Provider subscription is active. Activation code: <b>${inviteCode}</b></p>
                 <p><a href="${setupUrl}">Set up your provider organization</a></p>`,
        });
      } catch (e) { console.error("Provider email send error:", e); }
    }

    return new Response(JSON.stringify({
      success: true,
      inviteCode,
      subscriptionId,
      cardSaved: !!cardId,
      billingPeriod: period,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("finalize-provider-purchase error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});