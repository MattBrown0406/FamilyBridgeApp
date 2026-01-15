import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============================================================================
// FIIS — PRIMARY SYSTEM PROMPT
// Family Intervention Intelligence System Master Prompt
// ============================================================================

const FIIS_SYSTEM_PROMPT = `You are FIIS — a shared observer embedded inside a private family recovery system.

You continuously observe family interactions, communications, financial exchanges, location check-ins, anonymous observations, and stated values and boundaries.

You interpret this data using three integrated professional lenses:
1. An addiction-trained family therapist
2. A person in long-term recovery with sponsorship experience
3. A recovery-inclusive specialist who evaluates progress within the recovery model chosen by the individual

You analyze patterns over time, not isolated events.

Your function is to:
- Identify patterns of recovery progress or risk
- Identify enabling, boundary erosion, or system misalignment
- Reinforce healthy behavior immediately
- Warn early when patterns indicate increased risk

Your feedback is:
- Direct
- Compassionate
- Solution-oriented
- Visible to the group

You do not diagnose, treat, or replace professional care.

When risk thresholds are met, you clearly recommend inviting a professional moderator (interventionist, therapist, or recovery professional) into the group.

Your priority is clarity, alignment, and early course-correction.

---

HARD GUARDRAILS & SAFETY CONSTRAINTS (Always Applied):

You must adhere to the following constraints at all times:
- Do not provide medical, psychiatric, or legal advice
- Do not diagnose addiction, mental illness, or relapse
- Do not shame, threaten, or coerce any participant
- Do not encourage secrecy or private alliances
- Do not override family-defined values or boundaries

If imminent harm, violence, or self-harm is indicated:
- State clearly that immediate outside professional help is necessary
- Encourage contacting emergency or crisis resources
- Do not attempt to manage the situation internally

If patterns indicate escalating risk:
- Name the pattern plainly
- Recommend professional moderation
- Explain why the system alone may not be sufficient

---

BEHAVIORAL INTERPRETATION RULES:

Pattern Rules:
- Never comment on a single message unless it represents:
  - A boundary violation
  - A financial manipulation attempt
  - A safety risk
- Otherwise, wait for pattern confirmation (minimum 2–3 instances)

Priority Hierarchy:
1. Safety
2. Boundary integrity
3. Financial dynamics
4. Recovery consistency
5. Emotional tone shifts

Language Rules:
- Use observable facts ("In the last 10 days…")
- Avoid assumptions about intent
- Avoid clinical labels
- Use "this pattern suggests…" rather than "this means…"

---

RISK-ESCALATION FRAMEWORK:

LEVEL 0 — STABLE / SUPPORTIVE SYSTEM
Indicators:
- Boundaries respected
- Financial requests align with agreements
- Recovery actions match stated commitments
- Family responses are consistent
Your Response:
- Reinforce progress
- Encourage consistency
- No escalation language

LEVEL 1 — EARLY DRIFT (LOW RISK)
Indicators:
- Minor boundary exceptions
- Inconsistent follow-through
- Emotional reactivity increasing
- One-off financial exceptions
Your Response:
"This appears to be a small deviation from the boundary you set. Small exceptions can become patterns if left unaddressed."
Action: Suggest recalibration. No professional recommendation yet.

LEVEL 2 — PATTERN FORMATION (MODERATE RISK)
Indicators (2+ occurrences):
- Repeated financial requests outside agreements
- Family members disagreeing publicly about boundaries
- Recovery behaviors becoming symbolic rather than consistent
- Increased defensiveness or justification language
Your Response:
"This pattern is increasing system strain and reducing clarity. Families often struggle to correct this without neutral guidance."
Action: Soft recommendation for professional moderator. Frame as support, not failure.

LEVEL 3 — SYSTEM STRAIN (HIGH RISK)
Indicators (3+ occurrences or escalation):
- Boundaries repeatedly overridden
- Money used to stabilize emotions or avoid conflict
- Family members splitting into sides
- Recovery participation declining or becoming performative
Your Response:
"At this stage, the family system is carrying more than it can sustainably manage alone. Professional moderation is strongly recommended to prevent further harm."
Action: Clear recommendation to invite a professional. Explain risks of continuing without support.

LEVEL 4 — CRITICAL RISK (IMMEDIATE ACTION)
Indicators:
- Suspected relapse behavior patterns
- Safety concerns
- Financial crisis tied to substance use or compulsive behavior
- Escalating conflict or emotional volatility
Your Response:
"This situation exceeds what a self-moderated family system can safely manage."
Action: Explicit recommendation. Encourage off-platform professional help. Do not attempt resolution internally.

---

PROFESSIONAL MODERATOR INVITATION LOGIC:

Trigger Conditions:
- Sustained Level 2 patterns for 14+ days
- Any Level 3 pattern
- Immediate Level 4 indicators

How You Frame the Invitation:
- Normalize professional involvement
- Remove shame
- Emphasize neutrality and protection of relationships

Standard Language:
"Inviting a professional moderator is not a sign of failure. It is often the most effective way to preserve relationships, restore clarity, and reduce long-term harm."

---

Remember: This structure prevents overreaction, makes escalation predictable and transparent, protects families from waiting too long, positions professionals as support not punishment, and keeps you authoritative without overstepping.`;

interface AnalysisRequest {
  familyId: string;
  observations: Array<{
    type: string;
    content: string;
    occurred_at: string;
    user_name?: string;
  }>;
  autoEvents: Array<{
    type: string;
    data: Record<string, unknown>;
    occurred_at: string;
    user_name?: string;
  }>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user auth
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { familyId, observations, autoEvents }: AnalysisRequest = await req.json();

    // Verify user is family member
    const { data: membership } = await supabase
      .from("family_members")
      .select("id")
      .eq("family_id", familyId)
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return new Response(JSON.stringify({ error: "Not a family member" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch family values and boundaries for context
    const [valuesResult, boundariesResult, goalsResult] = await Promise.all([
      supabase.from("family_values").select("value_key").eq("family_id", familyId),
      supabase.from("family_boundaries").select("content, status, target_user_id").eq("family_id", familyId).eq("status", "approved"),
      supabase.from("family_common_goals").select("goal_key, completed_at").eq("family_id", familyId),
    ]);

    // Build context about family values and boundaries
    let familyContext = "";
    if (valuesResult.data && valuesResult.data.length > 0) {
      familyContext += `FAMILY VALUES: ${valuesResult.data.map(v => v.value_key).join(", ")}\n\n`;
    }
    if (boundariesResult.data && boundariesResult.data.length > 0) {
      familyContext += `APPROVED BOUNDARIES:\n${boundariesResult.data.map((b, i) => `${i + 1}. ${b.content}`).join("\n")}\n\n`;
    }
    if (goalsResult.data && goalsResult.data.length > 0) {
      familyContext += `FAMILY GOALS: ${goalsResult.data.map(g => `${g.goal_key}${g.completed_at ? " (completed)" : ""}`).join(", ")}\n\n`;
    }

    // Build the analysis prompt
    let dataDescription = familyContext + "Recent family observations and events:\n\n";

    if (observations.length > 0) {
      dataDescription += "MANUAL OBSERVATIONS:\n";
      observations.forEach((obs, i) => {
        const date = new Date(obs.occurred_at).toLocaleDateString();
        dataDescription += `${i + 1}. [${date}] ${obs.type.toUpperCase()}: "${obs.content}"${obs.user_name ? ` (noted by ${obs.user_name})` : ""}\n`;
      });
      dataDescription += "\n";
    }

    if (autoEvents.length > 0) {
      dataDescription += "SYSTEM-TRACKED EVENTS:\n";
      autoEvents.forEach((event, i) => {
        const date = new Date(event.occurred_at).toLocaleDateString();
        const details = formatEventData(event.type, event.data);
        dataDescription += `${i + 1}. [${date}] ${event.type.replace(/_/g, " ").toUpperCase()}: ${details}${event.user_name ? ` (${event.user_name})` : ""}\n`;
      });
      dataDescription += "\n";
    }

    if (observations.length === 0 && autoEvents.length === 0) {
      return new Response(JSON.stringify({
        what_seeing: "No observations or events have been recorded yet.",
        pattern_signals: [],
        risk_level: 0,
        risk_level_name: "stable",
        contextual_framing: "Begin logging observations to start building a picture of family patterns over time.",
        clarifying_questions: ["What behaviors or conversations have you noticed recently?"],
        what_to_watch: ["Any changes in routines or responsibilities", "Communication patterns between family members"],
        recommend_professional: false,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    dataDescription += `\nAnalyze these ${observations.length + autoEvents.length} data points using the risk-escalation framework. Determine the current risk level (0-4) and provide your assessment.`;

    console.log("Calling Lovable AI for FIIS analysis...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: FIIS_SYSTEM_PROMPT },
          { role: "user", content: dataDescription },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "provide_pattern_analysis",
              description: "Provide structured pattern analysis for the family using the risk-escalation framework",
              parameters: {
                type: "object",
                properties: {
                  risk_level: {
                    type: "number",
                    enum: [0, 1, 2, 3, 4],
                    description: "Current risk level: 0=Stable, 1=Early Drift, 2=Pattern Formation, 3=System Strain, 4=Critical Risk",
                  },
                  risk_level_name: {
                    type: "string",
                    enum: ["stable", "early_drift", "pattern_formation", "system_strain", "critical"],
                    description: "Name of the current risk level",
                  },
                  what_seeing: {
                    type: "string",
                    description: "Brief summary of observed patterns using observable facts and neutral language. Start with 'In the last [timeframe]...' or 'Based on the data...'",
                  },
                  pattern_signals: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        signal_type: {
                          type: "string",
                          enum: [
                            "boundary_respected",
                            "boundary_exception",
                            "boundary_violation",
                            "financial_aligned",
                            "financial_exception",
                            "financial_manipulation",
                            "recovery_consistent",
                            "recovery_inconsistent",
                            "recovery_performative",
                            "emotional_stable",
                            "emotional_reactive",
                            "emotional_volatile",
                            "family_aligned",
                            "family_splitting",
                            "enabling_pattern",
                            "progress_indicator",
                            "regression_indicator",
                            "safety_concern"
                          ],
                        },
                        description: { type: "string" },
                        occurrences: { type: "number", description: "Number of times this pattern has been observed" },
                        confidence: { type: "string", enum: ["emerging", "forming", "clear"] },
                        priority: { type: "string", enum: ["low", "medium", "high", "critical"] },
                      },
                      required: ["signal_type", "description", "occurrences", "confidence", "priority"],
                    },
                    description: "Pattern signals detected in the data, ordered by priority",
                  },
                  contextual_framing: {
                    type: "string",
                    description: "Explanation of why these patterns matter and what they suggest for the family system. Use 'this pattern suggests...' language.",
                  },
                  clarifying_questions: {
                    type: "array",
                    items: { type: "string" },
                    description: "1-3 neutral clarification questions focused on facts, timing, and follow-through",
                  },
                  what_to_watch: {
                    type: "array",
                    items: { type: "string" },
                    description: "Specific behaviors to monitor - early warning signs or early improvement indicators",
                  },
                  recommend_professional: {
                    type: "boolean",
                    description: "Whether to recommend inviting a professional moderator based on risk level and patterns",
                  },
                  professional_recommendation_reason: {
                    type: "string",
                    description: "If recommending a professional, explain why in a non-shaming, supportive way. Use the standard framing language.",
                  },
                  positive_reinforcement: {
                    type: "array",
                    items: { type: "string" },
                    description: "Specific healthy behaviors to acknowledge and reinforce",
                  },
                },
                required: ["risk_level", "risk_level_name", "what_seeing", "pattern_signals", "contextual_framing", "clarifying_questions", "what_to_watch", "recommend_professional"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "provide_pattern_analysis" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI service payment required." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResult = await response.json();
    console.log("AI response received:", JSON.stringify(aiResult).substring(0, 500));

    let analysis;
    try {
      const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        analysis = JSON.parse(toolCall.function.arguments);
      } else {
        // Fallback to content if no tool call
        const content = aiResult.choices?.[0]?.message?.content || "";
        analysis = {
          what_seeing: content,
          pattern_signals: [],
          risk_level: 0,
          risk_level_name: "stable",
          contextual_framing: "Analysis provided as text response.",
          clarifying_questions: [],
          what_to_watch: [],
          recommend_professional: false,
        };
      }
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      analysis = {
        what_seeing: "Unable to parse analysis. Please try again.",
        pattern_signals: [],
        risk_level: 0,
        risk_level_name: "stable",
        contextual_framing: "",
        clarifying_questions: [],
        what_to_watch: [],
        recommend_professional: false,
      };
    }

    // Store the analysis result
    const { error: insertError } = await supabase
      .from("fiis_pattern_analyses")
      .insert({
        family_id: familyId,
        requested_by: user.id,
        analysis_type: "full",
        input_summary: { 
          observation_count: observations.length, 
          event_count: autoEvents.length,
          risk_level: analysis.risk_level,
          risk_level_name: analysis.risk_level_name,
          recommend_professional: analysis.recommend_professional,
        },
        pattern_signals: analysis.pattern_signals || [],
        what_seeing: analysis.what_seeing,
        contextual_framing: analysis.contextual_framing,
        clarifying_questions: analysis.clarifying_questions || [],
        what_to_watch: analysis.what_to_watch || [],
      });

    if (insertError) {
      console.error("Error storing analysis:", insertError);
    }

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("FIIS analyze error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function formatEventData(type: string, data: Record<string, unknown>): string {
  switch (type) {
    case "checkin":
      return `Checked in at ${data.meeting_name || data.meeting_type || "meeting"}${data.address ? ` (${data.address})` : ""}`;
    case "checkout":
      return `Checked out from meeting`;
    case "missed_checkout":
      return `Missed scheduled checkout from meeting`;
    case "financial_request":
      return `Requested $${data.amount} for ${data.reason}`;
    case "financial_approved":
      return `Financial request for $${data.amount} was approved`;
    case "financial_denied":
      return `Financial request for $${data.amount} was denied`;
    case "message_filtered":
      return `A message was filtered for content`;
    case "boundary_proposed":
      return `Proposed boundary: "${data.content}"`;
    case "boundary_approved":
      return `Boundary was approved`;
    case "boundary_violated":
      return `Boundary violation detected: "${data.boundary}"`;
    case "location_request":
      return `Location check-in was requested`;
    case "location_shared":
      return `Shared location${data.address ? ` at ${data.address}` : ""}`;
    case "location_declined":
      return `Declined to share location`;
    case "emotional_checkin":
      return `Emotional check-in: "${data.feeling}"${data.was_bypassed ? " (bypassed)" : ""}`;
    case "emotional_bypass":
      return `Bypassed emotional check-in${data.inferred_state ? ` (inferred: ${data.inferred_state})` : ""}`;
    case "sobriety_reset":
      return `Sobriety counter was reset`;
    case "milestone_reached":
      return `Reached ${data.days} day milestone`;
    default:
      return JSON.stringify(data);
  }
}
