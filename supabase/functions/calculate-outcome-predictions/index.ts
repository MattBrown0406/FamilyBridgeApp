import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { family_id } = await req.json();
    if (!family_id) {
      return new Response(JSON.stringify({ error: "family_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Gather data from multiple sources in parallel
    const [
      accountabilityScores,
      accountabilityAlerts,
      commitments,
      checkins,
      boundaries,
      carePhases,
      previousPredictions,
    ] = await Promise.all([
      supabase.from("accountability_scores").select("*").eq("family_id", family_id).order("calculated_at", { ascending: false }).limit(10),
      supabase.from("accountability_alerts").select("*").eq("family_id", family_id).eq("is_dismissed", false).limit(20),
      supabase.from("accountability_commitments").select("*").eq("family_id", family_id).order("created_at", { ascending: false }).limit(20),
      supabase.from("daily_emotional_checkins").select("*").eq("family_id", family_id).order("created_at", { ascending: false }).limit(30),
      supabase.from("family_boundaries").select("*").eq("family_id", family_id),
      supabase.from("care_phases").select("*").eq("family_id", family_id).order("started_at", { ascending: false }).limit(5),
      supabase.from("outcome_predictions").select("*").eq("family_id", family_id).order("calculated_at", { ascending: false }).limit(14),
    ]);

    const scores = accountabilityScores.data || [];
    const alerts = accountabilityAlerts.data || [];
    const commitData = commitments.data || [];
    const checkinData = checkins.data || [];
    const boundaryData = boundaries.data || [];
    const phases = carePhases.data || [];
    const prevPredictions = previousPredictions.data || [];

    // Extract key metrics
    const familyScore = scores.find((s: any) => s.score_type === "family")?.score ?? 50;
    const providerScore = scores.find((s: any) => s.score_type === "provider")?.score ?? 50;

    const totalCommitments = commitData.length;
    const adhered = commitData.filter((c: any) => c.status === "adhered").length;
    const broken = commitData.filter((c: any) => c.status === "broken").length;
    const commitmentRate = totalCommitments > 0 ? (adhered / totalCommitments) * 100 : 50;

    const activeAlertCount = alerts.length;
    const highSeverityAlerts = alerts.filter((a: any) => a.severity === "high" || a.severity === "critical").length;

    const checkinCount = checkinData.length;
    const bypassedCheckins = checkinData.filter((c: any) => c.was_bypassed).length;
    const engagementRate = checkinCount > 0 ? ((checkinCount - bypassedCheckins) / checkinCount) * 100 : 50;

    const approvedBoundaries = boundaryData.filter((b: any) => b.status === "approved").length;
    const violatedBoundaries = boundaryData.filter((b: any) => b.last_violation_at).length;
    const boundaryAdherence = approvedBoundaries > 0 ? ((approvedBoundaries - violatedBoundaries) / approvedBoundaries) * 100 : 50;

    const isInTreatment = phases.some((p: any) => p.is_current && ["residential", "inpatient", "php"].includes(p.phase_type));

    // Determine data confidence
    const dataPoints = checkinCount + totalCommitments + scores.length + boundaryData.length;
    const confidence = dataPoints > 30 ? "high" : dataPoints > 10 ? "moderate" : "low";

    // ===== PREDICTION CALCULATIONS =====

    // 1. Treatment Completion
    const treatmentCompletion = Math.min(100, Math.max(5,
      (engagementRate * 0.25) +
      (commitmentRate * 0.20) +
      ((100 - Math.min(highSeverityAlerts * 15, 50)) * 0.15) +
      (familyScore * 0.20) +
      (providerScore * 0.10) +
      (boundaryAdherence * 0.10)
    ));

    // 2. Early Discharge Risk
    const earlyDischarge = Math.min(95, Math.max(5,
      100 - treatmentCompletion +
      (broken * 5) +
      (highSeverityAlerts * 8) -
      (familyScore * 0.15)
    ));

    // 3. Relapse Risks (30/60/90 day)
    const baseRelapse = Math.min(95, Math.max(5,
      100 - (engagementRate * 0.3) -
      (commitmentRate * 0.2) -
      (familyScore * 0.2) -
      (boundaryAdherence * 0.15) -
      (providerScore * 0.15) +
      (broken * 3) +
      (highSeverityAlerts * 5)
    ));
    const relapse30 = Math.min(95, baseRelapse);
    const relapse60 = Math.min(95, baseRelapse * 1.12);
    const relapse90 = Math.min(95, baseRelapse * 1.22);

    // 4. Readmission
    const readmission = Math.min(95, Math.max(5, relapse30 * 0.6 + earlyDischarge * 0.3 + (100 - providerScore) * 0.1));

    // 5. System Failure Risk
    const systemFailure = Math.min(95, Math.max(5,
      ((100 - familyScore) * 0.35) +
      ((100 - providerScore) * 0.35) +
      (activeAlertCount * 3) +
      ((100 - boundaryAdherence) * 0.15) +
      ((100 - commitmentRate) * 0.15)
    ));

    // Build predictions array
    const predictions = [
      { type: "treatment_completion", probability: treatmentCompletion },
      { type: "early_discharge", probability: earlyDischarge },
      { type: "relapse_30", probability: relapse30 },
      { type: "relapse_60", probability: relapse60 },
      { type: "relapse_90", probability: relapse90 },
      { type: "readmission", probability: readmission },
      { type: "system_failure", probability: systemFailure },
    ];

    // Calculate trends and build risk drivers
    const riskDrivers: string[] = [];
    const protectiveFactors: string[] = [];

    if (familyScore < 50) riskDrivers.push("Family accountability score below threshold");
    if (providerScore < 50) riskDrivers.push("Provider performance score needs improvement");
    if (boundaryAdherence < 60) riskDrivers.push("Boundary adherence is inconsistent");
    if (broken > 2) riskDrivers.push("Multiple broken commitments detected");
    if (highSeverityAlerts > 2) riskDrivers.push("Elevated number of high-severity alerts");
    if (engagementRate < 60) riskDrivers.push("Declining engagement rate");
    if (bypassedCheckins > checkinCount * 0.3) riskDrivers.push("Frequent emotional check-in bypasses");

    if (familyScore >= 70) protectiveFactors.push("Strong family accountability");
    if (providerScore >= 70) protectiveFactors.push("Consistent provider performance");
    if (commitmentRate >= 80) protectiveFactors.push("High commitment follow-through");
    if (engagementRate >= 80) protectiveFactors.push("Strong engagement consistency");
    if (boundaryAdherence >= 80) protectiveFactors.push("Solid boundary maintenance");
    if (checkinCount >= 14) protectiveFactors.push("Regular emotional check-in participation");
    if (isInTreatment) protectiveFactors.push("Currently in structured treatment");

    // Insert predictions
    const inserts = predictions.map((p) => {
      const prev = prevPredictions.find((pp: any) => pp.prediction_type === p.type);
      const prevProb = prev?.probability ?? null;
      const trend = prevProb === null ? "stable" :
        p.probability > prevProb + 3 ? (p.type === "treatment_completion" ? "improving" : "declining") :
        p.probability < prevProb - 3 ? (p.type === "treatment_completion" ? "declining" : "improving") :
        "stable";

      return {
        family_id,
        prediction_type: p.type,
        probability: Math.round(p.probability * 100) / 100,
        previous_probability: prevProb,
        trend,
        confidence,
        risk_drivers: riskDrivers.slice(0, 5),
        protective_factors: protectiveFactors.slice(0, 5),
        ai_insight: generateInsight(p.type, p.probability, trend, riskDrivers),
        ai_recommendation: generateRecommendation(p.type, p.probability, riskDrivers),
        data_sources: { checkins: checkinCount, commitments: totalCommitments, alerts: activeAlertCount, boundaries: approvedBoundaries },
      };
    });

    const { error: insertError } = await supabase.from("outcome_predictions").insert(inserts);
    if (insertError) throw insertError;

    // Generate alerts for high-risk predictions
    const alertInserts: any[] = [];
    for (const p of predictions) {
      if (p.type === "treatment_completion" && p.probability < 40) {
        alertInserts.push({
          family_id, prediction_type: p.type, alert_type: "low_completion",
          severity: "high", title: "Low Treatment Completion Probability",
          message: `Treatment completion probability is at ${Math.round(p.probability)}%. Immediate alignment recommended.`,
        });
      }
      if (p.type === "early_discharge" && p.probability > 65) {
        alertInserts.push({
          family_id, prediction_type: p.type, alert_type: "high_discharge_risk",
          severity: "high", title: "High Early Discharge Risk",
          message: `Early discharge risk is at ${Math.round(p.probability)}%. Review engagement and provider coordination.`,
        });
      }
      if (p.type === "relapse_30" && p.probability > 60) {
        alertInserts.push({
          family_id, prediction_type: p.type, alert_type: "relapse_warning",
          severity: p.probability > 75 ? "critical" : "high",
          title: "Elevated 30-Day Relapse Risk",
          message: `30-day relapse risk is at ${Math.round(p.probability)}%. Strengthen support systems immediately.`,
        });
      }
      if (p.type === "system_failure" && p.probability > 60) {
        alertInserts.push({
          family_id, prediction_type: p.type, alert_type: "system_misalignment",
          severity: "high", title: "System Misalignment Detected",
          message: `System failure risk at ${Math.round(p.probability)}% due to coordination gaps across family and provider systems.`,
        });
      }
    }

    if (alertInserts.length > 0) {
      await supabase.from("outcome_prediction_alerts").insert(alertInserts);
    }

    return new Response(JSON.stringify({ success: true, predictions: inserts }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function generateInsight(type: string, probability: number, trend: string, drivers: string[]): string {
  const labels: Record<string, string> = {
    treatment_completion: "Treatment Completion",
    early_discharge: "Early Discharge Risk",
    relapse_30: "30-Day Relapse Risk",
    relapse_60: "60-Day Relapse Risk",
    relapse_90: "90-Day Relapse Risk",
    readmission: "Readmission Probability",
    system_failure: "System Failure Risk",
  };
  const label = labels[type] || type;
  const trendWord = trend === "improving" ? "improving" : trend === "declining" ? "worsening" : "holding steady";
  const driverStr = drivers.length > 0 ? ` Key factors: ${drivers.slice(0, 2).join("; ")}.` : "";
  return `${label} is at ${Math.round(probability)}% and ${trendWord}.${driverStr}`;
}

function generateRecommendation(type: string, probability: number, drivers: string[]): any {
  const isHighRisk = (type === "treatment_completion" && probability < 50) ||
    (type !== "treatment_completion" && probability > 60);

  if (!isHighRisk) return { actions: ["Continue current approach", "Monitor trends"], avoid: [] };

  const actions: string[] = [];
  const avoid: string[] = ["Emotional pressure", "Conflicting messaging between family members"];

  if (drivers.some(d => d.includes("Family"))) actions.push("Reinforce family boundary consistency");
  if (drivers.some(d => d.includes("Provider"))) actions.push("Align with provider on communication cadence");
  if (drivers.some(d => d.includes("engagement"))) actions.push("Increase structured engagement touchpoints");
  if (drivers.some(d => d.includes("commitment"))) actions.push("Review and recommit to active agreements");
  if (drivers.some(d => d.includes("Boundary"))) actions.push("Address boundary inconsistencies immediately");
  if (actions.length === 0) actions.push("Review all active commitments and accountability scores");

  return { actions: actions.slice(0, 4), avoid };
}
