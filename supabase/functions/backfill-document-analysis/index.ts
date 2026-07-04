import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { isInternalRequest, forbiddenResponse } from "../_shared/internal-auth.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";


// Map document_type -> analyzer function name.
function analyzerFor(docType: string): string | null {
  switch (docType) {
    case "intervention_letter": return "analyze-intervention-letter";
    case "discharge_plan":
    case "aftercare_plan":
    case "treatment_plan": return "analyze-aftercare-document";
    case "drug_test_result": return "analyze-drug-test-document";
    default: return null;
  }
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));
  if (!isInternalRequest(req)) {
    return forbiddenResponse(corsHeaders);
  }

  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const { familyId, familyNameFilter, documentType, dryRun, limit = 50,
            includeAlreadyAnalyzedZeroCount = false } = body || {};

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Invalid authorization" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Resolve target families.
    let familyIds: string[] = [];
    if (familyId) {
      familyIds = [familyId];
    } else if (familyNameFilter) {
      const { data: fams } = await supabase.from("families").select("id, name").ilike("name", `%${familyNameFilter}%`);
      familyIds = (fams || []).map((f: any) => f.id);
    } else {
      // Default to families the user manages.
      const { data: mod } = await supabase.from("family_members")
        .select("family_id").eq("user_id", user.id).in("role", ["moderator", "admin"]);
      familyIds = (mod || []).map((m: any) => m.family_id);
    }

    if (familyIds.length === 0) {
      return new Response(JSON.stringify({ matchedDocuments: 0, processed: 0, succeeded: 0, failed: 0, needsReview: 0, results: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let q = supabase.from("family_documents").select("*").in("family_id", familyIds);
    if (documentType) q = q.eq("document_type", documentType);
    else q = q.in("document_type", ["intervention_letter","discharge_plan","aftercare_plan","treatment_plan","drug_test_result"]);
    if (!includeAlreadyAnalyzedZeroCount) q = q.or("fiis_analyzed.is.false,fiis_analyzed.is.null");
    q = q.order("created_at", { ascending: false }).limit(limit);

    const { data: docs, error } = await q;
    if (error) throw error;

    const matchedDocuments = (docs || []).length;
    if (dryRun) {
      return new Response(JSON.stringify({ matchedDocuments, processed: 0, succeeded: 0, failed: 0, needsReview: 0, results: (docs || []).map((d: any) => ({ id: d.id, type: d.document_type, title: d.title })) }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let succeeded = 0, failed = 0, needsReview = 0;
    const results: any[] = [];

    for (const doc of docs || []) {
      const fn = analyzerFor(doc.document_type);
      if (!fn) continue;
      try {
        const { data: file, error: dlErr } = await supabase.storage.from("family-documents").download(doc.file_path);
        if (dlErr || !file) throw new Error(dlErr?.message || "download_failed");
        const ab = await file.arrayBuffer();
        const u8 = new Uint8Array(ab);
        let binary = ""; for (let i = 0; i < u8.length; i++) binary += String.fromCharCode(u8[i]);
        const base64 = btoa(binary);

        const resp = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/${fn}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: authHeader },
          body: JSON.stringify({ documentId: doc.id, familyId: doc.family_id, fileBytes: base64, mimeType: doc.mime_type }),
        });
        const json = await resp.json().catch(() => ({}));
        if (!resp.ok) { failed++; results.push({ id: doc.id, ok: false, error: json?.error || resp.status }); continue; }
        if (json?.needsReview) needsReview++;
        succeeded++;
        results.push({ id: doc.id, ok: true, fn, summary: json });
      } catch (e) {
        failed++;
        results.push({ id: doc.id, ok: false, error: (e as Error).message });
      }
    }

    return new Response(JSON.stringify({ matchedDocuments, processed: succeeded + failed, succeeded, failed, needsReview, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("backfill error", err);
    return new Response(JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});