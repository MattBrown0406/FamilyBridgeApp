import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
    const vapidSubject = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:support@familybridge.app';

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.error('Missing VAPID keys');
      return new Response(
        JSON.stringify({ error: 'VAPID keys not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { user_ids, title, body, data, type } = await req.json();

    if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
      return new Response(
        JSON.stringify({ error: 'user_ids array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!title || !body) {
      return new Response(
        JSON.stringify({ error: 'title and body are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Sending push notification to ${user_ids.length} users`);

    // Fetch push subscriptions for the users
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .in('user_id', user_ids);

    if (subError) {
      console.error('Error fetching subscriptions:', subError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch subscriptions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('No subscriptions found for users');
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: 'No subscriptions found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload = {
      title,
      body,
      icon: '/favicon.png',
      badge: '/favicon.png',
      tag: type || 'notification',
      data: {
        ...data,
        timestamp: new Date().toISOString(),
      }
    };

    const payloadString = JSON.stringify(payload);
    let sentCount = 0;
    const failedSubscriptions: string[] = [];
    const staleSubscriptions: string[] = [];

    // Send to each subscription
    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payloadString,
          { TTL: 86400 }
        );
        sentCount++;
      } catch (error: unknown) {
        const statusCode = (error as { statusCode?: number })?.statusCode;
        const message = error instanceof Error ? error.message : String(error);
        console.error(`Failed to send to subscription ${sub.id} (status ${statusCode}):`, message);
        if (statusCode === 404 || statusCode === 410) {
          staleSubscriptions.push(sub.id);
        } else {
          failedSubscriptions.push(sub.id);
        }
      }
    }

    // Clean up stale subscriptions (404/410 = endpoint gone)
    if (staleSubscriptions.length > 0) {
      console.log(`Removing ${staleSubscriptions.length} stale subscriptions`);
      await supabase
        .from('push_subscriptions')
        .delete()
        .in('id', staleSubscriptions);
    }

    console.log(`Push notifications sent: ${sentCount}/${subscriptions.length}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: sentCount, 
        total: subscriptions.length,
        failed: failedSubscriptions.length + staleSubscriptions.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-push-notification:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
