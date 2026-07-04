/**
 * Shared CORS helper (security hardening — Section 4.2).
 *
 * Replaces the per-function `Access-Control-Allow-Origin: *` wildcard with an
 * origin allowlist. The returned headers echo the request origin only when it
 * is one of ours; anything else falls back to the production origin, which
 * makes browsers refuse the response for unknown sites.
 *
 * Notes:
 * - Non-browser callers (pg_cron, webhooks, curl, native fetch) ignore CORS
 *   entirely; this never blocks them.
 * - The Allow-Headers list is the superset of every header any of our
 *   functions accepts (Square webhook signature, sensitive-access token,
 *   Supabase client platform headers).
 */

const PRODUCTION_ORIGIN = "https://familybridgeapp.com";

const STATIC_ALLOWED = new Set<string>([
  PRODUCTION_ORIGIN,
  "https://www.familybridgeapp.com",
  // Capacitor WebView origins (iOS / Android)
  "capacitor://localhost",
  "https://localhost",
  "http://localhost",
]);

function isAllowedOrigin(origin: string): boolean {
  if (STATIC_ALLOWED.has(origin)) return true;
  try {
    const url = new URL(origin);
    // Local development on any port
    if (url.hostname === "localhost" || url.hostname === "127.0.0.1") return true;
    // Lovable preview + published domains
    if (
      url.protocol === "https:" &&
      (url.hostname.endsWith(".lovable.app") ||
        url.hostname.endsWith(".lovableproject.com"))
    ) {
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

export function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowOrigin = origin && isAllowedOrigin(origin) ? origin : PRODUCTION_ORIGIN;
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-sensitive-access-token, x-square-hmacsha256-signature, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Vary": "Origin",
  };
}
