import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildModeratorEscalationTriggersPrompt } from "../_shared/fiis-doctrine.ts";
import { buildFIISRuntimeContext } from "../_shared/fiis-runtime.ts";
import { loadFIISRuntimeTelemetry } from "../_shared/fiis-telemetry.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const FIIS_AI_MODEL = Deno.env.get("FIIS_AI_MODEL") ?? Deno.env.get("FAMILYBRIDGE_AI_MODEL") ?? "google/gemini-3-flash-preview";
// Override in Lovable/Supabase env when needed. Default preserves current production behavior.


serve(async (req) => {
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

    const { data: sobrietyJourney } = await supabase
      .from('sobriety_journeys')
      .select('start_date, reset_count, is_active')
      .eq('family_id', familyId)
      .eq('is_active', true)
      .maybeSingle();

    const { data: aftercarePlans } = await supabase
      .from('aftercare_plans')
      .select('id, target_user_id, is_active, created_at')
      .eq('family_id', familyId)
      .eq('is_active', true);

    const aftercarePlanIds = aftercarePlans?.map((plan) => plan.id) || [];
    const { data: aftercareRecommendations } = aftercarePlanIds.length > 0
      ? await supabase
          .from('aftercare_recommendations')
          .select('plan_id, is_completed')
          .in('plan_id', aftercarePlanIds)
      : { data: [] as any[] };

    const { data: familyMeetingCheckins } = await supabase
      .from('meeting_checkins')
      .select('user_id, checked_in_at, meeting_type')
      .eq('family_id', familyId)
      .order('checked_in_at', { ascending: false });

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

    const currentDays = sobrietyJourney?.start_date
      ? Math.max(0, Math.floor((Date.now() - new Date(sobrietyJourney.start_date).getTime()) / (1000 * 60 * 60 * 24)))
      : 0;
    const benchmarkDefinitions = [
      { label: '30 days', days: 30 },
      { label: '90 days', days: 90 },
      { label: '6 months', days: 180 },
      { label: '9 months', days: 270 },
      { label: '12 months', days: 365 },
    ];
    const supportMeetingTypes = new Set(['Al-Anon', 'Nar-Anon', 'Therapy', 'Support Group']);
    const recsByPlan = new Map<string, any[]>();
    (aftercareRecommendations || []).forEach((rec) => {
      const existing = recsByPlan.get(rec.plan_id) || [];
      existing.push(rec);
      recsByPlan.set(rec.plan_id, existing);
    });
    const roleBucketLabel = (relationshipType: string | null) => {
      if (relationshipType === 'parent') return 'parents';
      if (relationshipType === 'spouse_partner') return 'spouses/partners';
      if (relationshipType === 'sibling') return 'siblings';
      if (relationshipType === 'child') return 'children';
      return 'other support';
    };

    const benchmarkContext = benchmarkDefinitions.map((benchmark) => {
      const familySupportMembers = (members || []).filter((member) => member.role !== 'recovering');
      const eligibleSupport = familySupportMembers.filter((member) => {
        const joinedDays = member.user_id ? currentDays : 0;
        return joinedDays >= benchmark.days;
      });
      const bucketSummary: Record<string, { eligible: number; engaged: number }> = {};
      eligibleSupport.forEach((member) => {
        const bucket = roleBucketLabel(member.relationship_type || null);
        if (!bucketSummary[bucket]) bucketSummary[bucket] = { eligible: 0, engaged: 0 };
        bucketSummary[bucket].eligible += 1;
        const hasEngagedCheckin = (familyMeetingCheckins || []).some((checkin) => checkin.user_id === member.user_id && supportMeetingTypes.has(checkin.meeting_type));
        if (hasEngagedCheckin) bucketSummary[bucket].engaged += 1;
      });

      const totalEligible = Object.values(bucketSummary).reduce((sum, bucket) => sum + bucket.eligible, 0);
      const totalEngaged = Object.values(bucketSummary).reduce((sum, bucket) => sum + bucket.engaged, 0);
      const activePlan = (aftercarePlans || [])[0];
      const activeRecs = activePlan ? (recsByPlan.get(activePlan.id) || []) : [];
      const aftercareAdherence = activeRecs.length > 0
        ? Math.round((activeRecs.filter((rec) => rec.is_completed).length / activeRecs.length) * 100)
        : 0;

      return `- ${benchmark.label}: client ${currentDays >= benchmark.days ? 'is' : 'is not yet'} measurable, family engagement ${totalEngaged}/${totalEligible} (${totalEligible > 0 ? Math.round((totalEngaged / totalEligible) * 100) : 0}%), aftercare adherence ${aftercareAdherence}%${Object.entries(bucketSummary).length ? `, buckets: ${Object.entries(bucketSummary).map(([label, stats]) => `${label} ${stats.engaged}/${stats.eligible}`).join('; ')}` : ''}`;
    }).join('\n');

    const runtimeTelemetry = await loadFIISRuntimeTelemetry(supabase, familyId);

    const runtimePrompt = await buildFIISRuntimeContext({
      supabase,
      familyId,
      audience: "moderator",
      mode: "moderator_chat",
      plainLanguageSurface: false,
      contextText: `${message}\n${observationsContext}\n${notesContext}`,
      extraContext: [
        `**Family Context - ${family?.name || 'Unknown Family'}**\n${family?.description || 'No description available'}`,
        `**Family Members:**\n${membersContext}`,
        `**Current Health Status:** ${healthStatus?.status || 'Unknown'}\n${healthStatus?.status_reason || ''}`,
        `**Recent Emotional Check-ins:**\n${checkinsContext}`,
        `**Recent Observations:**\n${observationsContext}`,
        `**Provider Notes (AI-flagged):**\n${notesContext}`,
        `**Benchmark Milestone Context:**\n${benchmarkContext}`,
      ],
    });

    const systemPrompt = `${runtimePrompt}

You are FIIS — Family Intervention Intelligence System. You function as a behavioral pattern intelligence engine, relapse prevention analytics system, family systems coaching engine, boundary integrity monitor, and moderator-level decision support tool.

PRIMARY OBJECTIVE: Achieve and protect one year of continuous sobriety under strict abstinence (no harm reduction, no partial credit).
SECONDARY OBJECTIVE: Build a resilient, boundary-consistent, emotionally regulated family system.

DECISION LOGIC: Early Phase → Sobriety protection prioritized | Mid Phase → Balanced | Late Phase → Sustainability prioritized | Confirmed relapse ALWAYS overrides systemic health metrics.

CORE SCORES YOU TRACK:
1. Recovery Stability Score (0–100)
2. Family System Health Score (0–100)
3. Boundary Integrity Index (0–100)
4. Enabling Risk Index (0–100)
5. Relapse Risk Level (Low / Guarded / Elevated / High / Critical)

VOICE: Interventionist (clear, direct, boundary-focused) blended with Systems Therapist + Clinical Analyst.
Tone ladder: Gentle guidance early → Direct correction if repeated → Firm clarity if chronic.
NEVER shame. NEVER moralize. NEVER catastrophize. NEVER minimize. Always pattern-based and data-supported.

OPERATING PRINCIPLE: When uncertain, default to structure over comfort, pattern over event, system over individual isolation, long-term stability over short-term harmony, safety over analytics.

MODERATOR INTELLIGENCE LAYER — You provide moderators with:
- Full role classification (Enabler, Hero, Scapegoat, Lost Child, Mascot)
- Risk probability % and drift clustering
- Consequence enforcement gaps
- Emotional exhaustion markers
- Complacency detection index
- Silence deviation analysis
- Care-level mismatch alerts
- Escalation history log
All insights must be pattern-supported, not speculative.

COMMUNICATION INTELLIGENCE — Analyze for: minimization, deflection, blame-shifting, victim positioning, urgency language, manipulation markers, gaslighting patterns, emotional flooding, withdrawal silence, overconfidence language. Use contextual linguistic modeling, NOT keyword-only analysis.

BOUNDARY ENGINE — Evaluate boundaries for clarity, measurability, enforceability, and consequence definition. Track violations, consequence enforcement, and consequence failures. Unenforced consequences increase Enabling Risk Index.

PHASE-SENSITIVE WEIGHTING:
- 0–90 days: HIGH silence/aftercare/boundary weighting, LOW complacency
- 90–180 days: MODERATE drift sensitivity, pattern > event, BEGIN complacency detection
- 6–12 months: Complacency drift HEAVILY weighted, structure erosion, family fatigue monitoring

EMOTIONAL EXHAUSTION TRACKING: Monitor hopeless language, cynicism, irritability spikes, withdrawal, boundary fatigue, passive disengagement across all family members.

Interpret benchmark milestones as structured client and family progress signals. Pay special attention to parent and spouse/partner engagement, and explicitly comment when benchmark engagement weakness threatens the path to one year sober.

**Your Role in This Chat:**
- Help the moderator understand family dynamics and individual roles
- Suggest communication approaches using the FIIS scoring framework
- Provide insight into emotional patterns, escalation levels, and boundary integrity
- Reference specific family members by name and connect to recovery phase
- Support trauma-informed, recovery-focused communication strategies
- Never diagnose or prescribe — focus on patterns and recommendations

${buildModeratorEscalationTriggersPrompt()}

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
        model: FIIS_AI_MODEL,
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

    const responseText = await response.text();
    const usageMatch = responseText.match(/"usage":\s*\{[^}]*"prompt_tokens":\s*(\d+)[^}]*"completion_tokens":\s*(\d+)/);
    const usage = usageMatch
      ? { prompt_tokens: Number(usageMatch[1]), completion_tokens: Number(usageMatch[2]) }
      : null;
    const contentMatches = [...responseText.matchAll(/"content":"((?:\\.|[^"\\])*)"/g)];
    const responseSummary = contentMatches.length
      ? contentMatches.map((match) => match[1].replace(/\\n/g, " ").replace(/\\"/g, '"')).join(" ").slice(0, 1600)
      : null;

    await supabase.from("fiis_moderator_sessions").insert({
      family_id: familyId,
      moderator_id: user.id,
      ai_model: FIIS_AI_MODEL,
      runtime_confidence: runtimeTelemetry.learningConfidence,
      runtime_adaptations: runtimeTelemetry.activeAdaptations,
      runtime_flags: runtimeTelemetry.runtimeFlags,
      escalation_level: runtimeTelemetry.escalationLevel,
      guidance_style: runtimeTelemetry.guidanceStyle,
      prompt_summary: message.slice(0, 1200),
      response_summary: responseSummary,
      chat_turn_count: Array.isArray(chatHistory) ? chatHistory.length + 1 : 1,
      response_latency_ms: Math.max(0, Date.now() - requestStartedAt),
      tokens_in: usage?.prompt_tokens ?? null,
      tokens_out: usage?.completion_tokens ?? null,
      telemetry: {
        benchmark_context_present: Boolean(benchmarkContext),
        health_status: healthStatus?.status || null,
      },
    });

    return new Response(responseText, {
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
