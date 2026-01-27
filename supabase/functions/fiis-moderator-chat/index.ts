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

    const { familyId, message, chatHistory } = await req.json();

    if (!familyId || !message) {
      return new Response(
        JSON.stringify({ error: "Missing familyId or message" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user is a moderator or org member for this family
    const { data: isModerator } = await supabase.rpc('is_family_moderator', {
      _family_id: familyId,
      _user_id: user.id
    });

    const { data: isOrgMember } = await supabase.rpc('is_managing_org_member', {
      _family_id: familyId,
      _user_id: user.id
    });

    if (!isModerator && !isOrgMember) {
      return new Response(
        JSON.stringify({ error: "Not authorized for this family" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch family context data
    const { data: family } = await supabase
      .from('families')
      .select('name, description')
      .eq('id', familyId)
      .single();

    // Fetch family members with profiles
    const { data: members } = await supabase
      .from('family_members')
      .select('role, relationship_type, user_id')
      .eq('family_id', familyId);

    // Get profiles for members
    const memberIds = members?.map(m => m.user_id) || [];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', memberIds);

    const profileMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);

    // Fetch recent emotional check-ins
    const { data: checkins } = await supabase
      .from('daily_emotional_checkins')
      .select('user_id, feeling, check_in_date')
      .eq('family_id', familyId)
      .order('check_in_date', { ascending: false })
      .limit(20);

    // Fetch family health status
    const { data: healthStatus } = await supabase
      .from('family_health_status')
      .select('status, status_reason, metrics')
      .eq('family_id', familyId)
      .single();

    // Fetch recent FIIS observations (without being included in analysis)
    const { data: observations } = await supabase
      .from('fiis_observations')
      .select('observation_type, content, occurred_at')
      .eq('family_id', familyId)
      .order('occurred_at', { ascending: false })
      .limit(10);

    // Fetch provider notes that are marked for AI inclusion
    const { data: providerNotes } = await supabase
      .from('provider_notes')
      .select('note_type, content, confidence_level, time_horizon, created_at')
      .eq('family_id', familyId)
      .eq('include_in_ai_analysis', true)
      .order('created_at', { ascending: false })
      .limit(10);

    // Build family context summary
    const membersContext = members?.map(m => {
      const name = profileMap.get(m.user_id) || 'Unknown';
      return `- ${name} (${m.relationship_type || m.role})`;
    }).join('\n') || 'No members found';

    const checkinsContext = checkins?.map(c => {
      const name = profileMap.get(c.user_id) || 'Member';
      return `- ${name}: ${c.feeling} (${c.check_in_date})`;
    }).join('\n') || 'No recent check-ins';

    const observationsContext = observations?.map(o => 
      `- [${o.observation_type}] ${o.content} (${new Date(o.occurred_at).toLocaleDateString()})`
    ).join('\n') || 'No observations';

    const notesContext = providerNotes?.map(n =>
      `- [${n.note_type}/${n.confidence_level}] ${n.content}`
    ).join('\n') || 'No provider notes';

    const systemPrompt = `You are FIIS (Family Interaction Intelligence System), an AI assistant helping moderators communicate more effectively with families in recovery. You have deep insight into family dynamics, emotional patterns, and recovery journeys.

**Family Context - ${family?.name || 'Unknown Family'}**
${family?.description || 'No description available'}

**Family Members:**
${membersContext}

**Current Health Status:** ${healthStatus?.status || 'Unknown'}
${healthStatus?.status_reason || ''}

**Recent Emotional Check-ins:**
${checkinsContext}

**Recent Observations:**
${observationsContext}

**Provider Notes (AI-flagged):**
${notesContext}

**Your Role:**
- Help the moderator understand family dynamics and individual personalities
- Suggest communication approaches for difficult conversations
- Provide insight into emotional patterns and potential triggers
- Offer specific phrasing suggestions when asked
- Help identify underlying concerns that may not be explicitly stated
- Support trauma-informed, recovery-focused communication

**Guidelines:**
- Be direct and actionable in your suggestions
- Reference specific family members by name when relevant
- Consider the recovery context in all recommendations
- Acknowledge the complexity of family dynamics
- Support boundary-setting while maintaining connection
- Never diagnose or prescribe - focus on communication strategies

Remember: This conversation is private between you and the moderator. It is NOT included in FIIS pattern analysis.`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build messages array with chat history
    const messages = [
      { role: "system", content: systemPrompt },
      ...(chatHistory || []).map((msg: { role: string; content: string }) => ({
        role: msg.role,
        content: msg.content
      })),
      { role: "user", content: message }
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
    console.error("FIIS moderator chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
