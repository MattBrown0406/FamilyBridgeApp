import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SendFamilyInviteSmsRequest {
  recipientPhone: string;
  recipientName: string;
  familyName: string;
  inviteCode: string;
  organizationName: string;
  intendedRole?: string;
  familyId?: string;
}

const ROLE_LABELS: Record<string, string> = {
  member: 'Family Member',
  recovering: 'Person in Recovery',
  dad: 'Dad',
  mom: 'Mom',
  husband: 'Husband',
  wife: 'Wife',
  brother: 'Brother',
  sister: 'Sister',
  friend: 'Friend',
  employer: 'Employer',
  moderator: 'Moderator',
  admin: 'Admin',
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhone = Deno.env.get("TWILIO_PHONE_NUMBER");

    if (!accountSid || !authToken || !twilioPhone) {
      console.error("Missing Twilio credentials");
      return new Response(
        JSON.stringify({ error: "SMS service not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { 
      recipientPhone, 
      recipientName, 
      familyName, 
      inviteCode, 
      organizationName,
      intendedRole,
      familyId
    }: SendFamilyInviteSmsRequest = await req.json();

    if (!recipientPhone || !recipientName || !familyName || !inviteCode) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Store pending invite role if familyId and intendedRole are provided
    if (familyId && intendedRole) {
      const url = Deno.env.get("SUPABASE_URL");
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      
      if (url && serviceKey) {
        const supabaseAdmin = createClient(url, serviceKey);
        
        // For SMS invites, we use the phone number as identifier
        const { error: upsertError } = await supabaseAdmin
          .from("pending_invite_roles")
          .upsert({
            family_id: familyId,
            invite_code: inviteCode.toLowerCase(),
            email: `sms:${recipientPhone.replace(/\D/g, '')}`,
            intended_role: intendedRole,
            used_at: null,
          }, {
            onConflict: 'family_id,email',
            ignoreDuplicates: false,
          });
        
        if (upsertError) {
          console.error("Error storing pending invite role:", upsertError);
        } else {
          console.log(`Stored pending role ${intendedRole} for SMS ${recipientPhone}`);
        }
      }
    }

    const appUrl = 'https://familybridgeapp.com';
    const joinUrl = `${appUrl}/auth?mode=signup&familyInvite=${encodeURIComponent(inviteCode)}`;
    const roleLabel = intendedRole ? ROLE_LABELS[intendedRole] || intendedRole : 'Family Member';

    const messageBody = `Hi ${recipientName}! You've been invited to join "${familyName}" on FamilyBridge as a ${roleLabel}. Your invite code is: ${inviteCode}\n\nJoin here: ${joinUrl}\n\n- ${organizationName}`;

    // Send SMS via Twilio
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const credentials = btoa(`${accountSid}:${authToken}`);

    const formData = new URLSearchParams();
    formData.append('To', recipientPhone);
    formData.append('From', twilioPhone);
    formData.append('Body', messageBody);

    const twilioResponse = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const twilioResult = await twilioResponse.json();

    if (!twilioResponse.ok) {
      console.error("Twilio error:", twilioResult);
      return new Response(
        JSON.stringify({ error: twilioResult.message || "Failed to send SMS" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("SMS sent successfully:", twilioResult.sid);

    return new Response(JSON.stringify({ success: true, messageSid: twilioResult.sid }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-family-invite-sms function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
