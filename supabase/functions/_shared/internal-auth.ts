/**
 * Guard for internal-only edge functions (security hardening — Section 4.2).
 *
 * Cron jobs (pg_cron) and cross-function invocations authenticate with the
 * service-role key as a Bearer token. Functions that are never called by the
 * app (schedulers, sweeps, seeders, billing audits) should reject every other
 * caller — verify_jwt=false otherwise leaves them open to the public internet.
 *
 * Manual invocation (e.g. seeding a reviewer account) still works:
 *   curl -X POST https://<ref>.supabase.co/functions/v1/<fn> \
 *     -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
 */

export function isInternalRequest(req: Request): boolean {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.replace(/^Bearer\s+/i, "").trim();
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  return serviceKey.length > 0 && token === serviceKey;
}

export function forbiddenResponse(corsHeaders: Record<string, string>): Response {
  return new Response(
    JSON.stringify({ error: "Forbidden: internal function" }),
    { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}
