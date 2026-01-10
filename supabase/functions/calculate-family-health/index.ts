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
}

interface HealthResult {
  status: 'crisis' | 'tension' | 'stable' | 'improving';
  reason: string;
  metrics: HealthMetrics;
}

function calculateHealthStatus(metrics: HealthMetrics): HealthResult {
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
  } = metrics;

  // Crisis indicators (most severe)
  if (missedCheckouts >= 3 || boundaryViolations >= 3 || (filteredMessageCount >= 5 && voteConflictRate > 0.5)) {
    let reasons: string[] = [];
    if (missedCheckouts >= 3) reasons.push(`${missedCheckouts} missed checkouts`);
    if (boundaryViolations >= 3) reasons.push(`${boundaryViolations} boundary concerns`);
    if (filteredMessageCount >= 5) reasons.push(`elevated filtered messages`);
    
    return {
      status: 'crisis',
      reason: `Urgent attention needed: ${reasons.join(', ')}`,
      metrics,
    };
  }

  // Tension indicators
  if (voteConflictRate > 0.4 || filteredMessageCount >= 3 || missedCheckouts >= 2 || checkinCompletionRate < 0.5) {
    let reasons: string[] = [];
    if (voteConflictRate > 0.4) reasons.push('voting disagreements');
    if (filteredMessageCount >= 3) reasons.push('communication friction');
    if (missedCheckouts >= 2) reasons.push('check-in gaps');
    if (checkinCompletionRate < 0.5) reasons.push('low meeting attendance');
    
    return {
      status: 'tension',
      reason: `Tension detected: ${reasons.join(', ')}`,
      metrics,
    };
  }

  // Improving indicators
  const goalProgress = goalsTotal > 0 ? goalsCompleted / goalsTotal : 0;
  if (
    checkinCompletionRate >= 0.8 && 
    goalProgress >= 0.5 && 
    voteConflictRate < 0.2 && 
    filteredMessageCount <= 1 &&
    recentActivity >= 5
  ) {
    return {
      status: 'improving',
      reason: `Positive trends: ${Math.round(checkinCompletionRate * 100)}% check-in rate, ${goalsCompleted}/${goalsTotal} goals progressing`,
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
  // Handle CORS preflight requests
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

      // Calculate conflict rate (requests with mixed votes)
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

    // Fetch boundary issues (denied requests with reasons in last 30 days as proxy)
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
    };

    console.log('Health metrics calculated:', metrics);

    const healthResult = calculateHealthStatus(metrics);
    console.log('Health status result:', healthResult);

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

    return new Response(
      JSON.stringify({ 
        success: true, 
        healthStatus: upsertResult 
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
