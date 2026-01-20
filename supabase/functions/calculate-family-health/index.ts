import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HealthMetrics {
  checkinCompletionRate: number;
  missedCheckouts: number;
  financialApprovalRate: number;
  voteConflictRate: number;
  filteredMessageCount: number;
  goalsCompleted: number;
  goalsTotal: number;
  boundaryViolations: number;
  recentActivity: number;
  liquorLicenseWarnings: number;
  recentMessageSamples?: string[];
  previousStatus?: string;
  daysSinceLastCrisis?: number;
}

interface HealthResult {
  status: 'crisis' | 'concern' | 'tension' | 'stable' | 'improving';
  reason: string;
  metrics: HealthMetrics;
}

interface AIAnalysis {
  status: 'crisis' | 'concern' | 'tension' | 'stable' | 'improving';
  reason: string;
  patterns_detected: string[];
  early_warning_signs: string[];
}

async function analyzeWithAI(metrics: HealthMetrics): Promise<AIAnalysis | null> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  
  if (!LOVABLE_API_KEY) {
    console.log("LOVABLE_API_KEY not configured, using rule-based analysis");
    return null;
  }

  const systemPrompt = `You are a family health pattern analyzer for a recovery support app. Analyze the provided metrics and determine the family's health status.

IMPORTANT STATUS DEFINITIONS:
- "crisis": Active emergency requiring immediate intervention. Multiple severe indicators present (3+ missed checkouts, 4+ boundary violations, high conflict with many filtered messages).
- "concern": Early warning signs detected that could escalate to crisis if unaddressed. Patterns emerging that warrant close monitoring (liquor license visits, 2 missed checkouts, escalating conflicts, increasing filtered messages).
- "tension": Friction present but manageable. Some disagreements or communication issues but not escalating (vote conflicts, some filtered messages, low attendance).
- "stable": Normal functioning. No significant issues, routine patterns maintained.
- "improving": Positive momentum detected. Consistent positive patterns over time (high check-in rates, goals being completed, low conflicts, active engagement, no concerning locations visited).

PATTERN ANALYSIS GUIDELINES:
1. Look for TRENDS not just snapshots - is the situation getting better or worse?
2. Consider combinations of factors - a single metric rarely tells the whole story
3. Early warning signs for "concern": liquor license visits, increasing filtered messages, declining check-in rates
4. Positive patterns for "improving": consistent high check-ins (80%+), goals being achieved, minimal conflicts, active family engagement
5. "Stable" is the default when no clear positive or negative trends exist

Respond with valid JSON only, no markdown.`;

  const userPrompt = `Analyze these family health metrics and determine the appropriate status:

METRICS:
- Check-in completion rate: ${(metrics.checkinCompletionRate * 100).toFixed(1)}%
- Missed checkouts (overdue): ${metrics.missedCheckouts}
- Financial request approval rate: ${(metrics.financialApprovalRate * 100).toFixed(1)}%
- Vote conflict rate: ${(metrics.voteConflictRate * 100).toFixed(1)}%
- Filtered messages (last 7 days): ${metrics.filteredMessageCount}
- Goals completed: ${metrics.goalsCompleted} of ${metrics.goalsTotal}
- Boundary violations (denied requests): ${metrics.boundaryViolations}
- Recent message activity: ${metrics.recentActivity} messages
- Liquor license location warnings: ${metrics.liquorLicenseWarnings}
${metrics.previousStatus ? `- Previous status: ${metrics.previousStatus}` : ''}
${metrics.daysSinceLastCrisis !== undefined ? `- Days since last crisis: ${metrics.daysSinceLastCrisis}` : ''}

Respond with JSON in this exact format:
{
  "status": "crisis|concern|tension|stable|improving",
  "reason": "Brief explanation in 1-2 sentences",
  "patterns_detected": ["pattern1", "pattern2"],
  "early_warning_signs": ["sign1", "sign2"] 
}`;

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      console.error("AI gateway error:", response.status);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      console.error("No content in AI response");
      return null;
    }

    // Parse JSON from response (handle potential markdown code blocks)
    let jsonStr = content.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    }
    
    const analysis = JSON.parse(jsonStr) as AIAnalysis;
    console.log("AI analysis result:", analysis);
    return analysis;

  } catch (error) {
    console.error("Error calling AI:", error);
    return null;
  }
}

function calculateHealthStatusRuleBased(metrics: HealthMetrics): HealthResult {
  const {
    checkinCompletionRate,
    missedCheckouts,
    financialApprovalRate,
    voteConflictRate,
    filteredMessageCount,
    goalsCompleted,
    goalsTotal,
    boundaryViolations,
    recentActivity,
    liquorLicenseWarnings,
  } = metrics;

  // Crisis indicators (most severe)
  if (missedCheckouts >= 3 || boundaryViolations >= 4 || (filteredMessageCount >= 5 && voteConflictRate > 0.5)) {
    const reasons: string[] = [];
    if (missedCheckouts >= 3) reasons.push(`${missedCheckouts} missed checkouts`);
    if (boundaryViolations >= 4) reasons.push(`${boundaryViolations} boundary concerns`);
    if (filteredMessageCount >= 5) reasons.push(`elevated filtered messages`);
    
    return {
      status: 'crisis',
      reason: `Urgent attention needed: ${reasons.join(', ')}`,
      metrics,
    };
  }

  // Concern indicators (between crisis and tension - early warning)
  if (
    liquorLicenseWarnings >= 1 || 
    missedCheckouts >= 2 || 
    (boundaryViolations >= 2 && voteConflictRate > 0.3) ||
    (filteredMessageCount >= 4)
  ) {
    const reasons: string[] = [];
    if (liquorLicenseWarnings >= 1) reasons.push(`${liquorLicenseWarnings} liquor license location${liquorLicenseWarnings > 1 ? 's' : ''} visited`);
    if (missedCheckouts >= 2) reasons.push(`${missedCheckouts} missed checkouts`);
    if (boundaryViolations >= 2) reasons.push('boundary concerns with voting conflicts');
    if (filteredMessageCount >= 4) reasons.push('elevated communication friction');
    
    return {
      status: 'concern',
      reason: `Early warning signs detected: ${reasons.join(', ')}`,
      metrics,
    };
  }

  // Tension indicators
  if (voteConflictRate > 0.4 || filteredMessageCount >= 3 || checkinCompletionRate < 0.5 || boundaryViolations >= 2) {
    const reasons: string[] = [];
    if (voteConflictRate > 0.4) reasons.push('voting disagreements');
    if (filteredMessageCount >= 3) reasons.push('communication friction');
    if (checkinCompletionRate < 0.5) reasons.push('low meeting attendance');
    if (boundaryViolations >= 2) reasons.push('boundary concerns');
    
    return {
      status: 'tension',
      reason: `Tension detected: ${reasons.join(', ')}`,
      metrics,
    };
  }

  // Improving indicators - consistent positive patterns
  const goalProgress = goalsTotal > 0 ? goalsCompleted / goalsTotal : 0;
  if (
    checkinCompletionRate >= 0.8 && 
    goalProgress >= 0.5 && 
    voteConflictRate < 0.2 && 
    filteredMessageCount <= 1 &&
    recentActivity >= 5 &&
    liquorLicenseWarnings === 0 &&
    missedCheckouts === 0
  ) {
    return {
      status: 'improving',
      reason: `Positive patterns detected: ${Math.round(checkinCompletionRate * 100)}% check-in rate, ${goalsCompleted}/${goalsTotal} goals progressing, healthy engagement`,
      metrics,
    };
  }

  // Stable - no concerning patterns, consistent normal behavior
  if (
    missedCheckouts === 0 &&
    liquorLicenseWarnings === 0 &&
    filteredMessageCount <= 2 &&
    voteConflictRate <= 0.3
  ) {
    return {
      status: 'stable',
      reason: 'Family system operating normally with consistent positive patterns',
      metrics,
    };
  }

  // Default to stable
  return {
    status: 'stable',
    reason: 'Family system operating normally',
    metrics,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { familyId } = await req.json();

    if (!familyId) {
      console.error('Missing familyId parameter');
      return new Response(
        JSON.stringify({ error: 'familyId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Calculating health status for family: ${familyId}`);

    // Get time ranges
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Fetch previous health status for trend analysis
    const { data: previousHealth } = await supabase
      .from('family_health_status')
      .select('status, calculated_at')
      .eq('family_id', familyId)
      .single();

    const previousStatus = previousHealth?.status;
    let daysSinceLastCrisis: number | undefined;

    if (previousHealth?.status === 'crisis' && previousHealth?.calculated_at) {
      daysSinceLastCrisis = Math.floor(
        (now.getTime() - new Date(previousHealth.calculated_at).getTime()) / (24 * 60 * 60 * 1000)
      );
    }

    // Fetch meeting check-ins (last 30 days)
    const { data: checkins, error: checkinsError } = await supabase
      .from('meeting_checkins')
      .select('id, checked_out_at, checkout_due_at')
      .eq('family_id', familyId)
      .gte('checked_in_at', thirtyDaysAgo.toISOString());

    if (checkinsError) {
      console.error('Error fetching checkins:', checkinsError);
    }

    const totalCheckins = checkins?.length || 0;
    const completedCheckins = checkins?.filter(c => c.checked_out_at)?.length || 0;
    const missedCheckouts = checkins?.filter(c => 
      c.checkout_due_at && 
      !c.checked_out_at && 
      new Date(c.checkout_due_at) < now
    )?.length || 0;
    const checkinCompletionRate = totalCheckins > 0 ? completedCheckins / totalCheckins : 1;

    // Fetch liquor license warnings (last 7 days)
    const { data: liquorWarnings, error: liquorError } = await supabase
      .from('liquor_license_warnings')
      .select('id')
      .eq('family_id', familyId)
      .gte('warned_at', sevenDaysAgo.toISOString())
      .is('acknowledged_at', null);

    if (liquorError) {
      console.error('Error fetching liquor warnings:', liquorError);
    }

    const liquorLicenseWarnings = liquorWarnings?.length || 0;

    // Fetch financial requests and votes (last 30 days)
    const { data: financialRequests, error: financialError } = await supabase
      .from('financial_requests')
      .select('id, status')
      .eq('family_id', familyId)
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (financialError) {
      console.error('Error fetching financial requests:', financialError);
    }

    const totalRequests = financialRequests?.length || 0;
    const approvedRequests = financialRequests?.filter(r => r.status === 'approved')?.length || 0;
    const financialApprovalRate = totalRequests > 0 ? approvedRequests / totalRequests : 1;

    // Fetch votes for conflict analysis
    const requestIds = financialRequests?.map(r => r.id) || [];
    let voteConflictRate = 0;

    if (requestIds.length > 0) {
      const { data: votes, error: votesError } = await supabase
        .from('financial_votes')
        .select('request_id, approved')
        .in('request_id', requestIds);

      if (votesError) {
        console.error('Error fetching votes:', votesError);
      }

      const votesByRequest = new Map<string, boolean[]>();
      votes?.forEach(v => {
        const existing = votesByRequest.get(v.request_id) || [];
        existing.push(v.approved);
        votesByRequest.set(v.request_id, existing);
      });

      let conflictedRequests = 0;
      votesByRequest.forEach(votes => {
        if (votes.length > 1) {
          const hasApprove = votes.some(v => v);
          const hasDeny = votes.some(v => !v);
          if (hasApprove && hasDeny) conflictedRequests++;
        }
      });

      voteConflictRate = votesByRequest.size > 0 ? conflictedRequests / votesByRequest.size : 0;
    }

    // Fetch filtered messages (last 7 days)
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('id, was_filtered')
      .eq('family_id', familyId)
      .gte('created_at', sevenDaysAgo.toISOString());

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
    }

    const filteredMessageCount = messages?.filter(m => m.was_filtered)?.length || 0;
    const recentActivity = messages?.length || 0;

    // Fetch goals
    const { data: goals, error: goalsError } = await supabase
      .from('family_common_goals')
      .select('id, completed_at')
      .eq('family_id', familyId);

    if (goalsError) {
      console.error('Error fetching goals:', goalsError);
    }

    const goalsTotal = goals?.length || 0;
    const goalsCompleted = goals?.filter(g => g.completed_at)?.length || 0;

    // Fetch boundary issues
    const boundaryViolations = financialRequests?.filter(r => r.status === 'denied')?.length || 0;

    // Calculate health metrics
    const metrics: HealthMetrics = {
      checkinCompletionRate,
      missedCheckouts,
      financialApprovalRate,
      voteConflictRate,
      filteredMessageCount,
      goalsCompleted,
      goalsTotal,
      boundaryViolations,
      recentActivity,
      liquorLicenseWarnings,
      previousStatus,
      daysSinceLastCrisis,
    };

    console.log('Health metrics calculated:', metrics);

    // Try AI analysis first, fall back to rule-based
    let healthResult: HealthResult;
    const aiAnalysis = await analyzeWithAI(metrics);
    
    if (aiAnalysis) {
      healthResult = {
        status: aiAnalysis.status,
        reason: aiAnalysis.reason,
        metrics: {
          ...metrics,
          // Don't include these in stored metrics
          previousStatus: undefined,
          daysSinceLastCrisis: undefined,
          recentMessageSamples: undefined,
        } as HealthMetrics,
      };
      console.log('Using AI analysis:', healthResult);
    } else {
      healthResult = calculateHealthStatusRuleBased(metrics);
      console.log('Using rule-based analysis:', healthResult);
    }

    // Check if status changed for notification purposes
    const statusChanged = previousStatus && previousStatus !== healthResult.status;
    const shouldNotify = statusChanged && (
      // Notify when dropping to tension, concern, or crisis
      (['tension', 'concern', 'crisis'].includes(healthResult.status) && 
       ['stable', 'improving', 'tension', 'concern'].includes(previousStatus)) ||
      // Also notify when returning to stable (good news!)
      (healthResult.status === 'stable' && ['tension', 'concern', 'crisis'].includes(previousStatus))
    );

    // Upsert the health status
    const { data: upsertResult, error: upsertError } = await supabase
      .from('family_health_status')
      .upsert({
        family_id: familyId,
        status: healthResult.status,
        status_reason: healthResult.reason,
        metrics: healthResult.metrics,
        calculated_at: now.toISOString(),
        updated_at: now.toISOString(),
      }, {
        onConflict: 'family_id',
      })
      .select()
      .single();

    if (upsertError) {
      console.error('Error upserting health status:', upsertError);
      return new Response(
        JSON.stringify({ error: 'Failed to save health status', details: upsertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Health status saved successfully:', upsertResult);

    // Send push notifications to moderators if status changed
    if (shouldNotify) {
      try {
        // Get family name
        const { data: family } = await supabase
          .from('families')
          .select('name')
          .eq('id', familyId)
          .single();

        const familyName = family?.name || 'A family';

        // Get moderators for this family
        const { data: moderators } = await supabase
          .from('family_members')
          .select('user_id')
          .eq('family_id', familyId)
          .eq('role', 'moderator');

        if (moderators && moderators.length > 0) {
          const moderatorIds = moderators.map(m => m.user_id);
          
          // Determine notification message based on status change
          let title: string;
          let body: string;
          
          if (healthResult.status === 'stable') {
            title = '✅ Family Status Improved';
            body = `"${familyName}" is now back to stable status. Great progress!`;
          } else if (healthResult.status === 'crisis') {
            title = '🚨 Family Status Critical';
            body = `"${familyName}" has changed to crisis status. Immediate attention needed.`;
          } else if (healthResult.status === 'concern') {
            title = '⚠️ Family Status: Concern';
            body = `"${familyName}" has changed to concern status. Early warning signs detected.`;
          } else if (healthResult.status === 'tension') {
            title = '📊 Family Status: Tension';
            body = `"${familyName}" has changed to tension status. Some friction detected.`;
          } else {
            title = '📋 Family Status Update';
            body = `"${familyName}" status changed from ${previousStatus} to ${healthResult.status}.`;
          }

          console.log(`Sending push notification to ${moderatorIds.length} moderators for status change: ${previousStatus} -> ${healthResult.status}`);

          // Send push notification
          await supabase.functions.invoke('send-push-notification', {
            body: {
              user_ids: moderatorIds,
              title,
              body,
              type: 'family_status_change',
              data: {
                family_id: familyId,
                previous_status: previousStatus,
                new_status: healthResult.status,
              },
            },
          });
        }
      } catch (notifyError) {
        // Don't fail the whole request if notification fails
        console.error('Error sending status change notification:', notifyError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        healthStatus: upsertResult,
        aiPowered: !!aiAnalysis,
        statusChanged: shouldNotify,
        previousStatus: previousStatus || null,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in calculate-family-health function:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
