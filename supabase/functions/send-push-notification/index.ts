import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type NativeToken = {
  id: string;
  user_id: string;
  platform: string;
  token: string;
  token_provider?: string;
  environment?: string;
  enabled: boolean;
};

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

function normalizePrivateKey(raw: string): string {
  return raw.replace(/\\n/g, '\n').trim();
}

let cachedApnsJwt: { token: string; iat: number } | null = null;

async function getApnsJwt(teamId: string, keyId: string, privateKeyPem: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  // APNs accepts provider tokens for up to 60 minutes. Refresh after 50.
  if (cachedApnsJwt && now - cachedApnsJwt.iat < 3000) {
    return cachedApnsJwt.token;
  }

  const header = { alg: 'ES256', kid: keyId };
  const claims = { iss: teamId, iat: now };
  const enc = new TextEncoder();
  const signingInput = `${base64UrlEncode(enc.encode(JSON.stringify(header)))}.${base64UrlEncode(enc.encode(JSON.stringify(claims)))}`;

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(normalizePrivateKey(privateKeyPem)),
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    cryptoKey,
    enc.encode(signingInput)
  );

  const token = `${signingInput}.${base64UrlEncode(signature)}`;
  cachedApnsJwt = { token, iat: now };
  return token;
}

function buildNotificationDataPayload(
  data: Record<string, unknown> | undefined,
  type: string | undefined
): Record<string, string> {
  const raw: Record<string, unknown> = {
    ...(data ?? {}),
    type: type ?? (data?.type as string) ?? 'notification',
    timestamp: new Date().toISOString(),
  };

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

async function sendApnsNotification(params: {
  token: string;
  title: string;
  body: string;
  dataPayload: Record<string, string>;
  jwt: string;
  bundleId: string;
  useSandbox: boolean;
}) {
  const host = params.useSandbox ? 'https://api.sandbox.push.apple.com' : 'https://api.push.apple.com';
  const payload = {
    aps: {
      alert: {
        title: params.title,
        body: params.body,
      },
      sound: 'default',
    },
    ...params.dataPayload,
  };

  return fetch(`${host}/3/device/${params.token}`, {
    method: 'POST',
    headers: {
      authorization: `bearer ${params.jwt}`,
      'apns-topic': params.bundleId,
      'apns-push-type': 'alert',
      'apns-priority': '10',
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
    const vapidSubject = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:support@familybridgeapp.com';

    const apnsKeyId = Deno.env.get('APNS_KEY_ID');
    const apnsTeamId = Deno.env.get('APNS_TEAM_ID');
    const apnsBundleId = Deno.env.get('APNS_BUNDLE_ID') ?? 'app.lovable.feec162303784a959c1635217b29129c';
    const apnsPrivateKey = Deno.env.get('APNS_PRIVATE_KEY');
    const apnsUseSandbox = Deno.env.get('APNS_USE_SANDBOX') === 'true';
    const apnsConfigured = Boolean(apnsKeyId && apnsTeamId && apnsPrivateKey && apnsBundleId);

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

    // ============ Native iOS push (direct APNs) ============
    let nativeSent = 0;
    let nativeFailed = 0;
    let nativeStale = 0;
    let nativeTotal = 0;
    let nativeSkippedNoConfig = 0;

    try {
      const { data: nativeTokens, error: ntErr } = await supabase
        .from('native_push_tokens')
        .select('id, user_id, platform, token, token_provider, environment, enabled')
        .in('user_id', user_ids)
        .eq('enabled', true)
        .eq('platform', 'ios')
        .eq('token_provider', 'apns');

      if (ntErr) {
        console.error('Error fetching APNs tokens:', ntErr);
      } else if (nativeTokens && nativeTokens.length > 0) {
        const apnsTokens = nativeTokens as NativeToken[];
        nativeTotal = apnsTokens.length;

        if (!apnsConfigured) {
          console.warn('APNs not configured — skipping native iOS push. Set APNS_KEY_ID, APNS_TEAM_ID, APNS_BUNDLE_ID, APNS_PRIVATE_KEY.');
          nativeSkippedNoConfig = nativeTotal;
        } else {
          const jwt = await getApnsJwt(apnsTeamId!, apnsKeyId!, apnsPrivateKey!);
          const staleNativeIds: string[] = [];

          for (const tokenRow of apnsTokens) {
            try {
              const res = await sendApnsNotification({
                token: tokenRow.token,
                title,
                body,
                dataPayload,
                jwt,
                bundleId: apnsBundleId,
                useSandbox: apnsUseSandbox || tokenRow.environment === 'sandbox',
              });

              if (res.ok) {
                nativeSent++;
              } else {
                const txt = await res.text();
                console.error(`APNs send failed (${res.status}) for token ${tokenRow.id}:`, txt);

                if (res.status === 400 || res.status === 410 || /BadDeviceToken|Unregistered|DeviceTokenNotForTopic/i.test(txt)) {
                  staleNativeIds.push(tokenRow.id);
                  nativeStale++;
                } else {
                  nativeFailed++;
                }
              }
            } catch (error) {
              nativeFailed++;
              console.error('APNs send error:', error);
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
    } catch (error) {
      console.error('Native APNs push block error:', error);
    }

    console.log(
      `Push results — web: ${webSent}/${webTotal} (failed ${webFailed}, stale ${webStale}); ` +
      `native APNs: ${nativeSent}/${nativeTotal} (failed ${nativeFailed}, stale ${nativeStale}, skipped ${nativeSkippedNoConfig})`
    );

    return new Response(
      JSON.stringify({
        success: true,
        web: { sent: webSent, total: webTotal, failed: webFailed, stale: webStale },
        native: {
          provider: 'apns',
          sent: nativeSent,
          total: nativeTotal,
          failed: nativeFailed,
          stale: nativeStale,
          skipped_no_config: nativeSkippedNoConfig,
          configured: apnsConfigured,
        },
        sent: webSent + nativeSent,
        total: webTotal + nativeTotal,
        failed: webFailed + webStale + nativeFailed + nativeStale,
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
