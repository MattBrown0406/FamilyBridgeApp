import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CLAUDE_MODEL = "claude-haiku-4-5";

interface ExtractedBoundary {
  content: string;
  consequence: string | null;
  target_member_name: string | null;
  author_name: string | null;
  rationale?: string | null;
}

interface ProposedValue {
  value_key: string;
  confidence: number;
  evidence_quote: string;
  reason: string;
}

interface ProposedGoal {
  goal_key: string;
  confidence: number;
  evidence_quote: string;
  reason: string;
}

interface FiisSummary {
  family_strengths: string[];
  alignment_risks: string[];
  suggested_next_steps: string[];
  moderator_note: string;
}

const FAMILY_VALUES_OPTIONS = [
  "honesty",
  "accountability",
  "boundaries",
  "support_not_enabling",
  "patience",
  "forgiveness",
  "self_care",
  "consistency",
  "communication",
  "hope",
];

const COMMON_GOALS_OPTIONS = [
  "complete_intervention",
  "enter_treatment",
  "complete_treatment",
  "establish_support_network",
  "family_therapy_sessions",
  "90_meetings_90_days",
  "living_amends_plan",
  "family_recovery_milestones",
  "rebuild_financial_trust",
  "one_year_celebration",
];

const MAX_VALUES_PER_FAMILY = 2;
const MAX_GOALS_PER_DOCUMENT = 3;
const MAX_PROPOSED_VALUES = 2;
const MAX_PROPOSED_GOALS = 3;

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

// Extract text from PDF using Claude (handles both digital and scanned PDFs)
async function extractPdfText(pdfBytes: ArrayBuffer, anthropicKey: string): Promise<string> {
  console.log("Starting PDF text extraction for intervention letter");

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
  console.log("Starting image text extraction for intervention letter");

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
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentId, familyId, fileBytes, mimeType } = await req.json();

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

    // Get authorization header for user context
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user is a family member
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(
        JSON.stringify({ error: "Invalid authorization" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify membership
    const { data: membership } = await supabase
      .from("family_members")
      .select("id, role")
      .eq("family_id", familyId)
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return new Response(
        JSON.stringify({ error: "Not a member of this family" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get family members for context
    const { data: familyMembers } = await supabase
      .from("family_members")
      .select("user_id")
      .eq("family_id", familyId);

    const memberIds = familyMembers?.map(m => m.user_id) || [];
    
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", memberIds);

    const memberNames = profiles?.map(p => p.full_name).filter(Boolean) || [];

    // Extract document text based on file type
    let documentContent: string;
    
    if (!fileBytes) {
      return new Response(
        JSON.stringify({ error: "No file content provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Decode base64 file bytes
    const binaryString = atob(fileBytes);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const arrayBuffer = bytes.buffer;

    const normalizedMimeType = (mimeType || "").toLowerCase();
    
    if (normalizedMimeType === "application/pdf") {
      // Use Claude to extract text from PDF (handles scanned documents)
      documentContent = await extractPdfText(arrayBuffer, ANTHROPIC_API_KEY);
    } else if (normalizedMimeType.startsWith("image/")) {
      // Use Claude vision for images
      documentContent = await extractImageText(arrayBuffer, normalizedMimeType, ANTHROPIC_API_KEY);
    } else if (normalizedMimeType === "text/plain" || normalizedMimeType.includes("text")) {
      // Plain text files
      documentContent = new TextDecoder().decode(bytes);
    } else {
      // Try to read as text for other types (doc, docx may need special handling)
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
        JSON.stringify({ error: "Could not extract sufficient text from the document. Please ensure the document contains readable text." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Document text extracted for intervention-letter analysis", { characters: documentContent.length });

    // FIIS: analyze the intervention letter for boundaries, values, and family support goals
    const systemPrompt = `You are FIIS, a compassionate clinical-informed AI that helps families turn intervention letters into practical recovery structure. You read the family's own language and gently extract:
1. Clear boundaries (what a family member will or will not do/allow), with consequences when stated. If a boundary is stated without a consequence, set consequence to null and set rationale to "consequence missing — needs moderator review".
2. Family values that the letter actually reflects in its own words.
3. Proposed family-support goals that build practical structure for the FAMILY's recovery — never promises about what the addicted loved one will do.
4. A short FIIS summary for moderator/family review.

Tone rules (strict):
- Do not shame the family. Do not over-medicalize. Use compassionate, direct, practical language.
- Boundaries must be specific and behavioral.
- Values must be grounded in the letter's actual language — no generic inspirational fluff.
- Goals must support the family system, not control the recovering person.
- Never fabricate evidence quotes. If evidence is weak, return an empty array for that section.

Author identification: Identify who WROTE the letter (signature, "Love, [name]", "Sincerely, [name]", "I am your [relationship]"). author_name on each boundary should be the writer, not the addressee.

Value keys MUST be exactly one of: ${FAMILY_VALUES_OPTIONS.join(", ")}.
Goal keys MUST be exactly one of: ${COMMON_GOALS_OPTIONS.join(", ")}.
Prefer values like boundaries, honesty, accountability, support_not_enabling, consistency, communication when the text actually supports them.

Return at most ${MAX_PROPOSED_VALUES} proposed_values and at most ${MAX_PROPOSED_GOALS} proposed_goals. Confidence is 0.0–1.0.

Family member names in this group: ${memberNames.join(", ") || "(unknown)"}.`;

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
          { role: "user", content: `Please analyze this intervention letter and extract boundaries, family values, family-support goals, and a brief FIIS summary:\n\n${documentContent}` }
        ],
        tools: [
          {
            name: "analyze_intervention_letter",
            description: "Extract boundaries, family values, proposed family-support goals, and a FIIS summary from an intervention letter.",
            input_schema: {
              type: "object",
              properties: {
                boundaries: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      content: { type: "string", description: "The boundary statement itself" },
                      consequence: { type: ["string", "null"], description: "Consequence if violated, or null if not stated" },
                      target_member_name: { type: ["string", "null"], description: "Recovering member this boundary is directed at, or null" },
                      author_name: { type: ["string", "null"], description: "Who WROTE the boundary (letter signature/context)" },
                      rationale: { type: ["string", "null"], description: "Optional note such as 'consequence missing — needs moderator review'" }
                    },
                    required: ["content", "consequence", "target_member_name", "author_name", "rationale"],
                    additionalProperties: false
                  }
                },
                proposed_values: {
                  type: "array",
                  description: `At most ${MAX_PROPOSED_VALUES} values grounded in the letter's language.`,
                  items: {
                    type: "object",
                    properties: {
                      value_key: { type: "string", enum: FAMILY_VALUES_OPTIONS },
                      confidence: { type: "number" },
                      evidence_quote: { type: "string", description: "Short quote from the letter that supports this value" },
                      reason: { type: "string", description: "Brief, compassionate reason this value fits" }
                    },
                    required: ["value_key", "confidence", "evidence_quote", "reason"],
                    additionalProperties: false
                  }
                },
                proposed_goals: {
                  type: "array",
                  description: `At most ${MAX_PROPOSED_GOALS} family-support goals.`,
                  items: {
                    type: "object",
                    properties: {
                      goal_key: { type: "string", enum: COMMON_GOALS_OPTIONS },
                      confidence: { type: "number" },
                      evidence_quote: { type: "string" },
                      reason: { type: "string" }
                    },
                    required: ["goal_key", "confidence", "evidence_quote", "reason"],
                    additionalProperties: false
                  }
                },
                fiis_summary: {
                  type: "object",
                  properties: {
                    family_strengths: { type: "array", items: { type: "string" } },
                    alignment_risks: { type: "array", items: { type: "string" } },
                    suggested_next_steps: { type: "array", items: { type: "string" } },
                    moderator_note: { type: "string" }
                  },
                  required: ["family_strengths", "alignment_risks", "suggested_next_steps", "moderator_note"],
                  additionalProperties: false
                }
              },
              required: ["boundaries", "proposed_values", "proposed_goals", "fiis_summary"],
              additionalProperties: false
            }
          }
        ],
        tool_choice: { type: "tool", name: "analyze_intervention_letter" }
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
      console.error("Anthropic error", { status: response.status, feature: "analyze-intervention-letter" });
      throw new Error("AI analysis failed");
    }

    const aiResult = await response.json();
    const toolUse = aiResult.content?.find((b: any) => b.type === "tool_use");

    if (!toolUse || toolUse.name !== "analyze_intervention_letter") {
      throw new Error("Unexpected AI response format");
    }

    const extractedData = toolUse.input;
    const boundaries: ExtractedBoundary[] = Array.isArray(extractedData.boundaries) ? extractedData.boundaries : [];
    const proposedValuesRaw: ProposedValue[] = Array.isArray(extractedData.proposed_values) ? extractedData.proposed_values : [];
    const proposedGoalsRaw: ProposedGoal[] = Array.isArray(extractedData.proposed_goals) ? extractedData.proposed_goals : [];
    const fiisSummary: FiisSummary = extractedData.fiis_summary || {
      family_strengths: [],
      alignment_risks: [],
      suggested_next_steps: [],
      moderator_note: "",
    };

    // Whitelist values/goals against allowed keys and cap counts
    const proposedValues = proposedValuesRaw
      .filter((v) => v && FAMILY_VALUES_OPTIONS.includes(v.value_key))
      .slice(0, MAX_PROPOSED_VALUES);
    const proposedGoals = proposedGoalsRaw
      .filter((g) => g && COMMON_GOALS_OPTIONS.includes(g.goal_key))
      .slice(0, MAX_PROPOSED_GOALS);

    // Create boundaries in the database
    let boundariesCreated = 0;
    
    for (const boundary of boundaries) {
      // Find target user if name was extracted
      let targetUserId = null;
      if (boundary.target_member_name) {
        const matchedProfile = profiles?.find(p => 
          p.full_name?.toLowerCase().includes(boundary.target_member_name!.toLowerCase())
        );
        if (matchedProfile) {
          targetUserId = matchedProfile.id;
        }
      }

      // Try to match the author to an existing family member
      let authorMatchedUserId = null;
      if (boundary.author_name) {
        const matchedAuthor = profiles?.find(p => 
          p.full_name?.toLowerCase().includes(boundary.author_name!.toLowerCase())
        );
        if (matchedAuthor) {
          authorMatchedUserId = matchedAuthor.id;
        }
      }

      // Insert boundary with 'pending' status for moderator review
      // The author_name field stores who wrote the boundary (from the letter)
      // created_by is the user who uploaded/analyzed it
      const { error: insertError } = await supabase
        .from("family_boundaries")
        .insert({
          family_id: familyId,
          created_by: user.id,
          content: boundary.content,
          consequence: boundary.consequence || null,
          target_user_id: targetUserId,
          author_name: boundary.author_name || null,
          author_matched_user_id: authorMatchedUserId,
          status: "pending" // Requires moderator approval
        });

      if (!insertError) {
        boundariesCreated++;
      } else {
        console.error("Error creating boundary", insertError.message);
      }
    }

    // Insert proposed family values (conflict-safe, respecting the 2-value cap)
    const valuesProposed = proposedValues.length;
    let valuesCreated = 0;
    let valuesSkipped = 0;
    const valuesSkippedDueToExistingLimit: string[] = [];

    if (valuesProposed > 0) {
      const { data: existingValues } = await supabase
        .from("family_values")
        .select("value_key")
        .eq("family_id", familyId);
      const existingValueKeys = new Set((existingValues || []).map((v: any) => v.value_key));
      const remainingSlots = Math.max(0, MAX_VALUES_PER_FAMILY - existingValueKeys.size);

      for (const v of proposedValues) {
        if (existingValueKeys.has(v.value_key)) {
          valuesSkipped++;
          continue;
        }
        if (valuesCreated >= remainingSlots) {
          valuesSkippedDueToExistingLimit.push(v.value_key);
          continue;
        }
        const { error: vErr } = await supabase
          .from("family_values")
          .upsert(
            { family_id: familyId, value_key: v.value_key, selected_by: user.id },
            { onConflict: "family_id,value_key", ignoreDuplicates: true }
          );
        if (!vErr) {
          valuesCreated++;
          existingValueKeys.add(v.value_key);
        } else {
          console.error("Error inserting family value", vErr.message);
        }
      }
    }

    // Insert proposed family-support goals (conflict-safe, max 3 per document)
    const goalsProposed = proposedGoals.length;
    let goalsCreated = 0;

    if (goalsProposed > 0) {
      const { data: existingGoals } = await supabase
        .from("family_common_goals")
        .select("goal_key")
        .eq("family_id", familyId);
      const existingGoalKeys = new Set((existingGoals || []).map((g: any) => g.goal_key));

      for (const g of proposedGoals) {
        if (goalsCreated >= MAX_GOALS_PER_DOCUMENT) break;
        if (existingGoalKeys.has(g.goal_key)) continue;
        const { error: gErr } = await supabase
          .from("family_common_goals")
          .upsert(
            { family_id: familyId, goal_key: g.goal_key, selected_by: user.id },
            { onConflict: "family_id,goal_key", ignoreDuplicates: true }
          );
        if (!gErr) {
          goalsCreated++;
          existingGoalKeys.add(g.goal_key);
        } else {
          console.error("Error inserting family goal", gErr.message);
        }
      }
    }

    // Update the document to mark it as analyzed
    await supabase
      .from("family_documents")
      .update({
        fiis_analyzed: true,
        fiis_analyzed_at: new Date().toISOString(),
        boundaries_extracted: boundariesCreated
      })
      .eq("id", documentId);

    // Safe logging — counts only, never letter contents
    console.log("Intervention-letter analysis completed", {
      boundariesFound: boundaries.length,
      boundariesCreated,
      valuesProposed,
      valuesCreated,
      goalsProposed,
      goalsCreated,
    });

    // Build user-facing message
    const parts: string[] = [];
    if (boundariesCreated > 0) parts.push(`${boundariesCreated} boundar${boundariesCreated === 1 ? "y" : "ies"}`);
    if (valuesCreated > 0) parts.push(`${valuesCreated} guiding value${valuesCreated === 1 ? "" : "s"}`);
    if (goalsCreated > 0) parts.push(`${goalsCreated} family support goal${goalsCreated === 1 ? "" : "s"}`);

    let message: string;
    if (parts.length === 0 && boundaries.length === 0 && valuesProposed === 0 && goalsProposed === 0) {
      message = "FIIS did not find clear boundaries, values, or goals in this document.";
    } else if (parts.length === 0) {
      message = "FIIS reviewed this letter; existing family settings were preserved.";
    } else if (parts.length === 1 && boundariesCreated > 0 && valuesCreated === 0 && goalsCreated === 0) {
      message = `FIIS extracted ${boundariesCreated} boundar${boundariesCreated === 1 ? "y" : "ies"} for moderator review.`;
    } else {
      const last = parts.pop();
      message = `FIIS extracted ${parts.length ? parts.join(", ") + ", and " : ""}${last} for review.`;
    }

    return new Response(
      JSON.stringify({
        success: true,
        boundariesFound: boundaries.length,
        boundariesCreated,
        valuesProposed,
        valuesCreated,
        valuesSkipped,
        valuesSkippedDueToExistingLimit,
        goalsProposed,
        goalsCreated,
        fiisSummary,
        message,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error analyzing intervention letter", getErrorMessage(error));
    return new Response(
      JSON.stringify({ error: getErrorMessage(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
