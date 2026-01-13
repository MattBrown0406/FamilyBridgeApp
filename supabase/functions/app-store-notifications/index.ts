import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Apple notification types
type AppleNotificationType = 
  | "SUBSCRIBED"
  | "DID_RENEW"
  | "DID_CHANGE_RENEWAL_STATUS"
  | "DID_FAIL_TO_RENEW"
  | "EXPIRED"
  | "GRACE_PERIOD_EXPIRED"
  | "REFUND"
  | "REVOKE"
  | "CONSUMPTION_REQUEST";

// Google notification types
type GoogleNotificationType = 
  | "SUBSCRIPTION_RECOVERED"
  | "SUBSCRIPTION_RENEWED"
  | "SUBSCRIPTION_CANCELED"
  | "SUBSCRIPTION_PURCHASED"
  | "SUBSCRIPTION_ON_HOLD"
  | "SUBSCRIPTION_IN_GRACE_PERIOD"
  | "SUBSCRIPTION_RESTARTED"
  | "SUBSCRIPTION_PRICE_CHANGE_CONFIRMED"
  | "SUBSCRIPTION_DEFERRED"
  | "SUBSCRIPTION_PAUSED"
  | "SUBSCRIPTION_PAUSE_SCHEDULE_CHANGED"
  | "SUBSCRIPTION_REVOKED"
  | "SUBSCRIPTION_EXPIRED";

interface AppleNotification {
  notificationType: AppleNotificationType;
  subtype?: string;
  notificationUUID: string;
  data: {
    appAppleId: number;
    bundleId: string;
    bundleVersion: string;
    environment: "Sandbox" | "Production";
    signedTransactionInfo: string;
    signedRenewalInfo?: string;
  };
  version: string;
  signedDate: number;
}

interface GoogleNotification {
  version: string;
  packageName: string;
  eventTimeMillis: string;
  subscriptionNotification?: {
    version: string;
    notificationType: number;
    purchaseToken: string;
    subscriptionId: string;
  };
  testNotification?: {
    version: string;
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const platform = url.pathname.includes("/apple") ? "apple" : 
                   url.pathname.includes("/google") ? "google" : 
                   null;

  console.log(`Received ${platform} notification webhook`);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (platform === "apple") {
      return await handleAppleNotification(req, supabase);
    } else if (platform === "google") {
      return await handleGoogleNotification(req, supabase);
    } else {
      // Try to detect platform from payload
      const body = await req.json();
      
      if (body.signedPayload || body.notificationType) {
        return await handleAppleNotification(req, supabase, body);
      } else if (body.subscriptionNotification || body.packageName) {
        return await handleGoogleNotification(req, supabase, body);
      }

      return new Response(
        JSON.stringify({ error: "Unknown notification format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Error processing notification:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function handleAppleNotification(
  req: Request, 
  supabase: any,
  preloadedBody?: any
): Promise<Response> {
  try {
    const body = preloadedBody || await req.json();
    
    console.log("Apple notification received:", JSON.stringify(body, null, 2));

    // Apple sends a signed payload that we need to decode
    const signedPayload = body.signedPayload;
    
    if (!signedPayload) {
      console.log("No signedPayload in Apple notification, might be a test");
      return new Response(
        JSON.stringify({ received: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Decode the JWS (JSON Web Signature)
    // In production, you'd verify the signature using Apple's public key
    const parts = signedPayload.split(".");
    if (parts.length !== 3) {
      console.error("Invalid JWS format");
      return new Response(
        JSON.stringify({ error: "Invalid JWS format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Decode the payload (middle part)
    const payloadBase64 = parts[1];
    const payloadJson = atob(payloadBase64.replace(/-/g, "+").replace(/_/g, "/"));
    const notification: AppleNotification = JSON.parse(payloadJson);

    console.log("Decoded Apple notification:", notification.notificationType);

    // Handle different notification types
    switch (notification.notificationType) {
      case "SUBSCRIBED":
        console.log("New subscription started");
        // Could create a new activation code or update user status
        break;

      case "DID_RENEW":
        console.log("Subscription renewed");
        // Update subscription expiration date
        break;

      case "DID_FAIL_TO_RENEW":
        console.log("Subscription failed to renew");
        // Notify user, maybe downgrade access
        break;

      case "EXPIRED":
        console.log("Subscription expired");
        // Revoke access
        break;

      case "REFUND":
        console.log("Refund processed");
        // Revoke access and mark code as invalid
        break;

      case "REVOKE":
        console.log("Access revoked");
        // Immediate access revocation
        break;

      default:
        console.log("Unhandled notification type:", notification.notificationType);
    }

    // Log the notification for audit purposes
    await logNotification(supabase, "apple", notification.notificationType, body);

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error handling Apple notification:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process notification" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

async function handleGoogleNotification(
  req: Request, 
  supabase: any,
  preloadedBody?: any
): Promise<Response> {
  try {
    const body = preloadedBody || await req.json();
    
    console.log("Google notification received:", JSON.stringify(body, null, 2));

    // Handle test notifications
    if (body.testNotification) {
      console.log("Google test notification received");
      return new Response(
        JSON.stringify({ received: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const subscriptionNotification = body.subscriptionNotification;
    if (!subscriptionNotification) {
      console.log("No subscriptionNotification in Google notification");
      return new Response(
        JSON.stringify({ received: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const notificationType = subscriptionNotification.notificationType;
    const notificationTypeMap: Record<number, string> = {
      1: "SUBSCRIPTION_RECOVERED",
      2: "SUBSCRIPTION_RENEWED",
      3: "SUBSCRIPTION_CANCELED",
      4: "SUBSCRIPTION_PURCHASED",
      5: "SUBSCRIPTION_ON_HOLD",
      6: "SUBSCRIPTION_IN_GRACE_PERIOD",
      7: "SUBSCRIPTION_RESTARTED",
      8: "SUBSCRIPTION_PRICE_CHANGE_CONFIRMED",
      9: "SUBSCRIPTION_DEFERRED",
      10: "SUBSCRIPTION_PAUSED",
      11: "SUBSCRIPTION_PAUSE_SCHEDULE_CHANGED",
      12: "SUBSCRIPTION_REVOKED",
      13: "SUBSCRIPTION_EXPIRED",
    };

    const notificationName = notificationTypeMap[notificationType] || `UNKNOWN_${notificationType}`;
    console.log("Google notification type:", notificationName);

    // Handle different notification types
    switch (notificationType) {
      case 4: // SUBSCRIPTION_PURCHASED
        console.log("New subscription purchased");
        break;

      case 2: // SUBSCRIPTION_RENEWED
        console.log("Subscription renewed");
        break;

      case 3: // SUBSCRIPTION_CANCELED
        console.log("Subscription canceled");
        break;

      case 12: // SUBSCRIPTION_REVOKED
        console.log("Subscription revoked");
        break;

      case 13: // SUBSCRIPTION_EXPIRED
        console.log("Subscription expired");
        break;

      default:
        console.log("Unhandled Google notification type:", notificationType);
    }

    // Log the notification for audit purposes
    await logNotification(supabase, "google", notificationName, body);

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error handling Google notification:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process notification" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

async function logNotification(
  supabase: any, 
  platform: string, 
  notificationType: string, 
  payload: any
): Promise<void> {
  try {
    // Log to activation_code_audit_log for now
    // In production, you might want a dedicated notifications log table
    await supabase.from("activation_code_audit_log").insert({
      action: `${platform}_notification_${notificationType.toLowerCase()}`,
      details: {
        platform,
        notificationType,
        timestamp: new Date().toISOString(),
        // Don't log sensitive payload data
        received: true,
      },
    });
  } catch (error) {
    console.error("Failed to log notification:", error);
    // Don't throw - logging failure shouldn't break notification handling
  }
}
