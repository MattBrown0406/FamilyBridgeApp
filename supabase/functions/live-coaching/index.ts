import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    // Verify user is a family member
    const { data: membership } = await supabase
      .from("family_members")
      .select("id, role, relationship_type")
      .eq("family_id", familyId)
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return new Response(
        JSON.stringify({ error: "Not authorized for this family" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get family context
    const { data: family } = await supabase
      .from("families")
      .select("name, description")
      .eq("id", familyId)
      .single();

    // Get user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    // Get talking-to person's profile if they're a family member
    let talkingToProfile: string | null = null;
    if (talkingToUserId) {
      const { data: ttProfile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", talkingToUserId)
        .single();
      talkingToProfile = ttProfile?.full_name || null;

      // Also check their relationship type in the family
      const { data: ttMembership } = await supabase
        .from("family_members")
        .select("role, relationship_type")
        .eq("family_id", familyId)
        .eq("user_id", talkingToUserId)
        .single();
      if (ttMembership) {
        talkingToProfile = `${talkingToProfile} (${ttMembership.relationship_type || ttMembership.role})`;
      }
    }

    const talkingToDisplay = talkingToProfile || talkingToName || "their loved one";
    const isFamilyMemberConvo = !!talkingToUserId;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are FIIS Live Coaching — an embedded real-time communication coach for families dealing with addiction and recovery.

**Context:**
- Family: ${family?.name || "Unknown"}
- You are coaching: ${profile?.full_name || "a family member"} (${membership.relationship_type || membership.role})
- They are having a ${context === 'phone' ? 'live phone/in-person' : 'text'} conversation with: ${talkingToDisplay}
${isFamilyMemberConvo 
  ? '- This is a conversation between family group members. Focus on healthy family communication, reducing conflict, and maintaining supportive recovery dynamics.'
  : '- This person may not be in the FamilyBridge app. Focus on de-escalation and CRAFT-based engagement.'}

**Your Role:**
You are listening to the conversation in real-time and providing coaching to the family member on how to respond. The other person CANNOT see your suggestions.

**Core Coaching Principles:**
1. **De-escalation First**: If tension is rising, prioritize calming the situation
2. **CRAFT Method**: Use Community Reinforcement and Family Training principles
3. **"I" Statements**: Guide toward expressing feelings without blame
4. **Avoid Enabling**: Help maintain boundaries while showing love
5. **Leave the Door Open**: Every conversation should end with hope for re-engagement
6. **Timing**: Know when to end a conversation — sometimes the best move is a graceful exit
7. **Non-Confrontational**: Never suggest ultimatums during heated moments
8. **Validate Emotions**: Both parties' feelings are valid

**Response Format:**
Provide 1-2 short, actionable suggestions the family member can say RIGHT NOW. Be specific and conversational — give them exact words they can use. If the conversation should end, suggest a warm closing statement that leaves room for future connection.

Keep responses brief and immediately actionable — this is real-time coaching.`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...(chatHistory || []).map((msg: { role: string; content: string }) => ({
        role: msg.role,
        content: msg.content,
      })),
      { role: "user", content: `Here's what's happening in the conversation:\n\n${transcript}\n\nWhat should I say or do right now?` },
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
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
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    return new Response(response.body, {
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
