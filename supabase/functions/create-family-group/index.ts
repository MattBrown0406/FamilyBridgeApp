import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FamilyMember {
  name: string;
  email: string;
  relationship: string;
}

interface AdminInfo {
  name: string;
  email: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { inviteCode, familyName, familyDescription, adminName, adminEmail, members } = await req.json();

    if (!inviteCode || !familyName || !members || members.length === 0) {
      throw new Error('Invite code, family name, and at least one member are required');
    }

    if (!adminName || !adminEmail) {
      throw new Error('Admin name and email are required');
    }

    console.log('Creating family group:', familyName, 'with invite code:', inviteCode);

    // Verify the invite code exists and is not used
    // SECURITY: select only what we need (avoid pulling any sensitive fields)
    const { data: codeData, error: codeError } = await supabase
      .from('activation_codes')
      .select('id')
      .eq('code', inviteCode.trim().toUpperCase())
      .eq('is_used', false)
      .maybeSingle();

    if (codeError) {
      console.error('Error checking invite code:', codeError);
      throw new Error('Failed to verify invite code');
    }

    if (!codeData) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid or already used invite code' 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate a new member invite code for the family
    const chars = 'abcdefghjklmnpqrstuvwxyz23456789';
    let memberInviteCode = '';
    for (let i = 0; i < 8; i++) {
      memberInviteCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // Create the family
    const { data: familyData, error: familyError } = await supabase
      .from('families')
      .insert({
        name: familyName,
        description: familyDescription || null,
        invite_code: memberInviteCode,
      })
      .select()
      .single();

    if (familyError) {
      console.error('Error creating family:', familyError);
      throw new Error('Failed to create family group');
    }

    console.log('Family created:', familyData.id);

    // Create invite code entry for family members to use
    const { error: inviteCodeError } = await supabase
      .from('family_invite_codes')
      .insert({
        family_id: familyData.id,
        invite_code: memberInviteCode,
      });

    if (inviteCodeError) {
      console.error('Error creating family invite code:', inviteCodeError);
    }

    // Mark the purchase invite code as used
    const { error: updateError } = await supabase
      .from('activation_codes')
      .update({
        is_used: true,
        used_at: new Date().toISOString(),
      })
      .eq('id', codeData.id);

    if (updateError) {
      console.error('Error updating invite code:', updateError);
    }

    // Send emails via Resend
    if (resendApiKey) {
      const resend = new Resend(resendApiKey);
      
      // Send welcome email to admin with detailed instructions
      try {
        await resend.emails.send({
          from: 'FamilyBridge <onboarding@resend.dev>',
          to: [adminEmail],
          subject: `Welcome to FamilyBridge - Your ${familyName} Group is Ready!`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #2d7d6f; margin: 0;">FamilyBridge</h1>
                <p style="color: #666; margin-top: 5px;">Family Recovery Support Platform</p>
              </div>
              
              <div style="background: #f8f9fa; border-radius: 12px; padding: 30px; margin-bottom: 20px;">
                <h2 style="margin-top: 0; color: #333;">Welcome, ${adminName}!</h2>
                
                <p>Congratulations! Your family group <strong>"${familyName}"</strong> has been successfully created. This email contains everything you need to know to use FamilyBridge effectively and create consistency and accountability for everyone involved.</p>
                
                <div style="background: #fff; border: 2px solid #2d7d6f; border-radius: 8px; padding: 20px; margin: 25px 0;">
                  <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">Your Family Invite Code (share with family members):</p>
                  <p style="margin: 0; font-size: 28px; font-weight: bold; font-family: monospace; letter-spacing: 2px; color: #2d7d6f; text-align: center;">${memberInviteCode}</p>
                </div>
                
                <h3 style="color: #2d7d6f; margin-top: 30px;">📱 Getting Started</h3>
                <ol style="color: #555; padding-left: 20px;">
                  <li style="margin-bottom: 10px;"><strong>Create your account</strong> - Visit FamilyBridge and sign up with this email address (${adminEmail})</li>
                  <li style="margin-bottom: 10px;"><strong>Join your family</strong> - Use the invite code above when prompted</li>
                  <li style="margin-bottom: 10px;"><strong>Complete your profile</strong> - Add your details and set your preferences</li>
                  <li style="margin-bottom: 10px;"><strong>Sign the HIPAA release</strong> - If applicable, this helps protect everyone's privacy</li>
                </ol>

                <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;" />

                <h2 style="color: #2d7d6f; margin-top: 0;">📋 Understanding the App Features</h2>
                <p>FamilyBridge has seven main sections, each designed to help your family communicate effectively, maintain accountability, and support recovery:</p>

                <h3 style="color: #2d7d6f; margin-top: 25px;">💬 Messages Tab</h3>
                <p><strong>What it does:</strong> A family group chat where everyone can communicate in one place.</p>
                <p><strong>Key Feature - Content Filtering:</strong> FamilyBridge automatically filters profanity, abusive language, and inappropriate content from all messages. This creates a safer communication environment and reduces the emotional harm that can come from heated exchanges. Family members can communicate knowing that hurtful language will be moderated automatically.</p>
                <p><strong>Best Practice:</strong> Use this as your primary communication channel. The filtering helps keep conversations productive, especially during difficult times.</p>

                <h3 style="color: #2d7d6f; margin-top: 25px;">📍 Check-in Tab</h3>
                <p><strong>What it does:</strong> Allows family members to check in at recovery meetings, therapy appointments, medical visits, work, and other important locations.</p>
                <p><strong>Location Request Feature:</strong> Family members can request a location check-in from their loved one at any time. This provides peace of mind and builds trust through transparency.</p>
                <p><strong>Meeting Verification:</strong> When checking into recovery meetings, the app verifies the location and can even detect if someone is at an establishment with a liquor license, providing helpful awareness.</p>
                <p><strong>Best Practice:</strong> Establish an expectation that your loved one checks in at every meeting and appointment. Consistency builds trust over time. Use location requests when you need reassurance - it's not about control, it's about rebuilding trust together.</p>

                <h3 style="color: #2d7d6f; margin-top: 25px;">💰 Financial Tab</h3>
                <p><strong>What it does:</strong> Manages financial requests with full transparency. Your loved one can request money for specific needs (utilities, rent, food, medical, etc.) and attach photos of actual bills.</p>
                <p><strong>Why it matters:</strong> Financial manipulation is common in addiction. This feature removes the guesswork - family members can see exactly what the money is for before deciding to help.</p>
                <p><strong>Best Practice:</strong> Require bill attachments for all financial requests. This protects both parties and ensures money goes where it's intended.</p>

                <h3 style="color: #2d7d6f; margin-top: 25px;">🎯 Goals Tab</h3>
                <p><strong>What it does:</strong> Helps your family define shared values and set recovery milestones together.</p>
                <p><strong>Family Values:</strong> Choose values like honesty, accountability, healthy boundaries, and compassionate communication that everyone commits to uphold.</p>
                <p><strong>Recovery Goals:</strong> Track milestones like "90 meetings in 90 days," completing family therapy sessions, and celebrating sobriety anniversaries.</p>
                <p><strong>Best Practice:</strong> Set these together as a family. When everyone agrees on the values and goals, there's less room for misunderstanding and more motivation to succeed.</p>

                <h3 style="color: #2d7d6f; margin-top: 25px;">🛡️ Boundaries Tab</h3>
                <p><strong>What it does:</strong> A place to document and agree on family boundaries - the "rules of engagement" for your family's recovery journey.</p>
                <p><strong>Examples:</strong> "No phone calls after 10 PM unless emergency," "Weekly check-in calls on Sundays," "No financial help without 48-hour notice and documentation."</p>
                <p><strong>Best Practice:</strong> Write boundaries down when everyone is calm. Having them documented prevents arguments later about "what we agreed to."</p>

                <h3 style="color: #2d7d6f; margin-top: 25px;">🧪 Tests Tab</h3>
                <p><strong>What it does:</strong> Track and share drug test results, medical screenings, and other verification documents.</p>
                <p><strong>Best Practice:</strong> If testing is part of your family's recovery plan, use this to maintain a clear record. Transparency builds trust.</p>

                <h3 style="color: #2d7d6f; margin-top: 25px;">🧠 FIIS Tab (Family Interaction Intelligence System)</h3>
                <p><strong>What it does:</strong> An AI-powered tool that analyzes patterns across family interactions - messages, check-ins, financial requests, and observations you log.</p>
                <p><strong>Note:</strong> This tab is only visible to supporting family members, not to the person in recovery, so you can track patterns privately.</p>
                <p><strong>Best Practice:</strong> Log observations about behavior patterns, mood changes, or concerning signs. FIIS helps you see trends that might not be obvious day-to-day.</p>

                <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;" />

                <h2 style="color: #c62828; margin-top: 0;">⚠️ Important: When Your Loved One Resists</h2>
                <p>If your loved one is opposed to using FamilyBridge, it may be necessary for the family to establish clear boundaries around communication:</p>
                
                <div style="background: #fff3e0; border-left: 4px solid #ff9800; padding: 15px; margin: 20px 0;">
                  <p style="margin: 0;"><strong>Consider this:</strong> If they refuse to communicate through the app where content is filtered and accountability is built in, the family may need to block them from communicating through other means (phone, text, social media).</p>
                </div>

                <p><strong>Why this matters:</strong></p>
                <ul style="color: #555; padding-left: 20px;">
                  <li><strong>Reduced abuse:</strong> The content filter prevents profanity, manipulation, and verbal abuse from reaching family members</li>
                  <li><strong>Documented communication:</strong> Everything is recorded, reducing "he said/she said" disputes</li>
                  <li><strong>Location accountability:</strong> Know where your loved one is when they say they're at a meeting</li>
                  <li><strong>Financial transparency:</strong> No more wondering where the money really went</li>
                  <li><strong>Pattern recognition:</strong> FIIS helps you identify concerning trends before they become crises</li>
                </ul>

                <p>This may seem extreme, but directing all communication through FamilyBridge protects everyone involved. It's not about punishment - it's about creating a structured environment where trust can be rebuilt safely.</p>

                <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;" />

                <h3 style="color: #2d7d6f; margin-top: 0;">👥 Inviting Family Members</h3>
                <p>We've already sent invitation emails to the family members you listed during setup. Each email contains the family invite code above.</p>
                <p>If you need to invite additional members later, share this code: <strong style="font-family: monospace;">${memberInviteCode}</strong></p>

                <h3 style="color: #2d7d6f; margin-top: 30px;">💡 Keys to Success</h3>
                <ul style="color: #555; padding-left: 20px;">
                  <li><strong>Consistency is everything:</strong> Check in daily, respond to messages promptly, and stick to the boundaries you set</li>
                  <li><strong>Enable notifications:</strong> Don't miss important check-ins or requests</li>
                  <li><strong>Use Conversation Starters:</strong> These prompts help facilitate meaningful discussions about recovery</li>
                  <li><strong>Log observations regularly:</strong> The more data FIIS has, the better it can help you see patterns</li>
                  <li><strong>Celebrate progress:</strong> Mark milestones and acknowledge growth - recovery is hard work</li>
                </ul>
              </div>
              
              <div style="background: #e8f5e9; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <h3 style="margin-top: 0; color: #2e7d32;">Need Help?</h3>
                <p style="margin-bottom: 0;">Visit our Support page within the app if you have any questions. We're here to help your family on this journey.</p>
              </div>
              
              <div style="text-align: center; padding: 20px; color: #888; font-size: 14px;">
                <p>Thank you for choosing FamilyBridge.</p>
                <p>Together, we can build stronger families.</p>
              </div>
            </body>
            </html>
          `,
        });
        console.log('Admin welcome email sent to:', adminEmail);
      } catch (emailError) {
        console.error('Failed to send admin welcome email:', emailError);
      }
      
      // Send invitation emails to all family members
      for (const member of members as FamilyMember[]) {
        try {
          await resend.emails.send({
            from: 'FamilyBridge <onboarding@resend.dev>',
            to: [member.email],
            subject: `You're Invited to Join ${familyName} on FamilyBridge`,
            html: `
              <h1>You've Been Invited to FamilyBridge!</h1>
              <p>Hello ${member.name},</p>
              <p>You've been invited to join <strong>${familyName}</strong> on FamilyBridge - a safe space for families to communicate, set boundaries, and support each other.</p>
              
              <div style="background: #f4f4f4; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0 0 10px 0; font-weight: bold;">Your Family Invite Code:</p>
                <p style="font-size: 24px; font-family: monospace; font-weight: bold; letter-spacing: 2px; margin: 0; color: #2563eb;">
                  ${memberInviteCode}
                </p>
              </div>

              <h3>Getting Started:</h3>
              <ol>
                <li>Visit FamilyBridge and create an account</li>
                <li>Click "Join with Code" and enter the invite code above</li>
                <li>Select your relationship to the family</li>
                <li>Start connecting with your family!</li>
              </ol>

              <p>We're here to help your family heal and grow together.</p>
              <p>Best regards,<br>The FamilyBridge Team</p>
            `,
          });
          console.log('Invitation email sent to:', member.email);
        } catch (emailError) {
          console.error('Failed to send email to:', member.email, emailError);
          // Continue with other emails even if one fails
        }
      }
    } else {
      console.log('RESEND_API_KEY not configured, skipping emails');
    }

    return new Response(JSON.stringify({ 
      success: true,
      familyId: familyData.id,
      memberInviteCode: memberInviteCode,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Create family group error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ 
      success: false, 
      error: message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
