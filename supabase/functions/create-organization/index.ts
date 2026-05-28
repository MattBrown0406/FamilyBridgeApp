import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getRevenueCatSubscriber, hasActiveRevenueCatEntitlement } from "../_shared/revenuecat.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    // ----------------------------------------------------------------
    // AUTO-LINK PENDING ORG TRANSFER INVITES
    // If someone sent a transfer invite to this email before the program
    // was on FamilyBridge, execute those transfers now automatically.
    // ----------------------------------------------------------------
    if (userEmail) {
      try {
        const normalizedEmail = userEmail.trim().toLowerCase();

        // Find all pending invites sent to this email that haven't expired
        const { data: pendingInvites, error: invitesFetchErr } = await service
          .from("org_transfer_invites")
          .select("*")
          .eq("contact_email", normalizedEmail)
          .eq("status", "sent")
          .gt("expires_at", new Date().toISOString());

        if (invitesFetchErr) {
          console.error("Error fetching pending transfer invites:", invitesFetchErr);
        } else if (pendingInvites && pendingInvites.length > 0) {
          console.log(`Found ${pendingInvites.length} pending transfer invite(s) for ${normalizedEmail}`);

          for (const invite of pendingInvites) {
            try {
              // 1. Create a provider_handoff record marked as already accepted
              //    (no two-party wait needed — the new org owner IS accepting by registering)
              const { data: handoff, error: handoffErr } = await service
                .from("provider_handoffs")
                .insert({
                  user_id: userId, // owner of the new org as placeholder — no recovering member yet
                  family_id: invite.family_id,
                  from_organization_id: invite.from_organization_id,
                  to_organization_id: org.id,
                  initiated_by: invite.invited_by,
                  accepted_by: userId,
                  accepted_at: new Date().toISOString(),
                  status: "accepted",
                  sobriety_days_at_handoff: 0,
                  handoff_notes: invite.invite_message || null,
                  transfer_reason: invite.transfer_reason || null,
                  transfer_reason_notes: invite.transfer_reason_notes || null,
                  referring_user_remains_co_mod: invite.referring_user_remains_co_mod,
                })
                .select("id")
                .single();

              if (handoffErr) {
                console.error(`Handoff insert error for invite ${invite.id}:`, handoffErr);
                continue;
              }

              // 2. Transfer the family to the new org
              const { error: familyUpdateErr } = await service
                .from("families")
                .update({ organization_id: org.id })
                .eq("id", invite.family_id);

              if (familyUpdateErr) {
                console.error(`Family transfer error for invite ${invite.id}:`, familyUpdateErr);
                continue;
              }

              // 3. If referring user wants to stay as co-moderator, add them
              if (invite.referring_user_remains_co_mod) {
                // Add to family_co_moderators
                await service.from("family_co_moderators").upsert({
                  family_id: invite.family_id,
                  user_id: invite.invited_by,
                  granted_by: userId,
                  handoff_id: handoff?.id || null,
                  referring_organization_id: invite.from_organization_id,
                  display_label: "Co-Moderator",
                  is_active: true,
                }, { onConflict: "family_id,user_id" });

                // Add/update family_members row with co_moderator role
                await service.from("family_members").upsert({
                  family_id: invite.family_id,
                  user_id: invite.invited_by,
                  role: "co_moderator",
                }, { onConflict: "family_id,user_id" });
              }

              // 4. Mark the invite as linked
              await service
                .from("org_transfer_invites")
                .update({
                  status: "linked",
                  linked_organization_id: org.id,
                  linked_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                })
                .eq("id", invite.id);

              // 5. Notify the referrer that the transfer completed
              await service.from("notifications").insert({
                user_id: invite.invited_by,
                family_id: invite.family_id,
                type: "handoff_accepted",
                title: "Transfer Complete ✓",
                body: `${org.name} registered on FamilyBridge and accepted the transfer of your family group. ${invite.referring_user_remains_co_mod ? "You've been added as co-moderator." : ""}`,
                related_id: handoff?.id || null,
              });

              // 6. Notify the new org owner (in-app confirmation)
              await service.from("notifications").insert({
                user_id: userId,
                family_id: invite.family_id,
                type: "handoff_accepted",
                title: "Family Group Transferred to You",
                body: `A family group was waiting for your organization to join FamilyBridge. It's now in your Moderator Dashboard.`,
                related_id: handoff?.id || null,
              });

              console.log(`Successfully auto-linked transfer invite ${invite.id} → org ${org.id}`);
            } catch (inviteErr) {
              console.error(`Error processing invite ${invite.id}:`, inviteErr);
              // Continue processing other invites — don't block org creation
            }
          }
        }
      } catch (inviteLinkErr) {
        // Non-fatal — org was created successfully, invite linking is best-effort
        console.error("Error in invite auto-link phase (non-fatal):", inviteLinkErr);
      }
    }
    // ----------------------------------------------------------------

    return new Response(JSON.stringify({ organization: org, invites_linked: true }), {
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
