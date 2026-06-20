import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
const CLAUDE_MODEL = "claude-haiku-4-5";

type RecommendationType =
  | "therapy" | "meetings" | "outpatient" | "php" | "iop" | "residential"
  | "sober_living" | "psychiatry" | "medical" | "medication_management"
  | "drug_testing" | "case_management" | "family_therapy" | "wellness" | "other";

interface ExtractedAftercare {
  recommendation_type: RecommendationType;
  title: string;
  description?: string | null;
  facility_name?: string | null;
  provider_name?: string | null;
  recommended_duration?: string | null;
  frequency?: string | null;
  minimum_expected_per_week?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  therapy_type?: string | null;
  evidence_quote?: string | null;
  accountability_relevant?: boolean;
  checkin_category?: string | null;
}

interface ExtractedTarget {
  target_type: string;
  label: string;
  expected_frequency?: string | null;
  minimum_expected_per_week?: number | null;
  applies_to_user_name?: string | null;
  evidence_quote?: string | null;
  importance?: "low" | "medium" | "high" | "critical";
}

// Map a recommendation_type to (target_type, checkin_category) for the
// Accountability Engine.
function mapRecommendationToTarget(rec: ExtractedAftercare): { target_type: string; checkin_category: string | null } | null {
  switch (rec.recommendation_type) {
    case "meetings": return { target_type: "meetings_per_week", checkin_category: "meeting" };
    case "therapy":
    case "family_therapy": return { target_type: "therapy_attendance", checkin_category: "therapy" };
    case "psychiatry": return { target_type: "psychiatry_attendance", checkin_category: "psychiatry" };
    case "medical": return { target_type: "medical_appointments", checkin_category: "medical" };
    case "iop": return { target_type: "iop_php_attendance", checkin_category: "iop" };
    case "php": return { target_type: "iop_php_attendance", checkin_category: "php" };
    case "outpatient": return { target_type: "iop_php_attendance", checkin_category: "iop" };
    case "sober_living":
    case "residential": return { target_type: "sober_living_compliance", checkin_category: "sober_living" };
    case "drug_testing": return { target_type: "drug_testing", checkin_category: "drug_test" };
    case "medication_management": return { target_type: "medication_adherence", checkin_category: null };
    case "case_management":
    case "wellness":
    case "other":
    default: return null;
  }
}

const getErrorMessage = (error: unknown) => error instanceof Error ? error.message : "Unknown error";

// Convert ArrayBuffer to Base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Extract text from PDF using Claude
async function extractPdfText(pdfBytes: ArrayBuffer, anthropicKey: string): Promise<string> {
  console.log("Starting PDF text extraction for aftercare document");

  const base64Pdf = arrayBufferToBase64(pdfBytes);

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": anthropicKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 8000,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: base64Pdf
              }
            },
            {
              type: "text",
              text: "Extract ALL text from this document exactly as written. Return only the extracted text content, preserving the original formatting and structure. Do not summarize or modify the content."
            }
          ]
        }
      ]
    }),
  });

  if (!response.ok) {
    await response.text();
    console.error("PDF extraction error", { status: response.status });
    throw new Error(`Failed to extract text from PDF: ${response.status}`);
  }

  const result = await response.json();
  const extractedText = result.content?.find((b: any) => b.type === "text")?.text || "";

  console.log("Completed PDF text extraction", { characters: extractedText.length });
  return extractedText;
}

// Extract text from image files using Claude vision
async function extractImageText(imageBytes: ArrayBuffer, mimeType: string, anthropicKey: string): Promise<string> {
  console.log("Starting image text extraction for aftercare document");

  const base64Image = arrayBufferToBase64(imageBytes);

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": anthropicKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 8000,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mimeType,
                data: base64Image
              }
            },
            {
              type: "text",
              text: "Extract ALL text from this image exactly as written. Return only the extracted text content. Do not summarize or modify the content."
            }
          ]
        }
      ]
    }),
  });

  if (!response.ok) {
    await response.text();
    console.error("Image extraction error", { status: response.status });
    throw new Error(`Failed to extract text from image: ${response.status}`);
  }

  const result = await response.json();
  const extractedText = result.content?.find((b: any) => b.type === "text")?.text || "";

  console.log("Completed image text extraction", { characters: extractedText.length });
  return extractedText;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  let documentIdForStatus: string | null = null;
  let supabaseForStatus: any = null;
  try {
    const body = await req.json();
    const { documentId, familyId, targetUserId } = body || {};
    let { fileBytes, mimeType } = body || {};

    if (!documentId || !familyId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: documentId, familyId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    documentIdForStatus = documentId;
    supabaseForStatus = supabase;

    // Auth: either a valid user JWT with family admin/moderator role, OR an internal call
    // using the service role / shared internal secret.
    const authHeader = req.headers.get("Authorization");
    const internalSecret = req.headers.get("x-internal-secret");
    const expectedInternal = Deno.env.get("INTERNAL_FN_SECRET");
    const isServiceRole = !!authHeader && authHeader.replace("Bearer ", "") === supabaseServiceKey;
    const isInternal = isServiceRole || (!!expectedInternal && internalSecret === expectedInternal);

    let user: { id: string } | null = null;
    if (!isInternal) {
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: "Authorization required" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
        global: { headers: { Authorization: authHeader } }
      });
      const { data: { user: u } } = await userClient.auth.getUser();
      if (!u) {
        return new Response(
          JSON.stringify({ error: "Invalid authorization" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      user = { id: u.id };
      const { data: membership } = await supabase
        .from("family_members")
        .select("id, role")
        .eq("family_id", familyId)
        .eq("user_id", user.id)
        .single();
      if (!membership || (membership.role !== "moderator" && membership.role !== "admin")) {
        return new Response(
          JSON.stringify({ error: "Only moderators can analyze aftercare documents" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Mark document as processing.
    await supabase
      .from("family_documents")
      .update({
        fiis_analysis_status: "processing",
        fiis_analysis_error: null,
        last_fiis_attempt_at: new Date().toISOString(),
      })
      .eq("id", documentId);

    // Backfill / server mode: load doc + download bytes if fileBytes not provided.
    let docRow: any = null;
    if (!fileBytes) {
      const { data: doc, error: docErr } = await supabase
        .from("family_documents")
        .select("id, family_id, file_path, mime_type, uploaded_by")
        .eq("id", documentId)
        .maybeSingle();
      if (docErr || !doc) {
        throw new Error("Document not found for backfill");
      }
      docRow = doc;
      mimeType = mimeType || doc.mime_type;
      const { data: file, error: dlErr } = await supabase.storage
        .from("family-documents")
        .download(doc.file_path);
      if (dlErr || !file) {
        throw new Error("Failed to download stored document");
      }
      const ab = await file.arrayBuffer();
      const u8 = new Uint8Array(ab);
      let binary = "";
      for (let i = 0; i < u8.length; i++) binary += String.fromCharCode(u8[i]);
      fileBytes = btoa(binary);
      if (!user) user = { id: doc.uploaded_by };
    }
    if (!user) {
      // Internal mode without doc.uploaded_by fallback; use null-safe placeholder.
      user = { id: "00000000-0000-0000-0000-000000000000" };
    }

    // Get family members for context
    const { data: familyMembers } = await supabase
      .from("family_members")
      .select("user_id, role, relationship_type")
      .eq("family_id", familyId);

    const memberIds = familyMembers?.map(m => m.user_id) || [];
    
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", memberIds);

    // Extract document text based on file type
    let documentContent: string;

    // Decode base64 file bytes
    const binaryString = atob(fileBytes);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const arrayBuffer = bytes.buffer;

    const normalizedMimeType = (mimeType || "").toLowerCase();
    
    if (normalizedMimeType === "application/pdf") {
      documentContent = await extractPdfText(arrayBuffer, ANTHROPIC_API_KEY);
    } else if (normalizedMimeType.startsWith("image/")) {
      documentContent = await extractImageText(arrayBuffer, normalizedMimeType, ANTHROPIC_API_KEY);
    } else if (normalizedMimeType === "text/plain" || normalizedMimeType.includes("text")) {
      documentContent = new TextDecoder().decode(bytes);
    } else {
      try {
        documentContent = new TextDecoder().decode(bytes);
        if (documentContent.length < 50 || !/[a-zA-Z]{3,}/.test(documentContent)) {
          throw new Error("Content appears to be binary");
        }
      } catch {
        return new Response(
          JSON.stringify({ error: `Unsupported file type: ${mimeType}. Please upload PDF, image, or text files.` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    if (!documentContent || documentContent.trim().length < 50) {
      return new Response(
        JSON.stringify({ error: "Could not extract sufficient text from the document." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Document text extracted for aftercare analysis", { characters: documentContent.length });

    // Call Anthropic to extract structured aftercare data + accountability targets.
    const systemPrompt = `You analyze clinical discharge plans, aftercare plans, and treatment plans for a family recovery support app called FamilyBridge.

Extract ONLY what is actually written in the document. Do not invent recommendations or frequencies.

Rules:
- If the plan says "3 meetings per week", set minimum_expected_per_week = 3 on that recommendation and on the matching accountability_target.
- "weekly" => 1 per week. "twice weekly" => 2. "monthly" => leave minimum_expected_per_week null but keep frequency text.
- Identify psychiatry separately from therapy and medical.
- Identify drug testing separately and also list under drug_testing_expectations.
- Identify IOP vs PHP when possible.
- evidence_quote: short exact phrase from the document (<= 200 chars). Never paste the whole document.
- accountability_relevant = true when behavior can be measured (meetings, therapy, psychiatry, medical visits, IOP/PHP, sober living rules, drug tests, medication adherence). Otherwise false.
- checkin_category: one of meeting, therapy, psychiatry, medical, iop, php, sober_living, drug_test, other, or null.
- Tone of fiis_summary: compassionate, direct, practical. No shame. No generic inspirational fluff.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 4096,
        system: systemPrompt,
        messages: [
          { role: "user", content: `Please analyze this discharge/aftercare plan and extract all recommendations:\n\n${documentContent}` }
        ],
        tools: [
          {
            name: "analyze_aftercare_document",
            description: "Extract structured aftercare, accountability targets, drug-testing expectations, and a FIIS summary from a discharge/aftercare/treatment plan.",
            input_schema: {
              type: "object",
              properties: {
                patient_name: { type: "string" },
                discharge_date: { type: "string" },
                facility_name: { type: "string" },
                level_of_care: { type: "string" },
                recommendations: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      recommendation_type: {
                        type: "string",
                        enum: ["therapy","meetings","outpatient","php","iop","residential","sober_living","psychiatry","medical","medication_management","drug_testing","case_management","family_therapy","wellness","other"],
                      },
                      title: { type: "string" },
                      description: { type: "string" },
                      facility_name: { type: "string" },
                      provider_name: { type: "string" },
                      recommended_duration: { type: "string" },
                      frequency: { type: "string" },
                      minimum_expected_per_week: { type: "number" },
                      start_date: { type: "string" },
                      end_date: { type: "string" },
                      therapy_type: { type: "string" },
                      evidence_quote: { type: "string" },
                      accountability_relevant: { type: "boolean" },
                      checkin_category: {
                        type: "string",
                        enum: ["meeting","therapy","psychiatry","medical","iop","php","sober_living","drug_test","other"],
                      },
                    },
                    required: ["recommendation_type", "title"],
                  },
                },
                medication_instructions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      medication_name: { type: "string" },
                      dose: { type: "string" },
                      frequency: { type: "string" },
                      prescriber: { type: "string" },
                      instruction: { type: "string" },
                      follow_up_required: { type: "boolean" },
                    },
                    required: ["medication_name"],
                  },
                },
                appointment_expectations: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      appointment_type: { type: "string" },
                      title: { type: "string" },
                      provider_or_facility: { type: "string" },
                      frequency: { type: "string" },
                      date_or_schedule: { type: "string" },
                      location: { type: "string" },
                      evidence_quote: { type: "string" },
                    },
                    required: ["appointment_type", "title"],
                  },
                },
                drug_testing_expectations: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      test_type: { type: "string" },
                      panel: { type: "string" },
                      frequency: { type: "string" },
                      random_testing: { type: "boolean" },
                      required_by: { type: "string" },
                      start_date: { type: "string" },
                      duration: { type: "string" },
                      evidence_quote: { type: "string" },
                    },
                  },
                },
                accountability_targets: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      target_type: {
                        type: "string",
                        enum: ["meetings_per_week","therapy_attendance","psychiatry_attendance","medical_appointments","iop_php_attendance","sober_living_compliance","drug_testing","medication_adherence","family_participation","other"],
                      },
                      label: { type: "string" },
                      expected_frequency: { type: "string" },
                      minimum_expected_per_week: { type: "number" },
                      applies_to_user_name: { type: "string" },
                      evidence_quote: { type: "string" },
                      importance: { type: "string", enum: ["low","medium","high","critical"] },
                    },
                    required: ["target_type", "label"],
                  },
                },
                fiis_summary: {
                  type: "object",
                  properties: {
                    plain_language_plan: { type: "string" },
                    highest_priority_actions: { type: "array", items: { type: "string" } },
                    accountability_risks: { type: "array", items: { type: "string" } },
                    family_support_guidance: { type: "array", items: { type: "string" } },
                    provider_follow_up_questions: { type: "array", items: { type: "string" } },
                  },
                },
              },
              required: ["recommendations"],
            },
          },
        ],
        tool_choice: { type: "tool", name: "analyze_aftercare_document" }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      await response.text();
      console.error("Anthropic error", { status: response.status, feature: "analyze-aftercare-document" });
      throw new Error("AI analysis failed");
    }

    const aiResult = await response.json();
    const toolUse = aiResult.content?.find((b: any) => b.type === "tool_use");

    if (!toolUse || toolUse.name !== "analyze_aftercare_document") {
      throw new Error("Unexpected AI response format");
    }

    const extractedData = toolUse.input;
    const recommendations: ExtractedAftercare[] = extractedData.recommendations || [];
    const accountabilityTargets: ExtractedTarget[] = extractedData.accountability_targets || [];
    const drugTestingExpectations: any[] = extractedData.drug_testing_expectations || [];
    const fiisSummary = extractedData.fiis_summary || null;
    const patientName = extractedData.patient_name;
    const facilityName = extractedData.facility_name;

    console.log("Aftercare analysis completed", { recommendationsFound: recommendations.length });

    // Try to match patient name to a family member if not explicitly provided
    let resolvedTargetUserId = targetUserId;
    if (!resolvedTargetUserId && patientName) {
      const matchedProfile = profiles?.find(p => 
        p.full_name?.toLowerCase().includes(patientName.toLowerCase()) ||
        patientName.toLowerCase().includes(p.full_name?.toLowerCase() || "")
      );
      if (matchedProfile) {
        resolvedTargetUserId = matchedProfile.id;
        console.log("Matched patient name to a family member");
      }
    }

    // If still no target user, try to find a recovering member
    if (!resolvedTargetUserId) {
      const recoveringMember = familyMembers?.find(m => m.role === "recovering" || m.relationship_type === "recovering");
      if (recoveringMember) {
        resolvedTargetUserId = recoveringMember.user_id;
        console.log("Using recovering member as target for aftercare import");
      }
    }

    if (!resolvedTargetUserId) {
      return new Response(
        JSON.stringify({ 
          error: "Could not determine which family member this aftercare plan is for. Please specify the target member.",
          recommendations: recommendations.length,
          patientName
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check for existing active aftercare plan
    const { data: existingPlan } = await supabase
      .from("aftercare_plans")
      .select("id")
      .eq("family_id", familyId)
      .eq("target_user_id", resolvedTargetUserId)
      .eq("is_active", true)
      .single();

    let planId: string;

    if (existingPlan) {
      planId = existingPlan.id;
      console.log("Using existing aftercare plan for import");
    } else {
      // Create new aftercare plan
      const { data: newPlan, error: planError } = await supabase
        .from("aftercare_plans")
        .insert({
          family_id: familyId,
          target_user_id: resolvedTargetUserId,
          created_by: user.id,
          notes: facilityName ? `Imported from ${facilityName} discharge plan` : "Imported from uploaded discharge plan",
          is_active: true
        })
        .select("id")
        .single();

      if (planError) {
        console.error("Error creating aftercare plan", planError.message);
        throw new Error("Failed to create aftercare plan");
      }

      planId = newPlan.id;
      console.log("Created new aftercare plan for import");
    }

    // Insert recommendations + create accountability_plan_targets in lock-step.
    let recommendationsCreated = 0;
    let targetsCreated = 0;

    for (const rec of recommendations) {
      // Upsert-by-(plan_id, source_document_id, lower(trim(title))) using unique index.
      const { data: existingRec } = await supabase
        .from("aftercare_recommendations")
        .select("id")
        .eq("plan_id", planId)
        .eq("source_document_id", documentId)
        .ilike("title", rec.title.trim())
        .maybeSingle();

      let recId = existingRec?.id as string | undefined;

      if (!recId) {
        const mapping = mapRecommendationToTarget(rec);
        const { data: insertedRec, error: insertError } = await supabase
          .from("aftercare_recommendations")
          .insert({
            plan_id: planId,
            recommendation_type: rec.recommendation_type,
            title: rec.title,
            description: rec.description || null,
            facility_name: rec.facility_name || null,
            provider_name: rec.provider_name || null,
            recommended_duration: rec.recommended_duration || null,
            frequency: rec.frequency || null,
            therapy_type: rec.therapy_type || null,
            minimum_expected_per_week: rec.minimum_expected_per_week ?? null,
            accountability_relevant: rec.accountability_relevant ?? true,
            checkin_category: rec.checkin_category ?? mapping?.checkin_category ?? null,
            source_document_id: documentId,
            source_evidence_quote: rec.evidence_quote || null,
            start_date: rec.start_date || null,
            end_date: rec.end_date || null,
            is_completed: false,
          })
          .select("id")
          .single();

        if (insertError) {
          console.error("Error creating recommendation", insertError.message);
          continue;
        }
        recId = insertedRec.id;
        recommendationsCreated++;
      }

      // Create the matching accountability target if relevant.
      const mapping = mapRecommendationToTarget(rec);
      if (recId && mapping && (rec.accountability_relevant ?? true)) {
        const label = rec.title || mapping.target_type;
        const { data: existingTarget } = await supabase
          .from("accountability_plan_targets")
          .select("id")
          .eq("family_id", familyId)
          .eq("source_document_id", documentId)
          .eq("target_type", mapping.target_type)
          .ilike("label", label.trim())
          .maybeSingle();

        if (!existingTarget) {
          const { error: tgtErr } = await supabase
            .from("accountability_plan_targets")
            .insert({
              family_id: familyId,
              target_user_id: resolvedTargetUserId,
              source_document_id: documentId,
              source_aftercare_recommendation_id: recId,
              target_type: mapping.target_type,
              label,
              checkin_category: mapping.checkin_category,
              expected_frequency: rec.frequency || null,
              minimum_expected_per_week: rec.minimum_expected_per_week ?? null,
              start_date: rec.start_date || null,
              end_date: rec.end_date || null,
              importance: "medium",
              evidence_quote: rec.evidence_quote || null,
              review_status: "pending",
              is_active: false,
              created_by: user.id,
            });
          if (!tgtErr) targetsCreated++;
          else console.error("Error creating plan target", tgtErr.message);
        }
      }
    }

    // Add explicit accountability_targets that the AI flagged separately.
    for (const tgt of accountabilityTargets) {
      const { data: existing } = await supabase
        .from("accountability_plan_targets")
        .select("id")
        .eq("family_id", familyId)
        .eq("source_document_id", documentId)
        .eq("target_type", tgt.target_type)
        .ilike("label", (tgt.label || tgt.target_type).trim())
        .maybeSingle();
      if (existing) continue;

      const { error: tgtErr } = await supabase
        .from("accountability_plan_targets")
        .insert({
          family_id: familyId,
          target_user_id: resolvedTargetUserId,
          source_document_id: documentId,
          target_type: tgt.target_type,
          label: tgt.label || tgt.target_type,
          expected_frequency: tgt.expected_frequency || null,
          minimum_expected_per_week: tgt.minimum_expected_per_week ?? null,
          importance: tgt.importance || "medium",
          evidence_quote: tgt.evidence_quote || null,
          review_status: "pending",
          is_active: false,
          created_by: user.id,
        });
      if (!tgtErr) targetsCreated++;
    }

    // Update the document to mark it as analyzed
    const usefulFound = recommendationsCreated > 0 || targetsCreated > 0 || drugTestingExpectations.length > 0;
    await supabase
      .from("family_documents")
      .update({
        fiis_analyzed: true,
        fiis_analyzed_at: new Date().toISOString(),
        recommendations_extracted: recommendationsCreated,
        fiis_analysis_status: usefulFound ? "complete" : "no_findings",
        fiis_analysis_error: null,
        fiis_summary: fiisSummary || null,
      })
      .eq("id", documentId);

    console.log("Stored aftercare recommendations", { recommendationsCreated, targetsCreated });

    return new Response(
      JSON.stringify({
        success: true,
        recommendationsFound: recommendations.length,
        recommendationsCreated,
        accountabilityTargetsCreated: targetsCreated,
        targetsCreated,
        drugTestingExpectations: drugTestingExpectations.length,
        planId,
        patientName,
        facilityName,
        fiisSummary,
        message: recommendationsCreated > 0
          ? `Created ${recommendationsCreated} aftercare items and ${targetsCreated} pending accountability targets (awaiting approval).`
          : "No clear aftercare recommendations found in this document.",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error analyzing aftercare document", getErrorMessage(error));
    if (documentIdForStatus && supabaseForStatus) {
      try {
        await supabaseForStatus
          .from("family_documents")
          .update({
            fiis_analysis_status: "failed",
            fiis_analysis_error: getErrorMessage(error).slice(0, 500),
          })
          .eq("id", documentIdForStatus);
      } catch (_) { /* ignore */ }
    }
    return new Response(
      JSON.stringify({ error: getErrorMessage(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
