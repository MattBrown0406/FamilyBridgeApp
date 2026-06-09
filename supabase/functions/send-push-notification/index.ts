import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ---------- FCM HTTP v1 helpers ----------

function base64UrlEncode(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let bin = '';
  for (let i = 0; i < bytes.byteLength; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN [^-]+-----/g, '')
    .replace(/-----END [^-]+-----/g, '')
    .replace(/\s+/g, '');
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}

let cachedFcmAccessToken: { token: string; exp: number } | null = null;

async function getFcmAccessToken(clientEmail: string, privateKeyPem: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedFcmAccessToken && cachedFcmAccessToken.exp - 60 > now) {
    return cachedFcmAccessToken.token;
  }

  const header = { alg: 'RS256', typ: 'JWT' };
  const claims = {
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };

  const enc = new TextEncoder();
  const headerB64 = base64UrlEncode(enc.encode(JSON.stringify(header)));
  const claimsB64 = base64UrlEncode(enc.encode(JSON.stringify(claims)));
  const signingInput = `${headerB64}.${claimsB64}`;

  const keyData = pemToArrayBuffer(privateKeyPem.replace(/\\n/g, '\n'));
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    keyData,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, enc.encode(signingInput));
  const jwt = `${signingInput}.${base64UrlEncode(signature)}`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  if (!tokenRes.ok) {
    throw new Error(`FCM OAuth token request failed: ${tokenRes.status} ${await tokenRes.text()}`);
  }
  const json = await tokenRes.json();
  const accessToken = json.access_token as string;
  const expiresIn = (json.expires_in as number) ?? 3600;
  cachedFcmAccessToken = { token: accessToken, exp: now + expiresIn };
  return accessToken;
}

function buildNotificationDataPayload(
  data: Record<string, unknown> | undefined,
  type: string | undefined
): Record<string, string> {
  // FCM data payload values MUST be strings.
  const raw: Record<string, unknown> = {
    ...(data ?? {}),
    type: type ?? (data?.type as string) ?? 'notification',
    timestamp: new Date().toISOString(),
  };
  // Derive a navigation URL if the caller didn't pass one explicitly.
  if (!raw.url) {
    if (raw.type === 'handoff_request' || raw.type === 'handoff_accepted' || raw.type === 'handoff_declined') {
      raw.url = '/moderator?tab=transfers';
    } else if (raw.type === 'org_transfer_invite') {
      raw.url = '/moderator?tab=co-mod';
    } else if (raw.family_id) {
      raw.url = `/family/${raw.family_id}`;
    } else {
      raw.url = '/dashboard';
    }
  }
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (v === null || v === undefined) continue;
    out[k] = typeof v === 'string' ? v : JSON.stringify(v);
  }
  return out;
}

// ---------- main ----------

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

    const firebaseProjectId = Deno.env.get('FIREBASE_PROJECT_ID');
    const firebaseClientEmail = Deno.env.get('FIREBASE_CLIENT_EMAIL');
    const firebasePrivateKey = Deno.env.get('FIREBASE_PRIVATE_KEY');
    const firebaseConfigured = Boolean(firebaseProjectId && firebaseClientEmail && firebasePrivateKey);

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.warn('Missing VAPID keys — web push disabled');
    } else {
      webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
    }

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

    const dataPayload = buildNotificationDataPayload(data, type);

    // ============ Web push ============
    let webSent = 0;
    let webFailed = 0;
    let webStale = 0;
    let webTotal = 0;

    if (vapidPublicKey && vapidPrivateKey) {
      const { data: subscriptions, error: subError } = await supabase
        .from('push_subscriptions')
        .select('*')
        .in('user_id', user_ids);

      if (subError) {
        console.error('Error fetching web subscriptions:', subError);
      } else if (subscriptions && subscriptions.length > 0) {
        webTotal = subscriptions.length;
        const webPayload = JSON.stringify({
          title,
          body,
          icon: '/favicon.png',
          badge: '/favicon.png',
          tag: type || 'notification',
          data: dataPayload,
        });
        const staleSubscriptionIds: string[] = [];
        for (const sub of subscriptions) {
          try {
            await webpush.sendNotification(
              { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
              webPayload,
              { TTL: 86400 }
            );
            webSent++;
          } catch (error: unknown) {
            const statusCode = (error as { statusCode?: number })?.statusCode;
            const message = error instanceof Error ? error.message : String(error);
            console.error(`Web push failed (sub ${sub.id}, status ${statusCode}):`, message);
            if (statusCode === 404 || statusCode === 410) {
              staleSubscriptionIds.push(sub.id);
              webStale++;
            } else {
              webFailed++;
            }
          }
        }
        if (staleSubscriptionIds.length > 0) {
          await supabase.from('push_subscriptions').delete().in('id', staleSubscriptionIds);
        }
      }
    }

    // ============ Native push (FCM HTTP v1) ============
    // FCM HTTP v1 sends to FCM registration tokens for both Android and iOS apps
    // that have Firebase Messaging SDK integrated. Raw APNs tokens are NOT supported here.
    let nativeSent = 0;
    let nativeFailed = 0;
    let nativeStale = 0;
    let nativeTotal = 0;
    let nativeSkippedNoConfig = 0;

    try {
      const { data: nativeTokens, error: ntErr } = await supabase
        .from('native_push_tokens')
        .select('id, user_id, platform, token, enabled')
        .in('user_id', user_ids)
        .eq('enabled', true);

      if (ntErr) {
        console.error('Error fetching native tokens:', ntErr);
      } else if (nativeTokens && nativeTokens.length > 0) {
        nativeTotal = nativeTokens.length;

        if (!firebaseConfigured) {
          console.warn('Firebase (FCM HTTP v1) not configured — skipping native push. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY.');
          nativeSkippedNoConfig = nativeTotal;
        } else {
          const accessToken = await getFcmAccessToken(firebaseClientEmail!, firebasePrivateKey!);
          const fcmEndpoint = `https://fcm.googleapis.com/v1/projects/${firebaseProjectId}/messages:send`;
          const staleNativeIds: string[] = [];

          for (const t of nativeTokens) {
            try {
              const message: Record<string, unknown> = {
                token: t.token,
                notification: { title, body },
                data: dataPayload,
                android: {
                  priority: 'HIGH',
                  notification: { sound: 'default', click_action: 'FLUTTER_NOTIFICATION_CLICK' },
                },
                apns: {
                  payload: {
                    aps: { sound: 'default', 'mutable-content': 1, 'content-available': 1 },
                  },
                  headers: { 'apns-priority': '10' },
                },
              };

              const res = await fetch(fcmEndpoint, {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message }),
              });

              if (res.ok) {
                nativeSent++;
              } else {
                const txt = await res.text();
                console.error(`FCM v1 send failed (${res.status}):`, txt);
                // 404 UNREGISTERED or 400 INVALID_ARGUMENT for bad/expired tokens
                if (
                  res.status === 404 ||
                  /UNREGISTERED|INVALID_ARGUMENT|registration-token-not-registered/i.test(txt)
                ) {
                  staleNativeIds.push(t.id);
                  nativeStale++;
                } else {
                  nativeFailed++;
                }
              }
            } catch (err) {
              nativeFailed++;
              console.error('Native push send error:', err);
            }
          }

          if (staleNativeIds.length > 0) {
            await supabase
              .from('native_push_tokens')
              .update({ enabled: false })
              .in('id', staleNativeIds);
          }
        }
      }
    } catch (err) {
      console.error('Native push block error:', err);
    }

    console.log(
      `Push results — web: ${webSent}/${webTotal} (failed ${webFailed}, stale ${webStale}); ` +
      `native: ${nativeSent}/${nativeTotal} (failed ${nativeFailed}, stale ${nativeStale}, skipped ${nativeSkippedNoConfig})`
    );

    return new Response(
      JSON.stringify({
        success: true,
        web: { sent: webSent, total: webTotal, failed: webFailed, stale: webStale },
        native: {
          sent: nativeSent,
          total: nativeTotal,
          failed: nativeFailed,
          stale: nativeStale,
          skipped_no_config: nativeSkippedNoConfig,
          configured: firebaseConfigured,
        },
        // Legacy fields preserved for older callers
        sent: webSent,
        total: webTotal,
        failed: webFailed + webStale,
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