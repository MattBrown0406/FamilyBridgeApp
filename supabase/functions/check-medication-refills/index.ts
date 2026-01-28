import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting medication refill check...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate the date 7 days from now
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const targetDate = sevenDaysFromNow.toISOString().split('T')[0];

    // Find medications that need refill alerts:
    // - Active medications
    // - Have a last_refill_date
    // - Have refills_remaining > 0 (so they CAN be refilled)
    // - Last refill was ~23 days ago (assuming 30-day supply, alert at 7 days before)
    // OR refills_remaining is low (1-2)
    const { data: medications, error: medsError } = await supabase
      .from('medications')
      .select(`
        id,
        medication_name,
        family_id,
        user_id,
        pharmacy_name,
        pharmacy_phone,
        last_refill_date,
        refills_remaining
      `)
      .eq('is_active', true)
      .not('last_refill_date', 'is', null);

    if (medsError) {
      console.error('Error fetching medications:', medsError);
      throw medsError;
    }

    console.log(`Found ${medications?.length || 0} active medications with refill dates`);

    let alertsSent = 0;

    for (const med of medications || []) {
      // Calculate days since last refill
      const lastRefill = new Date(med.last_refill_date);
      const today = new Date();
      const daysSinceRefill = Math.floor((today.getTime() - lastRefill.getTime()) / (1000 * 60 * 60 * 24));
      
      // Alert if:
      // 1. It's been 23+ days since refill (7 days before typical 30-day supply runs out)
      // 2. OR refills_remaining is 1 or 2 (low refill warning, once per prescription cycle)
      const needsRefillSoonAlert = daysSinceRefill >= 23 && daysSinceRefill < 30;
      const lowRefillsAlert = med.refills_remaining !== null && med.refills_remaining <= 2 && med.refills_remaining > 0;
      
      if (!needsRefillSoonAlert && !lowRefillsAlert) {
        continue;
      }

      // Check if we already sent an alert for this medication in the last 7 days
      const { data: existingAlert } = await supabase
        .from('medication_alerts')
        .select('id')
        .eq('medication_id', med.id)
        .eq('alert_type', 'refill_reminder')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .limit(1);

      if (existingAlert && existingAlert.length > 0) {
        console.log(`Skipping ${med.medication_name} - alert already sent recently`);
        continue;
      }

      // Get the patient name
      const { data: patientProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', med.user_id)
        .single();

      const patientName = patientProfile?.full_name || 'Patient';

      // Build alert message
      let alertMessage = `💊 Refill Reminder: ${med.medication_name} for ${patientName}`;
      if (needsRefillSoonAlert) {
        alertMessage += ` - Supply running low (${30 - daysSinceRefill} days remaining)`;
      }
      if (lowRefillsAlert) {
        alertMessage += ` - Only ${med.refills_remaining} refill(s) remaining`;
      }
      if (med.pharmacy_name) {
        alertMessage += `. Pharmacy: ${med.pharmacy_name}`;
        if (med.pharmacy_phone) {
          alertMessage += ` (${med.pharmacy_phone})`;
        }
      }

      // Determine who to notify
      const recipientIds: string[] = [];
      
      // Get family's organization_id
      const { data: familyData } = await supabase
        .from('families')
        .select('organization_id')
        .eq('id', med.family_id)
        .single();

      // Check if family has a provider organization
      if (familyData?.organization_id) {
        // Get provider team members (org members)
        const { data: orgMembers } = await supabase
          .from('organization_members')
          .select('user_id')
          .eq('organization_id', familyData.organization_id);

        if (orgMembers && orgMembers.length > 0) {
          recipientIds.push(...orgMembers.map(m => m.user_id));
        }
      }

      // If no provider team, get family admin/moderator
      if (recipientIds.length === 0) {
        const { data: familyAdmins } = await supabase
          .from('family_members')
          .select('user_id')
          .eq('family_id', med.family_id)
          .in('role', ['admin', 'moderator']);

        if (familyAdmins && familyAdmins.length > 0) {
          recipientIds.push(...familyAdmins.map(m => m.user_id));
        }
      }

      // Create medication alert record
      const { error: alertError } = await supabase
        .from('medication_alerts')
        .insert({
          medication_id: med.id,
          family_id: med.family_id,
          user_id: med.user_id,
          alert_type: 'refill_reminder',
          message: alertMessage
        });

      if (alertError) {
        console.error('Error creating medication alert:', alertError);
        continue;
      }

      // Create notifications for each recipient
      for (const userId of recipientIds) {
        await supabase
          .from('notifications')
          .insert({
            user_id: userId,
            family_id: med.family_id,
            type: 'medication_refill',
            title: '💊 Medication Refill Reminder',
            body: alertMessage,
            related_id: med.id
          });
      }

      // Post to family chat if there are recipients
      if (recipientIds.length > 0) {
        await supabase
          .from('messages')
          .insert({
            family_id: med.family_id,
            sender_id: recipientIds[0], // Use first admin/provider as sender
            content: `📋 **Medication Refill Reminder**\n\n${alertMessage}\n\n_Please coordinate the refill with the pharmacy._`
          });
      }

      alertsSent++;
      console.log(`Alert sent for ${med.medication_name}`);
    }

    console.log(`Medication refill check completed. ${alertsSent} alerts sent.`);

    return new Response(
      JSON.stringify({ success: true, alertsSent }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
