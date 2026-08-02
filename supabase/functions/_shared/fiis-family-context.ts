
const GOAL_LABELS: Record<string, string> = {
  complete_intervention: "Complete Family Intervention",
  enter_treatment: "Enter Treatment Program",
  complete_treatment: "Complete Treatment Program",
  establish_support_network: "Build a Recovery Support Network",
  family_therapy_sessions: "Complete 8 Family Therapy Sessions",
  "90_meetings_90_days": "Attend 90 Meetings in 90 Days",
  living_amends_plan: "Create Living Amends Plan",
  family_recovery_milestones: "Celebrate 6-Month Family Recovery",
  rebuild_financial_trust: "Restore Financial Accountability",
  one_year_celebration: "Celebrate One Year of Sobriety",
};

const VALUE_LABELS: Record<string, string> = {
  honesty: "Honesty & Transparency",
  accountability: "Accountability Without Shame",
  boundaries: "Healthy Boundaries",
  support_not_enabling: "Support Without Enabling",
  patience: "Patience & Progress",
  forgiveness: "Forgiveness & Moving Forward",
  self_care: "Self-Care for Everyone",
  consistency: "Consistency & Follow-Through",
  communication: "Compassionate Communication",
  hope: "Hope & Faith in Recovery",
};

export async function fetchFIISFamilyContext(supabase: any, familyId: string) {
  const [
    sobrietyResult, boundariesResult, emotionalCheckinsResult, meetingCheckinsResult,
    messagesResult, financialRequestsResult, coachingSessionsResult, medicationsResult,
    providerNotesResult, aftercarePlansResult, aftercareRecsResult, calibrationPatternsResult,
    valuesResult, commonGoalsResult, actionsResult, decisionsResult,
    decisionAcknowledgementsResult, sharedCoordinationMessagesResult, coordinationTasksResult,
  ] = await Promise.all([
    supabase.from("sobriety_journeys").select("start_date, reset_count, is_active").eq("family_id", familyId).eq("is_active", true).maybeSingle(),
    supabase.from("family_boundaries").select("content").eq("family_id", familyId).eq("status", "approved"),
    supabase.from("daily_emotional_checkins").select("feeling, was_bypassed, check_in_date").eq("family_id", familyId).order("check_in_date", { ascending: false }).limit(30),
    supabase.from("meeting_checkins").select("checked_in_at, meeting_type, overdue_alert_sent").eq("family_id", familyId).order("checked_in_at", { ascending: false }).limit(50),
    supabase.from("messages").select("content, created_at").eq("family_id", familyId).order("created_at", { ascending: false }).limit(200),
    supabase.from("financial_requests").select("amount, status, created_at").eq("family_id", familyId).order("created_at", { ascending: false }).limit(20),
    supabase.from("coaching_sessions").select("session_type, started_at, suggestions, talking_to_name").eq("family_id", familyId).order("started_at", { ascending: false }).limit(20),
    supabase.from("medications").select("medication_name, dosage").eq("family_id", familyId).eq("is_active", true),
    supabase.from("provider_notes").select("note_type, content").eq("family_id", familyId)
      .eq("include_in_ai_analysis", true).eq("visibility", "shareable_summary")
      .order("created_at", { ascending: false }).limit(10),
    supabase.from("aftercare_plans").select("id").eq("family_id", familyId).eq("is_active", true),
    supabase.from("aftercare_recommendations").select("plan_id, recommendation_type, title, is_completed").order("created_at", { ascending: false }).limit(50),
    supabase.from("fiis_calibration_patterns").select("pattern_name, pattern_description, suggested_response").eq("is_active", true),
    supabase.from("family_values").select("value_key").eq("family_id", familyId),
    supabase.from("family_common_goals").select("goal_key, completed_at").eq("family_id", familyId),
    supabase.from("family_actions").select("title, description, status, priority, due_at, completed_at").eq("family_id", familyId).order("created_at", { ascending: false }).limit(50),
    supabase.from("family_decisions").select("id, title, context, concerns, status, target_at").eq("family_id", familyId).order("created_at", { ascending: false }).limit(30),
    supabase.from("family_decision_acknowledgements")
      .select("decision_id, acknowledgement, comment, acknowledged_at, family_decisions!inner(family_id)")
      .eq("family_decisions.family_id", familyId).order("acknowledged_at", { ascending: false }).limit(100),
    supabase.from("coordination_messages")
      .select("content, created_at, coordination_channels!inner(channel_type, coordination_cases!inner(family_id))")
      .eq("coordination_channels.channel_type", "family")
      .eq("coordination_channels.coordination_cases.family_id", familyId)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase.from("coordination_tasks")
      .select("title, description, status, priority, due_date, coordination_cases!inner(family_id)")
      .eq("coordination_cases.family_id", familyId)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  let ctx = "";

  const activeGoals = (commonGoalsResult.data || []).filter((g: any) => !g.completed_at);
  const completedGoals = (commonGoalsResult.data || []).filter((g: any) => g.completed_at);
  if (activeGoals.length > 0 || completedGoals.length > 0) {
    ctx += `FAMILY GOALS (guide ALL coaching around these):\n`;
    if (activeGoals.length > 0) ctx += `Active: ${activeGoals.map((g: any) => GOAL_LABELS[g.goal_key] || g.goal_key.replace(/_/g, ' ')).join(', ')}\n`;
    if (completedGoals.length > 0) ctx += `Completed: ${completedGoals.map((g: any) => GOAL_LABELS[g.goal_key] || g.goal_key.replace(/_/g, ' ')).join(', ')}\n`;
  }

  if (valuesResult.data?.length) {
    ctx += `FAMILY VALUES: ${valuesResult.data.map((v: any) => VALUE_LABELS[v.value_key] || v.value_key.replace(/_/g, ' ')).join(', ')}\n`;
  }

  if (boundariesResult.data?.length) ctx += `BOUNDARIES: ${boundariesResult.data.map((b: any, i: number) => `${i + 1}. ${b.content}`).join('; ')}\n`;

  if (sobrietyResult.data) {
    const sobriety = sobrietyResult.data as any;
    const days = Math.max(0, Math.floor((Date.now() - new Date(sobriety.start_date).getTime()) / 86400000));
    const phase = days <= 30 ? "Early Recovery" : days <= 90 ? "Building Foundation" : days <= 180 ? "Developing Resilience" : days <= 365 ? "Strengthening" : "Maintenance";
    ctx += `SOBRIETY: ${days} days. Phase: ${phase}. ${(sobriety.reset_count || 0) > 0 ? `Attempt #${(sobriety.reset_count || 0) + 1}.` : ''}\n`;
  }
  if (emotionalCheckinsResult.data?.length) {
    const feelings: Record<string, number> = {};
    emotionalCheckinsResult.data.forEach((c: any) => { if (c.feeling) feelings[c.feeling] = (feelings[c.feeling] || 0) + 1; });
    ctx += `EMOTIONAL STATE: ${Object.entries(feelings).map(([f, c]) => `${f}(${c})`).join(', ')}\n`;
  }
  if (meetingCheckinsResult.data?.length) {
    const now = Date.now();
    const recent7 = meetingCheckinsResult.data.filter((c: any) => new Date(c.checked_in_at).getTime() >= now - 604800000).length;
    ctx += `MEETINGS: ${recent7} in last 7 days.\n`;
  }
  if (messagesResult.data?.length) {
    const keywords: Record<string, string[]> = {
      relapse_warning: ['relapse', 'slip', 'used', 'drank', 'high'],
      isolation: ['alone', 'leave me alone', 'need space', 'fine'],
      progress: ['proud', 'meeting', 'sponsor', 'therapy', 'grateful', 'sober'],
    };
    const counts: Record<string, number> = {};
    Object.keys(keywords).forEach((k) => counts[k] = 0);
    messagesResult.data.forEach((m: any) => {
      const content = (m.content || '').toLowerCase();
      Object.entries(keywords).forEach(([cat, kws]) => kws.forEach((kw) => { if (content.includes(kw)) counts[cat]++; }));
    });
    const sig = Object.entries(counts).filter(([, c]) => c > 0);
    if (sig.length) ctx += `CHAT SIGNALS: ${sig.map(([k, v]) => `${k.replace(/_/g, ' ')}(${v})`).join(', ')}\n`;
  }
  if (financialRequestsResult.data?.length) {
    const totalAmount = financialRequestsResult.data.reduce((sum: number, r: any) => sum + (r.amount || 0), 0);
    ctx += `FINANCIAL PATTERNS: ${financialRequestsResult.data.length} recent requests totaling $${totalAmount}.\n`;
  }
  if (coachingSessionsResult.data?.length) ctx += `PRIOR COACHING: ${coachingSessionsResult.data.length} sessions.\n`;
  if (medicationsResult.data?.length) ctx += `MEDICATIONS: ${medicationsResult.data.map((m: any) => m.medication_name).join(', ')}\n`;
  if (providerNotesResult.data?.length) {
    ctx += `PROVIDER NOTES EXPLICITLY AUTHORIZED FOR FIIS:\n${providerNotesResult.data.map((n: any, i: number) => `${i + 1}. [${n.note_type}] ${n.content}`).join('\n')}\n`;
  }
  if (sharedCoordinationMessagesResult.data?.length) {
    ctx += `SHARED FAMILY/PROFESSIONAL COORDINATION:\n${sharedCoordinationMessagesResult.data.map((message: any, i: number) => `${i + 1}. ${message.content}`).join('\n')}\n`;
  }
  if (coordinationTasksResult.data?.length) {
    ctx += `SHARED COORDINATION TASKS:\n${coordinationTasksResult.data.map((task: any, i: number) => `${i + 1}. [${task.status}/${task.priority}] ${task.title}${task.description ? ` — ${task.description}` : ''}${task.due_date ? ` (due ${task.due_date})` : ''}`).join('\n')}\n`;
  }
  if (actionsResult.data?.length) {
    ctx += `SHARED FAMILY ACTIONS:\n${actionsResult.data.map((action: any, i: number) => `${i + 1}. [${action.status}/${action.priority}] ${action.title}${action.description ? ` — ${action.description}` : ''}${action.due_at ? ` (due ${action.due_at})` : ''}`).join('\n')}\n`;
  }
  if (decisionsResult.data?.length) {
    const acknowledgements = decisionAcknowledgementsResult.data || [];
    ctx += `SHARED FAMILY DECISIONS:\n${decisionsResult.data.map((decision: any, i: number) => {
      const responses = acknowledgements.filter((item: any) => item.decision_id === decision.id);
      const responseSummary = responses.length ? ` Responses: ${responses.map((item: any) => item.acknowledgement).join(', ')}.` : '';
      return `${i + 1}. [${decision.status}] ${decision.title}${decision.context ? ` — ${decision.context}` : ''}${decision.concerns ? ` Concerns: ${decision.concerns}` : ''}${responseSummary}`;
    }).join('\n')}\n`;
  }
  if (calibrationPatternsResult.data?.length) {
    ctx += `CALIBRATED WARNING PATTERNS:\n${calibrationPatternsResult.data.slice(0, 10).map((p: any) => `- ${p.pattern_name}: ${p.pattern_description}${p.suggested_response ? ` → ${p.suggested_response}` : ''}`).join('\n')}\n`;
  }

  if (aftercarePlansResult.data?.length) {
    const planIds = aftercarePlansResult.data.map((p: any) => p.id);
    const recs = (aftercareRecsResult.data || []).filter((r: any) => planIds.includes(r.plan_id));
    if (recs.length) {
      const done = recs.filter((r: any) => r.is_completed).length;
      ctx += `AFTERCARE: ${done}/${recs.length} completed (${Math.round((done / recs.length) * 100)}%).\n`;
    }
  }

  return ctx;
}
