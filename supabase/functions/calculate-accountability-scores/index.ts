import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { analyzeFamilyCommunicationBatch } from "../_shared/family-engagement-analysis.ts";

const corsHeaders2 = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders2 });
  }

  try {
    const { family_id, organization_id } = await req.json();

    if (!family_id && !organization_id) {
      return new Response(
        JSON.stringify({ error: "family_id or organization_id required" }),
        { status: 400, headers: { ...corsHeaders2, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Gather behavioral data
    const data: Record<string, any> = {};

    if (family_id) {
      const [boundariesRes, checkinsRes, consequencesRes, commitmentsRes, messagesRes, coachingSessionsRes] = await Promise.all([
        supabase.from("family_boundaries").select("*").eq("family_id", family_id).order("created_at", { ascending: false }).limit(50),
        supabase.from("daily_emotional_checkins").select("*").eq("family_id", family_id).order("created_at", { ascending: false }).limit(30),
        supabase.from("consequence_events").select("*").eq("family_id", family_id).order("created_at", { ascending: false }).limit(30),
        supabase.from("accountability_commitments").select("*").eq("family_id", family_id).order("created_at", { ascending: false }).limit(20),
        supabase.from("messages").select("content, created_at").eq("family_id", family_id).order("created_at", { ascending: false }).limit(40),
        supabase.from("coaching_sessions").select("id, session_type, started_at").eq("family_id", family_id).order("started_at", { ascending: false }).limit(30),
      ]);

      data.boundaries = boundariesRes.data || [];
      data.checkins = checkinsRes.data || [];
      data.consequences = consequencesRes.data || [];
      data.commitments = commitmentsRes.data || [];
      data.messages = messagesRes.data || [];
      data.coaching_sessions = coachingSessionsRes.data || [];
    }

    // Calculate family score
    let familyScore = 50;
    let familyFactors: string[] = [];
    let familyTrend = "stable";
    let positiveFeedback: string[] = [];

    if (family_id) {
      const boundaries = data.boundaries || [];
      const consequences = data.consequences || [];
      const commitments = data.commitments || [];

      // Boundary adherence (weight: 30)
      const approvedBoundaries = boundaries.filter((b: any) => b.status === "approved");
      const totalEnforced = consequences.filter((c: any) => c.event_type === "enforced").length;
      const totalViolated = consequences.filter((c: any) => c.event_type === "violated").length;
      const totalConsequences = totalEnforced + totalViolated;
      
      if (totalConsequences > 0) {
        const enforceRate = totalEnforced / totalConsequences;
        familyScore += Math.round((enforceRate - 0.5) * 30);
        if (enforceRate < 0.5) {
          familyFactors.push("Boundary enforcement consistency is below threshold");
        } else {
          positiveFeedback.push("Boundary enforcement is consistent");
        }
      }

      // Commitment tracking (weight: 25)
      const adhered = commitments.filter((c: any) => c.status === "adhered").length;
      const broken = commitments.filter((c: any) => c.status === "broken").length;
      const partial = commitments.filter((c: any) => c.status === "partial").length;
      const reviewed = adhered + broken + partial;
      
      if (reviewed > 0) {
        const commitScore = (adhered * 1 + partial * 0.5) / reviewed;
        familyScore += Math.round((commitScore - 0.5) * 25);
        if (broken > 0) familyFactors.push(`${broken} commitment(s) broken`);
        if (adhered > 0) positiveFeedback.push(`${adhered} commitment(s) fully adhered`);
      }

      // Emotional regulation from check-ins (weight: 20)
      const checkins = data.checkins || [];
      const bypassed = checkins.filter((c: any) => c.was_bypassed).length;
      if (checkins.length > 0) {
        const bypassRate = bypassed / checkins.length;
        if (bypassRate > 0.3) {
          familyScore -= 10;
          familyFactors.push("Emotional check-in bypass rate is elevated");
        } else if (bypassRate < 0.1 && checkins.length >= 5) {
          familyScore += 5;
          positiveFeedback.push("Consistent emotional check-in participation");
        }
      }

      const communicationAnalysis = await analyzeFamilyCommunicationBatch(
        (data.messages || []).map((message: any) => ({ content: message.content })),
        Deno.env.get("OPENAI_API_KEY") || Deno.env.get("OPENAI_APIKEY") || undefined,
      );
      const coachingSessions = data.coaching_sessions || [];
      const coachingBoost = Math.min(8, coachingSessions.length * 2);
      familyScore += coachingBoost;
      if (coachingSessions.length > 0) {
        positiveFeedback.push(`FIIS coaching used ${coachingSessions.length} time(s) recently`);
      }
      if (communicationAnalysis.recovery_alignment_score >= 70) {
        familyScore += 8;
        positiveFeedback.push("Recent family communication is recovery-aligned");
      } else if (communicationAnalysis.communication_valence === "destabilizing") {
        familyScore -= 12;
        familyFactors.push("Recent family communication may be destabilizing recovery support");
      } else if (communicationAnalysis.communication_valence === "strained") {
        familyScore -= 6;
        familyFactors.push("Recent family communication appears strained and would benefit from calmer boundaries");
      }

      // Determine trend
      const { data: prevScores } = await supabase
        .from("accountability_scores")
        .select("score")
        .eq("family_id", family_id)
        .eq("score_type", "family")
        .order("calculated_at", { ascending: false })
        .limit(3);

      if (prevScores && prevScores.length >= 2) {
        const avg = prevScores.reduce((sum: number, s: any) => sum + s.score, 0) / prevScores.length;
        if (familyScore > avg + 5) familyTrend = "improving";
        else if (familyScore < avg - 5) familyTrend = "declining";
        else if (Math.abs(familyScore - prevScores[0].score) > 10) familyTrend = "unstable";
      }

      // Clamp score
      familyScore = Math.max(0, Math.min(100, familyScore));

      // Generate AI insight
      let aiInsight = "";
      if (familyScore < 40) {
        aiInsight = "System alignment is at risk. Multiple behavioral patterns indicate inconsistency that may undermine recovery progress.";
      } else if (familyScore < 60) {
        aiInsight = "Partial alignment detected. Focus on closing gaps in commitment follow-through and boundary consistency.";
      } else if (familyScore < 80) {
        aiInsight = "Accountability patterns are trending positively. Continue reinforcing consistent behavior.";
      } else {
        aiInsight = "Strong accountability alignment. The family system is demonstrating the consistency needed for sustained recovery support.";
      }

      // Store the score
      const previousScore = prevScores?.[0]?.score ?? null;
      await supabase.from("accountability_scores").insert({
        family_id,
        score_type: "family",
        score: familyScore,
        previous_score: previousScore,
        trend: familyTrend,
        factors: familyFactors,
        ai_insight: `${aiInsight} ${communicationAnalysis.summary}`.trim(),
        positive_feedback: positiveFeedback,
        supportiveness_score: communicationAnalysis.supportive_score,
        criticism_score: communicationAnalysis.criticism_score,
        enabling_score: communicationAnalysis.enabling_score,
        emotional_regulation_score: communicationAnalysis.emotional_regulation_score,
        boundary_consistency_score: communicationAnalysis.boundary_consistency_score,
        recovery_alignment_score: communicationAnalysis.recovery_alignment_score,
        communication_valence: communicationAnalysis.communication_valence,
      });
    }

    return new Response(
      JSON.stringify({
        family_score: family_id ? {
          score: familyScore,
          trend: familyTrend,
          factors: familyFactors,
          positive_feedback: positiveFeedback,
        } : null,
        success: true,
      }),
      { headers: { ...corsHeaders2, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders2, "Content-Type": "application/json" } }
    );
  }
});
