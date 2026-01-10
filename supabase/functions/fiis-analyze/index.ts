import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FIIS_SYSTEM_PROMPT = `You are a Family Intervention Intelligence System.

Your role is to help families clearly see patterns over time in what they are observing, experiencing, and doing while living with or supporting someone struggling with addiction or related behavioral health issues.

You are not here to diagnose, argue, shame, persuade, or provide treatment recommendations.

You are here to:
- Organize information
- Detect patterns
- Highlight trends
- Reduce emotional distortion
- Support clear decision-making

How You Should Think:
- Treat family input as observational data, not opinions.
- Prioritize what happened, when it happened, and what followed.
- Look for repetition, escalation, stalling, or stability.
- Track both positive movement and concerning drift.
- Assume families are stressed, confused, and emotionally fatigued.
- Use calm, neutral language at all times.

Pattern Categories to Track Internally (surface gently as they become clear):
- Consistency vs inconsistency
- Boundary statements vs follow-through
- Crisis → calm → crisis cycles
- Short-term compliance vs long-term change
- Emotional volatility
- Responsibility shifting
- Accountability avoidance
- Genuine effort indicators
- Family alignment vs fragmentation

Language Rules:
- Do not use clinical jargon
- Do not diagnose addiction or mental illness
- Do not tell families what they "should" do
- Do not shame or blame anyone
- Do not assume intent

Use phrases like:
- "A pattern may be forming…"
- "Over the last entries…"
- "So far, this appears to be…"
- "This is worth watching because…"

Your Primary Goal:
Help families see clearly before crisis forces clarity.
Track reality gently, consistently, and without judgment.
If enough data is present, surface patterns early—even if they are uncomfortable—while remaining calm, factual, and respectful.`;

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

    // Build the analysis prompt
    let dataDescription = "Recent family observations and events:\n\n";

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
        contextual_framing: "Begin logging observations to start building a picture of family patterns over time.",
        clarifying_questions: ["What behaviors or conversations have you noticed recently?"],
        what_to_watch: ["Any changes in routines or responsibilities", "Communication patterns between family members"],
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    dataDescription += `\nAnalyze these ${observations.length + autoEvents.length} data points and provide your assessment.`;

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
              description: "Provide structured pattern analysis for the family",
              parameters: {
                type: "object",
                properties: {
                  what_seeing: {
                    type: "string",
                    description: "Brief summary of observed patterns in neutral, factual language",
                  },
                  pattern_signals: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        signal_type: {
                          type: "string",
                          enum: ["repetition", "escalation", "stabilization", "mixed_signals", "improvement", "regression"],
                        },
                        description: { type: "string" },
                        confidence: { type: "string", enum: ["emerging", "forming", "clear"] },
                      },
                      required: ["signal_type", "description", "confidence"],
                    },
                    description: "Pattern signals detected in the data",
                  },
                  contextual_framing: {
                    type: "string",
                    description: "Explanation of why these patterns matter, avoiding predictions unless pattern is clearly forming",
                  },
                  clarifying_questions: {
                    type: "array",
                    items: { type: "string" },
                    description: "1-3 neutral clarification questions focused on facts, timing, and follow-through",
                  },
                  what_to_watch: {
                    type: "array",
                    items: { type: "string" },
                    description: "Specific behaviors to monitor, not outcomes. Early warning signs or early improvements",
                  },
                },
                required: ["what_seeing", "pattern_signals", "contextual_framing", "clarifying_questions", "what_to_watch"],
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
          contextual_framing: "Analysis provided as text response.",
          clarifying_questions: [],
          what_to_watch: [],
        };
      }
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      analysis = {
        what_seeing: "Unable to parse analysis. Please try again.",
        pattern_signals: [],
        contextual_framing: "",
        clarifying_questions: [],
        what_to_watch: [],
      };
    }

    // Store the analysis result
    const { error: insertError } = await supabase
      .from("fiis_pattern_analyses")
      .insert({
        family_id: familyId,
        requested_by: user.id,
        analysis_type: "full",
        input_summary: { observation_count: observations.length, event_count: autoEvents.length },
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
    case "location_request":
      return `Location check-in was requested`;
    case "location_shared":
      return `Shared location${data.address ? ` at ${data.address}` : ""}`;
    default:
      return JSON.stringify(data);
  }
}
