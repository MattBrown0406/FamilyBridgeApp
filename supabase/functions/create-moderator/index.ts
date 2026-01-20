import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateModeratorRequest {
  organizationId: string;
  email: string;
  fullName: string;
  role: 'admin' | 'staff';
  creatorName?: string;
  organizationName?: string;
  organizationLogo?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }

    // Create admin client for user creation
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Get the authorization header to verify the caller is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    // Verify the caller is authenticated and is an org admin
    const token = authHeader.replace("Bearer ", "");
    const { data: { user: callerUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !callerUser) {
      throw new Error("Unauthorized");
    }

    const { organizationId, email, fullName, role, creatorName, organizationName, organizationLogo }: CreateModeratorRequest = await req.json();

    if (!organizationId || !email || !fullName) {
      throw new Error("Missing required fields: organizationId, email, fullName");
    }

    // Verify caller is an admin/owner of the organization
    const { data: callerMembership, error: membershipError } = await supabaseAdmin
      .from("organization_members")
      .select("role")
      .eq("organization_id", organizationId)
      .eq("user_id", callerUser.id)
      .single();

    if (membershipError || !callerMembership) {
      throw new Error("You are not a member of this organization");
    }

    if (!["owner", "admin"].includes(callerMembership.role)) {
      throw new Error("Only organization admins can add moderators");
    }

    // Check if user with this email already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());

    let userId: string;

    if (existingUser) {
      // User exists, just add them to the organization
      userId = existingUser.id;
      
      // Check if they're already a member of this org
      const { data: existingMember } = await supabaseAdmin
        .from("organization_members")
        .select("id")
        .eq("organization_id", organizationId)
        .eq("user_id", userId)
        .single();

      if (existingMember) {
        throw new Error("This user is already a member of the organization");
      }
    } else {
      // Invite new user - they will set their own password
      const appUrl = 'https://familybridgeapp.com';
      const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
        email,
        {
          redirectTo: `${appUrl}/auth`,
          data: {
            full_name: fullName,
          },
        }
      );

      if (createUserError) {
        console.error("Error inviting user:", createUserError);
        throw new Error(`Failed to invite user: ${createUserError.message}`);
      }

      if (!newUser.user) {
        throw new Error("Failed to invite user");
      }

      userId = newUser.user.id;

      // The profile should be created automatically by the trigger, but update the name just in case
      await supabaseAdmin
        .from("profiles")
        .upsert({
          id: userId,
          full_name: fullName,
        });
    }

    // Add user to organization
    const { error: orgMemberError } = await supabaseAdmin
      .from("organization_members")
      .insert({
        organization_id: organizationId,
        user_id: userId,
        role: role,
      });

    if (orgMemberError) {
      console.error("Error adding organization member:", orgMemberError);
      throw new Error(`Failed to add user to organization: ${orgMemberError.message}`);
    }

    console.log(`Successfully created moderator ${email} for organization ${organizationId}`);

    // Send welcome email to the new moderator
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const orgDisplayName = organizationName || 'FamilyBridge';
    
    if (resendApiKey && !existingUser) {
      try {
        const resend = new Resend(resendApiKey);
        const appUrl = 'https://familybridgeapp.com';
        
        await resend.emails.send({
          from: `${orgDisplayName} <noreply@familybridgeapp.com>`,
          to: [email],
          subject: `Welcome to ${orgDisplayName} - Set Up Your Moderator Account`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <img src="https://familybridgeapp.com/og-image.png" alt="FamilyBridge" style="max-width: 200px; height: auto; margin-bottom: 15px;" />
                <h1 style="color: #2d7d6f; margin: 0;">FamilyBridge</h1>
                <p style="color: #666; margin-top: 5px;">Family Recovery Support Platform</p>
              </div>
              
              <div style="background: #f8f9fa; border-radius: 12px; padding: 30px; margin-bottom: 20px;">
                <h2 style="margin-top: 0; color: #333;">Welcome, ${fullName}!</h2>
                
                <p>You've been invited to join <strong>${orgDisplayName}</strong> as a moderator on FamilyBridge.</p>
                
                <div style="background: #fff; border: 2px solid #2d7d6f; border-radius: 8px; padding: 20px; margin: 25px 0;">
                  <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">Your Login Email:</p>
                  <p style="margin: 0; font-size: 18px; font-weight: bold; color: #2d7d6f;">${email}</p>
                  <p style="margin: 15px 0 5px 0; color: #666; font-size: 14px;">Your Role:</p>
                  <p style="margin: 0; font-size: 16px; font-weight: bold; color: #333; text-transform: capitalize;">${role}</p>
                </div>
                
                <div style="background: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; margin: 20px 0;">
                  <p style="margin: 0;"><strong>Next Step:</strong> Check your inbox for a separate email from FamilyBridge with a link to set your password. Click that link to create your password and activate your account.</p>
                </div>
                
                <hr style="border: none; border-top: 1px solid #ddd; margin: 25px 0;" />
                
                <h3 style="color: #2d7d6f;">As a Moderator, You Can:</h3>
                <ul style="color: #555; padding-left: 20px;">
                  <li style="margin-bottom: 8px;">Monitor family group communications and health status</li>
                  <li style="margin-bottom: 8px;">Provide guidance and support during difficult conversations</li>
                  <li style="margin-bottom: 8px;">Approve boundaries and financial requests</li>
                  <li style="margin-bottom: 8px;">Access crisis intervention tools when needed</li>
                  <li style="margin-bottom: 8px;">View family patterns and insights</li>
                </ul>
              </div>
              
              <div style="text-align: center; padding: 20px; color: #888; font-size: 14px;">
                ${creatorName ? `
                  <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
                    <tr>
                      ${organizationLogo ? `<td style="vertical-align: middle; padding-right: 12px;"><img src="${organizationLogo}" alt="${orgDisplayName}" style="width: 40px; height: 40px; object-fit: contain; border-radius: 4px;" /></td>` : ''}
                      <td style="vertical-align: middle; text-align: left;">
                        <p style="margin: 0 0 2px 0; font-size: 13px; color: #888;">Thank you,</p>
                        <p style="margin: 0; font-weight: bold; color: #333;">${creatorName}</p>
                        <p style="margin: 0; color: #666; font-size: 13px;">${orgDisplayName}</p>
                      </td>
                    </tr>
                  </table>
                ` : `
                  <p style="margin-bottom: 5px;">Thank you,</p>
                  <p style="font-weight: bold; margin-top: 0;">Matt Brown, Creator of Family Bridge</p>
                `}
              </div>
            </body>
            </html>
          `,
        });
        console.log('Welcome email sent to new moderator:', email);
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
        // Don't throw - account was still created successfully
      }
    }

    // Add moderator to Mailchimp provider list
    const mailchimpApiKey = Deno.env.get("MAILCHIMP_API_KEY");
    const mailchimpProviderListId = Deno.env.get("MAILCHIMP_PROVIDER_LIST_ID");
    const mailchimpServerPrefix = Deno.env.get("MAILCHIMP_SERVER_PREFIX");
    
    if (mailchimpApiKey && mailchimpProviderListId && mailchimpServerPrefix) {
      try {
        const mailchimpUrl = `https://${mailchimpServerPrefix}.api.mailchimp.com/3.0/lists/${mailchimpProviderListId}/members`;
        const mailchimpResponse = await fetch(mailchimpUrl, {
          method: "POST",
          headers: {
            "Authorization": `Basic ${btoa(`anystring:${mailchimpApiKey}`)}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email_address: email,
            status: "subscribed",
            tags: ["moderator", role],
            merge_fields: {
              FNAME: fullName.split(' ')[0] || '',
              LNAME: fullName.split(' ').slice(1).join(' ') || '',
              ROLE: role,
            },
          }),
        });
        
        const mailchimpData = await mailchimpResponse.json();
        if (mailchimpData.title === "Member Exists") {
          console.log("Email already subscribed to Mailchimp provider list");
        } else if (!mailchimpResponse.ok) {
          console.error("Mailchimp error:", mailchimpData);
        } else {
          console.log("Successfully added moderator to Mailchimp:", email);
        }
      } catch (e) {
        console.error("Failed to add to Mailchimp:", e);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        userId,
        message: existingUser 
          ? "Existing user added to organization" 
          : "New user account created and added to organization",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in create-moderator function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
