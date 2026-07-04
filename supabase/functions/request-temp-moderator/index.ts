import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";
import {
  getLatestRevenueCatNonSubscriptionPurchase,
  getRevenueCatSubscriber,
} from "../_shared/revenuecat.ts";


const GUIDANCE_WINDOW_PRODUCT_ID = "com.familybridgeapp.app.crisis_moderation_daily";
const REVENUECAT_PURCHASE_LOOKBACK_HOURS = 24;

interface RequestBody {
  familyId: string;
  paidOverride?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the user from the auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error("Invalid user token");
    }

    const { familyId, paidOverride = false }: RequestBody = await req.json();

    if (!familyId) {
      throw new Error("Family ID is required");
    }

    // Verify user is a family member
    const { data: membership, error: membershipError } = await supabase
      .from("family_members")
      .select("id")
      .eq("family_id", familyId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (membershipError || !membership) {
      throw new Error("You are not a member of this family");
    }

    // Check if family has an organization (if so, they have a professional)
    const { data: family, error: familyError } = await supabase
      .from("families")
      .select("id, name, organization_id")
      .eq("id", familyId)
      .single();

    if (familyError || !family) {
      throw new Error("Family not found");
    }

    if (family.organization_id) {
      throw new Error("This family already has professional support");
    }

    // Check if there's an active request in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: existingRequest, error: existingError } = await supabase
      .from("temporary_moderator_requests")
      .select("id, created_at")
      .eq("family_id", familyId)
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingError) {
      console.error("Error checking existing requests:", existingError);
    }

    if (existingRequest && !paidOverride) {
      throw new Error("You have already used your included Professional Guidance Window this month. Additional windows must be purchased in the app.");
    }

    let revenueCatOrderId: string | null = null;

    if (paidOverride) {
      const purchaseCutoff = existingRequest?.created_at
        ? new Date(existingRequest.created_at)
        : new Date(Date.now() - REVENUECAT_PURCHASE_LOOKBACK_HOURS * 60 * 60 * 1000);

      const subscriber = await getRevenueCatSubscriber(user.id);
      const purchase = getLatestRevenueCatNonSubscriptionPurchase(
        subscriber,
        GUIDANCE_WINDOW_PRODUCT_ID,
        purchaseCutoff,
      );

      if (!purchase?.id) {
        throw new Error("We couldn't verify the App Store purchase yet. Please try again in a moment.");
      }

      revenueCatOrderId = `revenuecat:${purchase.id}`;

      const { data: usedPurchase, error: usedPurchaseError } = await supabase
        .from("paid_moderator_requests")
        .select("id")
        .eq("square_order_id", revenueCatOrderId)
        .maybeSingle();

      if (usedPurchaseError) {
        console.error("Error checking RevenueCat purchase usage:", usedPurchaseError);
        throw new Error("Unable to verify purchase status");
      }

      if (usedPurchase) {
        throw new Error("This App Store purchase has already been used for a guidance window.");
      }
    }

    // Get a moderator from Freedom Interventions organization
    const { data: freedomOrg, error: orgError } = await supabase
      .from("organizations")
      .select("id")
      .eq("name", "Freedom Interventions")
      .maybeSingle();

    if (orgError || !freedomOrg) {
      console.error("Freedom Interventions org not found:", orgError);
      throw new Error("No moderator service available");
    }

    // Get available moderators from Freedom Interventions
    const { data: orgMembers, error: membersError } = await supabase
      .from("organization_members")
      .select("user_id, role")
      .eq("organization_id", freedomOrg.id)
      .order("role", { ascending: true }); // owners first, then admins, then staff

    if (membersError || !orgMembers || orgMembers.length === 0) {
      console.error("No moderators found in Freedom Interventions:", membersError);
      throw new Error("No moderator available");
    }

    // Select the first available moderator (prioritizing owners/admins)
    const moderatorUserId = orgMembers[0].user_id;
    
    // Get moderator email for notification
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    const moderator = authUsers.users.find(u => u.id === moderatorUserId);
    
    if (!moderator) {
      throw new Error("No moderator available");
    }

    const moderatorEmail = moderator.email;

    // Get requester's profile for the email
    const { data: requesterProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    // Create the temporary moderator request
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    if (revenueCatOrderId) {
      const { error: paidRequestError } = await supabase
        .from("paid_moderator_requests")
        .insert({
          family_id: familyId,
          requested_by: user.id,
          assigned_moderator_id: moderator.id,
          status: "active",
          hours_purchased: 24,
          amount_paid: 399,
          square_order_id: revenueCatOrderId,
          payment_completed_at: new Date().toISOString(),
          activated_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
        });

      if (paidRequestError) {
        console.error("Error recording RevenueCat guidance purchase:", paidRequestError);
        throw new Error("Failed to record App Store purchase");
      }
    }

    const { data: newRequest, error: insertError } = await supabase
      .from("temporary_moderator_requests")
      .insert({
        family_id: familyId,
        requested_by: user.id,
        assigned_moderator_id: moderator.id,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      throw new Error("Failed to create request");
    }

    // Add moderator as a temporary member of the family
    const { error: memberError } = await supabase
      .from("family_members")
      .insert({
        family_id: familyId,
        user_id: moderator.id,
        role: "moderator",
        relationship_type: "other",
      });

    if (memberError && memberError.code !== "23505") { // Ignore if already a member
      console.error("Error adding moderator to family:", memberError);
    }

    // Send notification email if Resend is configured
    if (resendApiKey && moderatorEmail) {
      try {
        const resend = new Resend(resendApiKey);
        const emailResponse = await resend.emails.send({
          from: "FamilyBridge <noreply@familybridgeapp.com>",
          to: [moderatorEmail],
          subject: "🚨 Professional Guidance Window Requested",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="text-align: center; margin-bottom: 20px;">
                <img src="https://familybridgeapp.com/og-image.png" alt="FamilyBridge" style="max-width: 180px; height: auto;" />
              </div>
              <h1 style="color: #7c3aed;">Professional Guidance Window Assignment</h1>
              <p>You have been assigned to support a family during a 24-hour Professional Guidance Window.</p>
              
              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Family:</strong> ${family.name}</p>
                <p><strong>Requested by:</strong> ${requesterProfile?.full_name || user.email}</p>
                <p><strong>Duration:</strong> 24 hours</p>
                <p><strong>Expires at:</strong> ${expiresAt.toLocaleString()}</p>
              </div>
              
              <p>Please log in to FamilyBridge to view the family and provide support.</p>
              
              <p style="margin-top: 30px; margin-bottom: 5px;">Thank you,</p>
              <p style="font-weight: bold; margin-top: 0;">Matt Brown, Creator of Family Bridge</p>
            </div>
          `,
        });
        console.log("Email sent:", emailResponse);
      } catch (emailError) {
        console.error("Error sending email:", emailError);
      }
    } else {
      console.log("RESEND_API_KEY not configured, skipping email");
    }

    // Create notification for the moderator
    await supabase
      .from("notifications")
      .insert({
        user_id: moderator.id,
        family_id: familyId,
        type: "temp_moderator_assigned",
        title: "Professional Guidance Window Assignment",
        body: `You have been assigned to ${family.name} for a 24-hour Professional Guidance Window.`,
        related_id: newRequest.id,
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        expiresAt: expiresAt.toISOString(),
        message: "Professional Guidance Window has been assigned" 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in request-temp-moderator:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
