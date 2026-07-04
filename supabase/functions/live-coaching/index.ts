import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildModeratorEscalationTriggersPrompt } from "../_shared/fiis-doctrine.ts";
import { buildFIISLearningContext } from "../_shared/fiis-learning.ts";
import { buildFIISRuntimeContext } from "../_shared/fiis-runtime.ts";
import { loadFIISRuntimeTelemetry, persistFIISCoachingTelemetry } from "../_shared/fiis-telemetry.ts";
import { fetchFIISFamilyContext } from "../_shared/fiis-family-context.ts";

const CLAUDE_MODEL = "claude-haiku-4-5";

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestStartedAt = Date.now();
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { familyId, transcript, context, chatHistory, talkingToName, talkingToUserId } = await req.json();

    if (!familyId || !transcript) {
      return new Response(
        JSON.stringify({ error: "Missing familyId or transcript" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user is a family member or org member
    const { data: membership } = await supabase
      .from("family_members")
      .select("id, role, relationship_type")
      .eq("family_id", familyId)
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      // Check if user is an org member managing this family
      const { data: family } = await supabase.from("families").select("organization_id").eq("id", familyId).single();
      if (family?.organization_id) {
        const { data: orgMember } = await supabase.from("organization_members")
          .select("role").eq("organization_id", family.organization_id).eq("user_id", user.id).single();
        if (!orgMember) {
          return new Response(
            JSON.stringify({ error: "Not authorized for this family" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } else {
        return new Response(
          JSON.stringify({ error: "Not authorized for this family" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Fetch context in parallel
    const [familyObservations, familyResult, profileResult, talkingToInfo] = await Promise.all([
      fetchFIISFamilyContext(supabase as any, familyId),
      supabase.from("families").select("name, description").eq("id", familyId).single(),
      supabase.from("profiles").select("full_name").eq("id", user.id).single(),
      (async () => {
        if (!talkingToUserId) return { display: talkingToName || "their loved one", isMember: false };
        const { data: ttProfile } = await supabase.from("profiles").select("full_name").eq("id", talkingToUserId).single();
        const { data: ttMembership } = await supabase.from("family_members").select("role, relationship_type").eq("family_id", familyId).eq("user_id", talkingToUserId).single();
        let display = ttProfile?.full_name || talkingToName || "their loved one";
        if (ttMembership) display = `${display} (${ttMembership.relationship_type || ttMembership.role})`;
        return { display, isMember: true };
      })(),
    ]);

    const family = familyResult.data;
    const profile = profileResult.data;
    const runtimeTelemetry = await loadFIISRuntimeTelemetry(supabase, familyId);

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is not configured");
    }

    const runtimePrompt = await buildFIISRuntimeContext({
      supabase,
      familyId,
      audience: "family",
      mode: "coaching",
      plainLanguageSurface: true,
      contextText: `${transcript}\n${familyObservations}`,
      extraContext: [familyObservations],
    });

    const systemPrompt = `${runtimePrompt}

You are a real-time conversation coach helping families navigate difficult conversations during addiction recovery. You speak like a trusted friend — warm, direct, and down-to-earth. The other person CANNOT see your suggestions.

═══ IMPORTANT LANGUAGE RULES ═══
- NEVER use therapy jargon or clinical terms like "codependency", "triangulation", "differentiation", "attachment style", "cognitive distortion", "HALT", "CRAFT", "DBT", etc.
- Instead, use plain everyday language. For example:
  • Instead of "You're showing codependent behavior" → "It sounds like you're carrying more than your share here"
  • Instead of "Use an I-statement" → "Try telling them how YOU feel instead of what THEY did"
  • Instead of "Set a boundary" → "Let them know what you will and won't accept"
  • Instead of "Detach with love" → "You can love someone and still step back from the chaos"
  • Instead of "You're enabling" → "Sometimes helping actually makes things harder for them in the long run"
- Sound like a wise friend, not a therapist. Be warm and real.

═══ YOUR INTERNAL KNOWLEDGE (use to guide your thinking, but translate into plain language) ═══
(Internal clinical knowledge omitted from prompt; rely on runtime doctrine context above.)

═══ FAMILY-SPECIFIC CONTEXT ═══

**Family:** ${family?.name || "Unknown"}
**Coaching:** ${profile?.full_name || "a family member"} (${membership?.relationship_type || membership?.role || "member"})
**Talking to:** ${talkingToInfo.display}
**Conversation type:** ${context === 'phone' || context === 'in_room' ? 'live phone/in-person' : 'text'}
${talkingToInfo.isMember
  ? '**Relationship:** Family group members.'
  : '**Relationship:** Person outside the app.'}

═══ FAMILY OBSERVATIONAL DATA ═══
${familyObservations || "No historical data available yet."}

═══ GOAL-DRIVEN COACHING ═══
Your PRIMARY job is to help this conversation support the family's goals, values, and boundaries listed above.

1. **Stay focused on what matters**: If the family's goal is getting into treatment, steer the conversation toward that. If it's following an aftercare plan, encourage that. Always connect your suggestions back to what this family is working toward.

2. **Reference their values**: When suggesting what to say, naturally weave in the family's chosen values. For example, if they value "Honesty & Transparency," encourage honest but kind communication.

3. **Protect their boundaries**: If the conversation is heading toward a boundary violation, gently remind them of what they agreed to and help them hold firm.

4. **Know when to wrap it up**: If continuing the conversation would hurt their progress — if it's getting heated, going in circles, or pulling them away from their goals — suggest a warm way to end the conversation. Something like:
   - "Hey, I think we've covered a lot. Let's take a breather and come back to this."
   - "I love you and I want to keep talking about this, but I think we both need some time to think."
   - "I appreciate you being open with me. Let's pick this up when we've both had a chance to process."

**Response Format:**
Provide 1-2 short, actionable suggestions — give them exact words they can say RIGHT NOW. Keep it brief and immediately useful. If the conversation should end, suggest a warm closing that leaves room for future connection.

${buildModeratorEscalationTriggersPrompt()}

If there are immediate emergency markers, say exactly: "Call 911 first," then direct them to the moderator/help button.`;

    const messages = [
      ...(chatHistory || []).map((msg: { role: string; content: string }) => ({
        role: msg.role,
        content: msg.content,
      })),
      { role: "user", content: `Here's what's happening in the conversation:\n\n${transcript}\n\nWhat should I say or do right now?` },
    ];

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 1024,
        system: systemPrompt,
        messages,
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please try again later." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("Anthropic error:", response.status, errorText);
      throw new Error("AI request failed");
    }

    const responseText = await response.text();
    // Anthropic SSE: input_tokens in message_start, output_tokens in message_delta
    const inputTokensMatch = responseText.match(/"input_tokens":\s*(\d+)/);
    const outputTokensMatch = responseText.match(/"output_tokens":\s*(\d+)/);
    const usage = inputTokensMatch || outputTokensMatch
      ? {
          prompt_tokens: inputTokensMatch ? Number(inputTokensMatch[1]) : 0,
          completion_tokens: outputTokensMatch ? Number(outputTokensMatch[1]) : 0,
        }
      : null;
    // Claude SSE content_block_delta: { "delta": { "type": "text_delta", "text": "..." } }
    const contentMatches = [...responseText.matchAll(/"text_delta"[^}]*"text":"((?:\\.|[^"\\])*)"/g)];
    const aiSummary = contentMatches.length
      ? contentMatches.map((match) => match[1].replace(/\\n/g, " ").replace(/\\"/g, '"')).join(" ").slice(0, 1200)
      : null;

    await persistFIISCoachingTelemetry({
      supabase,
      familyId,
      userId: user.id,
      sessionType: context === 'phone' || context === 'in_room' ? 'live_speakerphone' : 'live_text',
      aiModel: CLAUDE_MODEL,
      startedAt: requestStartedAt,
      aiSummary,
      telemetry: runtimeTelemetry,
      usage,
    });

    return new Response(responseText, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Live coaching error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
