import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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

interface FinalizeFamilyPurchaseBody {
  orderId: string;
  email: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const squareAccessToken = Deno.env.get("SQUARE_ACCESS_TOKEN");
    if (!squareAccessToken) throw new Error("Square credentials not configured");

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const resendFrom = Deno.env.get("RESEND_FROM") || "FamilyBridge <onboarding@resend.dev>";

    const { orderId, email }: FinalizeFamilyPurchaseBody = await req.json();

    const normalizedOrderId = (orderId || "").trim();
    const normalizedEmail = (email || "").trim().toLowerCase();

    if (!normalizedOrderId) throw new Error("orderId is required");
    if (!normalizedEmail) throw new Error("email is required");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Idempotency: if we've already issued a code for this order, return it.
    const purchaseRefHash = await sha256Hex(normalizedOrderId);
    const { data: existing, error: existingError } = await supabase
      .from("activation_codes")
      .select("code")
      .eq("purchase_ref_hash", purchaseRefHash)
      .maybeSingle();

    if (existingError) {
      console.error("Error checking existing activation code:", existingError);
      throw new Error("Failed to finalize purchase");
    }

    if (existing?.code) {
      return new Response(
        JSON.stringify({ success: true, inviteCode: existing.code, alreadyIssued: true }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Verify payment with Square (do not trust client redirect alone).
    const paymentsRes = await fetch(
      `https://connect.squareup.com/v2/payments?order_id=${encodeURIComponent(normalizedOrderId)}`,
      {
        method: "GET",
        headers: {
          "Square-Version": "2024-01-18",
          Authorization: `Bearer ${squareAccessToken}`,
          "Content-Type": "application/json",
        },
      },
    );

    const paymentsJson = await paymentsRes.json();

    if (!paymentsRes.ok || paymentsJson?.errors) {
      console.error("Square payments lookup error:", paymentsJson);
      throw new Error("Unable to verify payment. Please contact support.");
    }

    const payments = Array.isArray(paymentsJson?.payments) ? paymentsJson.payments : [];
    const hasCompletedPayment = payments.some((p: any) => p?.status === "COMPLETED");

    if (!hasCompletedPayment) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Payment not confirmed yet. Please wait a minute and try again.",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Create activation code
    const inviteCode = generateActivationCode();

    const { data: emailEncrypted, error: emailEncError } = await supabase.rpc(
      "encrypt_sensitive",
      { plain_text: normalizedEmail },
    );
    if (emailEncError) {
      console.error("Error encrypting email:", emailEncError);
      throw new Error("Failed to create invite code");
    }

    const { data: purchaseEncrypted, error: purchaseEncError } = await supabase.rpc(
      "encrypt_sensitive",
      { plain_text: normalizedOrderId },
    );
    if (purchaseEncError) {
      console.error("Error encrypting orderId:", purchaseEncError);
      throw new Error("Failed to create invite code");
    }

    const { error: insertError } = await supabase.from("activation_codes").insert({
      code: inviteCode,
      email_encrypted: emailEncrypted,
      purchase_ref_encrypted: purchaseEncrypted,
      purchase_ref_hash: purchaseRefHash,
      expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      is_used: false,
    });

    if (insertError) {
      console.error("Error inserting activation code:", insertError);
      throw new Error("Failed to create invite code");
    }

    // Best-effort email send (code is returned to UI regardless)
    if (resendApiKey) {
      try {
        const resend = new Resend(resendApiKey);
        await resend.emails.send({
          from: resendFrom,
          to: [normalizedEmail],
          subject: "Your FamilyBridge Invite Code",
          html: `
            <h1>Your FamilyBridge Invite Code</h1>
            <p>Thanks for subscribing. Use this code to create your family group:</p>
            <div style="background:#f4f4f4;padding:16px;border-radius:10px;text-align:center;margin:16px 0;">
              <div style="font-size:28px;font-family:monospace;font-weight:700;letter-spacing:3px;">${inviteCode}</div>
            </div>
            <p>If you didn\'t request this, you can ignore this email.</p>
          `,
        });
      } catch (e) {
        console.error("Failed to send invite code email:", e);
      }
    }

    // Add family subscriber to Mailchimp premium waitlist
    const mailchimpApiKey = Deno.env.get("MAILCHIMP_API_KEY");
    const mailchimpListId = Deno.env.get("MAILCHIMP_LIST_ID");
    const mailchimpServerPrefix = Deno.env.get("MAILCHIMP_SERVER_PREFIX");
    
    if (mailchimpApiKey && mailchimpListId && mailchimpServerPrefix) {
      try {
        const mailchimpUrl = `https://${mailchimpServerPrefix}.api.mailchimp.com/3.0/lists/${mailchimpListId}/members`;
        const mailchimpResponse = await fetch(mailchimpUrl, {
          method: "POST",
          headers: {
            "Authorization": `Basic ${btoa(`anystring:${mailchimpApiKey}`)}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email_address: normalizedEmail,
            status: "subscribed",
            tags: ["family-subscriber"],
            merge_fields: {
              SUBTYPE: "family",
            },
          }),
        });
        
        const mailchimpData = await mailchimpResponse.json();
        if (mailchimpData.title === "Member Exists") {
          console.log("Email already subscribed to Mailchimp");
        } else if (!mailchimpResponse.ok) {
          console.error("Mailchimp error:", mailchimpData);
        } else {
          console.log("Successfully added to Mailchimp:", normalizedEmail);
        }
      } catch (e) {
        console.error("Failed to add to Mailchimp:", e);
      }
    }

    return new Response(JSON.stringify({ success: true, inviteCode }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("finalize-family-purchase error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
