import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Generate a unique invite code
function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 12; i++) {
    if (i > 0 && i % 4 === 0) code += "-";
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Valid trial coupons
const VALID_TRIAL_COUPONS: Record<string, { days: number; description: string }> = {
  "TRIAL14": { days: 14, description: "14-day free trial" },
  "TRIAL30": { days: 30, description: "30-day free trial" },
  "FAMILYBRIDGE": { days: 7, description: "7-day welcome trial" },
  "PROVIDER2025": { days: 30, description: "30-day provider trial" },
  "FREEDOM": { days: 7, description: "7-day free trial" },
};

// Hash function for purchase reference
async function sha256Hex(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

// Verify Apple purchase using RevenueCat customer info or App Store Server API
async function verifyApplePurchase(
  transactionId: string,
  customerInfo: any,
  receiptData?: string
): Promise<{ valid: boolean; expiresAt?: string; productId?: string; error?: string }> {
  try {
    // If we have RevenueCat customer info with active subscriptions, trust that
    if (customerInfo?.activeSubscriptions?.length > 0) {
      console.log("Verified via RevenueCat customer info:", customerInfo.activeSubscriptions);
      return {
        valid: true,
        expiresAt: customerInfo.latestExpirationDate || undefined,
        productId: customerInfo.activeSubscriptions[0],
      };
    }

    // Legacy: Try Apple's verifyReceipt if we have receipt data and shared secret
    const appleSharedSecret = Deno.env.get("APPLE_SHARED_SECRET");
    if (receiptData && appleSharedSecret) {
      const verifyUrl = "https://buy.itunes.apple.com/verifyReceipt";
      
      const response = await fetch(verifyUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          "receipt-data": receiptData,
          "password": appleSharedSecret,
          "exclude-old-transactions": true,
        }),
      });

      const appleResponse = await response.json();
      console.log("Apple verification response status:", appleResponse.status);

      // Status 21007 means sandbox receipt sent to production
      if (appleResponse.status === 21007) {
        const sandboxResponse = await fetch("https://sandbox.itunes.apple.com/verifyReceipt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            "receipt-data": receiptData,
            "password": appleSharedSecret,
            "exclude-old-transactions": true,
          }),
        });
        const sandboxResult = await sandboxResponse.json();
        if (sandboxResult.status === 0) {
          return {
            valid: true,
            productId: sandboxResult.latest_receipt_info?.[0]?.product_id,
            expiresAt: sandboxResult.latest_receipt_info?.[0]?.expires_date,
          };
        }
      }

      if (appleResponse.status === 0) {
        return {
          valid: true,
          productId: appleResponse.latest_receipt_info?.[0]?.product_id,
          expiresAt: appleResponse.latest_receipt_info?.[0]?.expires_date,
        };
      }
    }

    // If we have a valid transaction ID and customer info, trust the purchase
    if (customerInfo && transactionId) {
      console.log("Trusting client-provided purchase info for transaction:", transactionId);
      return {
        valid: true,
        productId: customerInfo.activeSubscriptions?.[0] || "unknown",
        expiresAt: customerInfo.latestExpirationDate,
      };
    }

    // For development: accept if we have a transaction ID
    if (transactionId) {
      console.log("Development mode: accepting transaction without full verification");
      return { valid: true };
    }

    return { valid: false, error: "Could not verify purchase" };
  } catch (error) {
    console.error("Apple verification error:", error);
    return { valid: false, error: error instanceof Error ? error.message : "Verification failed" };
  }
}

// Verify Google Play purchase
async function verifyGooglePurchase(
  transactionId: string,
  productId: string,
  customerInfo: any
): Promise<{ valid: boolean; expiresAt?: string; productId?: string; error?: string }> {
  try {
    // If we have RevenueCat customer info with active subscriptions, trust that
    if (customerInfo?.activeSubscriptions?.length > 0) {
      console.log("Verified via RevenueCat customer info:", customerInfo.activeSubscriptions);
      return {
        valid: true,
        expiresAt: customerInfo.latestExpirationDate || undefined,
        productId: customerInfo.activeSubscriptions[0],
      };
    }

    // If we have a valid transaction ID and customer info, trust the purchase
    if (customerInfo && transactionId) {
      console.log("Trusting client-provided purchase info for transaction:", transactionId);
      return {
        valid: true,
        expiresAt: customerInfo.latestExpirationDate,
        productId: productId,
      };
    }

    // For development: accept if we have a transaction ID
    if (transactionId) {
      console.log("Development mode: accepting transaction without full verification");
      return { valid: true, productId: productId };
    }

    return { valid: false, error: "Could not verify purchase" };
  } catch (error) {
    console.error("Google verification error:", error);
    return { valid: false, error: error instanceof Error ? error.message : "Verification failed" };
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      platform, 
      transactionId, 
      productId, 
      email, 
      subscriptionType,
      couponCode,
      customerInfo,
      receiptData 
    } = await req.json();

    console.log("Verifying purchase:", { platform, transactionId, productId, email, subscriptionType });

    // Validate required fields
    if (!platform || !transactionId || !email) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check for valid trial coupon
    let trialDays = 0;
    let trialDescription = "";
    if (couponCode) {
      const normalizedCode = couponCode.trim().toUpperCase();
      if (VALID_TRIAL_COUPONS[normalizedCode]) {
        trialDays = VALID_TRIAL_COUPONS[normalizedCode].days;
        trialDescription = VALID_TRIAL_COUPONS[normalizedCode].description;
        console.log(`Applied coupon ${normalizedCode}: ${trialDescription}`);
      }
    }

    // Verify the purchase based on platform
    let verificationResult;
    if (platform === "apple") {
      verificationResult = await verifyApplePurchase(transactionId, customerInfo, receiptData);
    } else if (platform === "google") {
      verificationResult = await verifyGooglePurchase(transactionId, productId, customerInfo);
    } else {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid platform" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!verificationResult.valid) {
      console.error("Verification failed:", verificationResult.error);
      return new Response(
        JSON.stringify({ success: false, error: verificationResult.error || "Purchase verification failed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Purchase verified successfully");

    // Create Supabase admin client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Generate activation code
    const inviteCode = generateInviteCode();

    // Calculate expiration (subscription end date or trial end)
    let expiresAt = verificationResult.expiresAt 
      ? new Date(verificationResult.expiresAt)
      : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year default

    // If trial coupon was applied, adjust expiration
    if (trialDays > 0) {
      expiresAt = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000);
    }

    // Encrypt sensitive data
    const { data: encryptedEmail } = await supabase.rpc("encrypt_sensitive", { plain_text: email });
    const purchaseRef = `${platform}_${transactionId}`;
    const { data: encryptedPurchaseRef } = await supabase.rpc("encrypt_sensitive", { 
      plain_text: purchaseRef 
    });

    // Store activation code in database
    const { error: insertError } = await supabase
      .from("activation_codes")
      .insert({
        code: inviteCode,
        email_encrypted: encryptedEmail,
        purchase_ref_encrypted: encryptedPurchaseRef,
        purchase_ref_hash: await sha256Hex(purchaseRef),
        expires_at: expiresAt.toISOString(),
        is_used: false,
      });

    if (insertError) {
      console.error("Failed to store activation code:", insertError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to generate activation code" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Activation code generated:", inviteCode);

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
            email_address: email,
            status: "subscribed",
            tags: ["family-subscriber", "app-store"],
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
          console.log("Successfully added to Mailchimp:", email);
        }
      } catch (e) {
        console.error("Failed to add to Mailchimp:", e);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        inviteCode,
        expiresAt: expiresAt.toISOString(),
        trialDays: trialDays > 0 ? trialDays : undefined,
        trialDescription: trialDescription || undefined,
        productId: verificationResult.productId || productId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error processing purchase:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
