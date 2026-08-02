import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getRevenueCatSubscriber, hasActiveRevenueCatEntitlement } from "../_shared/revenuecat.ts";


type CreateOrgBody = {
  subdomain: string;
  name: string;
  tagline?: string;
  support_email?: string;
  website_url?: string;
  phone?: string;
  logo_url?: string;
  favicon_url?: string;
  primary_color?: string;
  primary_foreground_color?: string;
  secondary_color?: string;
  accent_color?: string;
  background_color?: string;
  foreground_color?: string;
  heading_font?: string;
  body_font?: string;
  provider_category?: string | null;
  levels_of_care?: string[];
  primary_service_duration_days?: number | null;
  outcome_tracking_enabled?: boolean;
  intervention_tracking_enabled?: boolean;
  benchmark_opt_in?: boolean;
  intake_notes?: string | null;
  useRevenueCatEntitlement?: boolean;
};

const PROVIDER_ENTITLEMENT_ID = "fiis_provider";

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // User client (verifies JWT)
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });

    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      console.error("Auth getUser error:", userErr);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;

    const body = (await req.json()) as CreateOrgBody;
    if (!body?.name || !body?.subdomain) {
      return new Response(JSON.stringify({ error: "Name and subdomain are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { useRevenueCatEntitlement, ...organizationPayload } = body;

    // Service client (writes)
    const service = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    if (useRevenueCatEntitlement) {
      const subscriber = await getRevenueCatSubscriber(userId);
      const hasProviderEntitlement = hasActiveRevenueCatEntitlement(subscriber, PROVIDER_ENTITLEMENT_ID);

      if (!hasProviderEntitlement) {
        return new Response(JSON.stringify({ error: "No active FIIS Provider subscription was found for this account" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      const { data: usedActivationCode, error: activationError } = await service
        .from("activation_codes")
        .select("id")
        .eq("used_by", userId)
        .eq("is_used", true)
        .limit(1)
        .maybeSingle();

      if (activationError) {
        console.error("Activation code access check error:", activationError);
        return new Response(JSON.stringify({ error: "Unable to verify provider activation" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!usedActivationCode) {
        return new Response(JSON.stringify({ error: "Provider activation or an active FIIS Provider subscription is required" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const { data: org, error: insertErr } = await service
      .from("organizations")
      .insert({
        ...organizationPayload,
        created_by: userId,
      })
      .select("*")
      .single();

    if (insertErr) {
      console.error("Create org insert error:", insertErr);
      return new Response(JSON.stringify({ error: insertErr.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user email for Mailchimp
    const userEmail = userData.user.email;

    // Add provider admin to Mailchimp provider list
    const mailchimpApiKey = Deno.env.get("MAILCHIMP_API_KEY");
    const mailchimpProviderListId = Deno.env.get("MAILCHIMP_PROVIDER_LIST_ID");
    const mailchimpServerPrefix = Deno.env.get("MAILCHIMP_SERVER_PREFIX");
    
    if (mailchimpApiKey && mailchimpProviderListId && mailchimpServerPrefix && userEmail) {
      try {
        const mailchimpUrl = `https://${mailchimpServerPrefix}.api.mailchimp.com/3.0/lists/${mailchimpProviderListId}/members`;
        const mailchimpResponse = await fetch(mailchimpUrl, {
          method: "POST",
          headers: {
            "Authorization": `Basic ${btoa(`anystring:${mailchimpApiKey}`)}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email_address: userEmail,
            status: "subscribed",
            tags: ["provider-admin", "owner"],
            merge_fields: {
              ORG: org.name,
              ROLE: "owner",
            },
          }),
        });
        
        const mailchimpData = await mailchimpResponse.json();
        if (mailchimpData.title === "Member Exists") {
          console.log("Email already subscribed to Mailchimp provider list");
        } else if (!mailchimpResponse.ok) {
          console.error("Mailchimp error:", mailchimpData);
        } else {
          console.log("Successfully added provider admin to Mailchimp:", userEmail);
        }
      } catch (e) {
        console.error("Failed to add to Mailchimp:", e);
      }
    }

    // Bind pending external invitations to the newly registered organization.
    // Registration never transfers a family or creates/accepts a handoff. The
    // referring provider must create a recipient-specific handoff and the named
    // transition subject must authorize it through the audited RPC lifecycle.
    if (userEmail) {
      try {
        const normalizedEmail = userEmail.trim().toLowerCase();
        const { error: inviteBindError } = await service
          .from("org_transfer_invites")
          .update({
            status: "registered",
            linked_organization_id: org.id,
            linked_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("contact_email", normalizedEmail)
          .eq("status", "sent")
          .gt("expires_at", new Date().toISOString());
        if (inviteBindError) console.error("External invitation binding failed:", inviteBindError);
      } catch (inviteBindError) {
        console.error("External invitation binding failed (non-fatal):", inviteBindError);
      }
    }

    return new Response(JSON.stringify({ organization: org, invitations_registered: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("create-organization error:", e);
    const message = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
