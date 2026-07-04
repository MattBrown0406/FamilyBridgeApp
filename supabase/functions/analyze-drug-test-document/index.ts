import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CLAUDE_MODEL = "claude-haiku-4-5";

function ab2b64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

async function extractText(bytes: ArrayBuffer, mimeType: string, key: string): Promise<string> {
  const isPdf = mimeType === "application/pdf";
  const isImage = mimeType.startsWith("image/");
  if (!isPdf && !isImage) {
    try { return new TextDecoder().decode(new Uint8Array(bytes)); } catch { return ""; }
  }
  const data = ab2b64(bytes);
  const body: any = {
    model: CLAUDE_MODEL,
    max_tokens: 4000,
    messages: [{
      role: "user",
      content: [
        isPdf
          ? { type: "document", source: { type: "base64", media_type: "application/pdf", data } }
          : { type: "image", source: { type: "base64", media_type: mimeType, data } },
        { type: "text", text: "Extract ALL text from this document exactly as written. Return only the extracted text." },
      ],
    }],
  };
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`Text extraction failed: ${r.status}`);
  const j = await r.json();
  return j.content?.find((b: any) => b.type === "text")?.text || "";
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));

  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { documentId, familyId, fileBytes, mimeType, targetUserId } = await req.json();
    if (!documentId || !familyId) {
      return new Response(JSON.stringify({ error: "documentId and familyId required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY not configured");

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Invalid authorization" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: membership } = await supabase
      .from("family_members").select("role").eq("family_id", familyId).eq("user_id", user.id).maybeSingle();
    if (!membership || !["moderator","admin"].includes(membership.role)) {
      return new Response(JSON.stringify({ error: "Only moderators or admins can analyze drug test documents" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!fileBytes) {
      return new Response(JSON.stringify({ error: "No file content provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const binary = atob(fileBytes);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

    const docText = await extractText(bytes.buffer, (mimeType || "").toLowerCase(), ANTHROPIC_API_KEY);
    if (!docText || docText.trim().length < 30) {
      return new Response(JSON.stringify({ error: "Could not extract sufficient text from the document." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const systemPrompt = `You analyze drug and alcohol test result documents (lab reports, screen results, urine/saliva/hair toxicology). Extract structured fields ONLY when clearly present in the document. Do not infer. Use evidence_quote (short, exact). Set result to one of: negative, positive, inconclusive, missed, refused, pending.`;

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 1500,
        system: systemPrompt,
        messages: [{ role: "user", content: `Analyze this drug/alcohol test document:\n\n${docText}` }],
        tools: [{
          name: "extract_drug_test_result",
          description: "Structured extraction from a drug/alcohol test report.",
          input_schema: {
            type: "object",
            properties: {
              patient_name: { type: "string" },
              test_date: { type: "string", description: "YYYY-MM-DD if possible" },
              test_type: { type: "string", description: "e.g., urine, saliva, hair, breath" },
              panel: { type: "string", description: "e.g., 5-panel, 10-panel, EtG" },
              result: { type: "string", enum: ["negative","positive","inconclusive","missed","refused","pending"] },
              substances_detected: { type: "array", items: { type: "string" } },
              testing_provider: { type: "string" },
              specimen_type: { type: "string" },
              evidence_quote: { type: "string" },
              confidence: { type: "number", minimum: 0, maximum: 1 },
            },
            required: ["result"],
          },
        }],
        tool_choice: { type: "tool", name: "extract_drug_test_result" },
      }),
    });
    if (!r.ok) {
      const t = await r.text();
      console.error("Anthropic error", r.status, t.slice(0, 200));
      throw new Error("AI analysis failed");
    }
    const aiRes = await r.json();
    const toolUse = aiRes.content?.find((b: any) => b.type === "tool_use");
    if (!toolUse) throw new Error("Unexpected AI response format");
    const extracted = toolUse.input as any;

    // Resolve target user from name when possible.
    let resolvedTargetUserId: string | null = targetUserId || null;
    if (!resolvedTargetUserId && extracted.patient_name) {
      const { data: members } = await supabase
        .from("family_members").select("user_id").eq("family_id", familyId);
      const ids = (members || []).map((m: any) => m.user_id);
      if (ids.length > 0) {
        const { data: profs } = await supabase.from("profiles").select("id, full_name").in("id", ids);
        const name = String(extracted.patient_name).toLowerCase();
        const match = (profs || []).find((p: any) =>
          p.full_name && (p.full_name.toLowerCase().includes(name) || name.includes(p.full_name.toLowerCase()))
        );
        if (match) resolvedTargetUserId = match.id;
      }
    }
    if (!resolvedTargetUserId) {
      const { data: recovering } = await supabase
        .from("family_members").select("user_id").eq("family_id", familyId).eq("role", "recovering").maybeSingle();
      if (recovering) resolvedTargetUserId = recovering.user_id;
    }

    // Skip duplicate ingestion of the same document.
    const { data: existing } = await supabase
      .from("drug_test_results").select("id").eq("source_document_id", documentId).maybeSingle();

    let insertedId: string | null = existing?.id ?? null;
    let created = false;
    if (!existing) {
      const { data: ins, error: insErr } = await supabase
        .from("drug_test_results")
        .insert({
          family_id: familyId,
          target_user_id: resolvedTargetUserId,
          entered_by: user.id,
          source_document_id: documentId,
          attachment_document_id: documentId,
          test_date: extracted.test_date || new Date().toISOString().slice(0, 10),
          test_type: extracted.test_type || null,
          panel: extracted.panel || null,
          result: extracted.result,
          substances_detected: extracted.substances_detected || null,
          testing_provider: extracted.testing_provider || null,
          notes: extracted.evidence_quote || null,
          is_manual_entry: false,
        })
        .select("id")
        .single();
      if (insErr) {
        console.error("Insert drug test failed", insErr.message);
      } else {
        insertedId = ins.id;
        created = true;
      }
    }

    await supabase.from("family_documents")
      .update({ fiis_analyzed: true, fiis_analyzed_at: new Date().toISOString(), boundaries_extracted: created ? 1 : 0 })
      .eq("id", documentId);

    return new Response(JSON.stringify({
      success: true,
      created,
      drugTestResultId: insertedId,
      patientName: extracted.patient_name || null,
      result: extracted.result,
      needsReview: !resolvedTargetUserId,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("analyze-drug-test-document error", err);
    return new Response(JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});