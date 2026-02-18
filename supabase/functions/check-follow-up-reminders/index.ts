import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // Find due reminders that haven't been sent yet
    const { data: reminders, error: fetchError } = await supabase
      .from('crm_follow_up_reminders')
      .select('*, crm_leads(contact_name, contact_email, contact_phone, organization_id)')
      .eq('is_sent', false)
      .eq('is_dismissed', false)
      .lte('remind_at', new Date().toISOString())
      .limit(50)

    if (fetchError) throw fetchError

    if (!reminders || reminders.length === 0) {
      return new Response(JSON.stringify({ message: 'No pending reminders' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let sentCount = 0

    for (const reminder of reminders) {
      const lead = reminder.crm_leads
      if (!lead) continue

      // 1. Create in-app notification
      await supabase.from('notifications').insert({
        user_id: reminder.assigned_to,
        type: 'follow_up_reminder',
        title: '⏰ Follow-Up Reminder',
        body: `Time to follow up with ${lead.contact_name}${reminder.message ? ': ' + reminder.message : ''}`,
        related_id: reminder.lead_id,
      })

      // 2. Send email reminder via Resend
      try {
        const resendKey = Deno.env.get('RESEND_API_KEY')
        if (resendKey) {
          // Get the assigned user's email
          const { data: profile } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', reminder.assigned_to)
            .single()

          if (profile?.email) {
            await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${resendKey}`,
              },
              body: JSON.stringify({
                from: 'noreply@familybridgeapp.com',
                to: profile.email,
                subject: `Follow-Up Reminder: ${lead.contact_name}`,
                html: `
                  <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #1a1a2e;">⏰ Follow-Up Reminder</h2>
                    <p>Hi ${profile.full_name || 'there'},</p>
                    <p>This is a reminder to follow up with <strong>${lead.contact_name}</strong>.</p>
                    ${reminder.message ? `<p><em>"${reminder.message}"</em></p>` : ''}
                    ${lead.contact_phone ? `<p>📞 Phone: ${lead.contact_phone}</p>` : ''}
                    ${lead.contact_email ? `<p>📧 Email: ${lead.contact_email}</p>` : ''}
                    <p style="margin-top: 20px;">
                      <a href="https://familybridgeapp.com/moderator" 
                         style="background: #1a1a2e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">
                        Open CRM
                      </a>
                    </p>
                  </div>
                `,
              }),
            })
          }
        }
      } catch (emailErr) {
        console.error('Email reminder failed:', emailErr)
        // Continue even if email fails
      }

      // 3. Mark reminder as sent
      await supabase
        .from('crm_follow_up_reminders')
        .update({ is_sent: true, sent_at: new Date().toISOString() })
        .eq('id', reminder.id)

      sentCount++
    }

    return new Response(
      JSON.stringify({ message: `Processed ${sentCount} reminders` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Error processing reminders:', err)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
