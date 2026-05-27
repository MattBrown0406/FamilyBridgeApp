// supabase/functions/validate-invite-code/index.ts
//
// Public, no-auth-required endpoint that resolves an invite code to a family.
//
// Why this exists:
//   The `family_invite_codes` table has strict RLS — only existing family
//   members can SELECT rows. Anonymous users (someone who received an invite
//   code and is about to sign up) cannot read it directly, so the
//   "Do you have an invite code?" field on /family-purchase, /join, and
//   /auth?mode=signup needs a service-role lookup instead.
//
// Input:  { code: string }
// Output: { valid: true,  family_id: string, family_name?: string }
//         { valid: false, error: string }
//
// Uses the service role key — it ONLY exposes (family_id, family_name) for a
// matching code. Nothing else from the table or related tables is returned.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface ValidateRequest {
  code?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code }: ValidateRequest = await req.json().catch(() => ({}));

    if (!code || typeof code !== 'string') {
      return new Response(
        JSON.stringify({ valid: false, error: 'Missing invite code.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const normalized = code.trim().toLowerCase();
    if (normalized.length < 4 || normalized.length > 32) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Invalid invite code format.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Primary lookup — current schema
    const { data: codeRow, error: codeErr } = await admin
      .from('family_invite_codes')
      .select('family_id')
      .eq('invite_code', normalized)
      .maybeSingle();

    if (codeErr) {
      console.error('[validate-invite-code] family_invite_codes lookup failed:', codeErr);
    }

    let familyId: string | null = codeRow?.family_id ?? null;

    // Legacy fallback — old `families.invite_code` column
    if (!familyId) {
      const { data: legacyFamily, error: legacyErr } = await admin
        .from('families')
        .select('id')
        .eq('invite_code', normalized)
        .maybeSingle();

      if (legacyErr) {
        console.error('[validate-invite-code] legacy families lookup failed:', legacyErr);
      }
      familyId = legacyFamily?.id ?? null;
    }

    if (!familyId) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Invalid invite code.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Best-effort enrich with family name (non-sensitive, helpful UX)
    const { data: family } = await admin
      .from('families')
      .select('name')
      .eq('id', familyId)
      .maybeSingle();

    return new Response(
      JSON.stringify({
        valid: true,
        family_id: familyId,
        family_name: family?.name ?? null,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    console.error('[validate-invite-code] unexpected error:', e);
    return new Response(
      JSON.stringify({ valid: false, error: 'Validator unavailable. Try again in a moment.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
