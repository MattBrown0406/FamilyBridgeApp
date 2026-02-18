import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { familyId, userId, analysisType } = await req.json();

    if (!familyId || !userId) {
      return new Response(
        JSON.stringify({ error: 'familyId and userId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const today = new Date().toISOString().split('T')[0];

    // Get today's check-in
    const { data: checkin } = await supabase
      .from('daily_emotional_checkins')
      .select('*')
      .eq('user_id', userId)
      .eq('family_id', familyId)
      .eq('check_in_date', today)
      .single();

    // Get recent check-ins for pattern analysis (last 14 days)
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    
    const { data: recentCheckins } = await supabase
      .from('daily_emotional_checkins')
      .select('*')
      .eq('user_id', userId)
      .eq('family_id', familyId)
      .gte('check_in_date', twoWeeksAgo.toISOString().split('T')[0])
      .order('check_in_date', { ascending: false });

    // Get today's messages for tone comparison
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const { data: todaysMessages } = await supabase
      .from('messages')
      .select('content, created_at')
      .eq('sender_id', userId)
      .eq('family_id', familyId)
      .gte('created_at', startOfDay.toISOString())
      .order('created_at', { ascending: true });

    let prompt = '';
    let analysisContext = '';

    if (analysisType === 'bypass_inference') {
      // User skipped the check-in - infer their state
      const recentBypassCount = recentCheckins?.filter(c => c.was_bypassed).length || 0;
      const totalRecentCheckins = recentCheckins?.length || 0;

      prompt = `A user has skipped their daily emotional check-in. Analyze what this might indicate:

Context:
- They bypassed today's "How do you feel?" prompt
- In the last 14 days: ${recentBypassCount} bypasses out of ${totalRecentCheckins} check-ins
- Previous check-in feelings: ${recentCheckins?.filter(c => !c.was_bypassed).slice(0, 5).map(c => c.feeling).join(', ') || 'None recorded'}
- Today's messages so far: ${todaysMessages?.length || 0} messages

Based on this pattern, provide:
1. inferred_state: A single word describing likely emotional state (e.g., "rushed", "avoidant", "apathetic", "overwhelmed", "private")
2. baseline_tone: Your best guess at their starting emotional tone today
3. pattern_note: Any concerning or noteworthy patterns you observe

Respond in JSON format:
{
  "inferred_state": "...",
  "baseline_tone": "...",
  "pattern_note": "...",
  "concern_level": "none|low|medium|high"
}`;

    } else if (analysisType === 'baseline') {
      // Analyze the check-in to establish baseline
      prompt = `Analyze this daily emotional check-in to establish an emotional baseline:

Today's check-in: "${checkin?.feeling || 'Not provided'}"

Recent check-in history (last 14 days):
${recentCheckins?.map(c => `- ${c.check_in_date}: ${c.was_bypassed ? '[SKIPPED]' : c.feeling}`).join('\n') || 'No history'}

Provide:
1. baseline_tone: The core emotional state expressed (1-2 words)
2. tone_valence: positive, negative, or neutral
3. consistency_note: How consistent are their check-ins over time?
4. pattern_alert: Any patterns that family should be aware of (or null if none)

Respond in JSON format:
{
  "baseline_tone": "...",
  "tone_valence": "positive|negative|neutral",
  "consistency_note": "...",
  "pattern_alert": "..." or null
}`;

    } else if (analysisType === 'daily_summary') {
      // End of day analysis comparing messages to baseline
      prompt = `Compare this user's emotional journey throughout the day:

Morning check-in: "${checkin?.feeling || checkin?.bypass_inferred_state || 'Not recorded'}"
Was check-in bypassed: ${checkin?.was_bypassed ? 'Yes' : 'No'}

Messages sent today (${todaysMessages?.length || 0} total):
${todaysMessages?.slice(0, 20).map(m => `- ${m.content}`).join('\n') || 'No messages'}

Analyze:
1. How did their emotional tone evolve compared to their starting point?
2. Did it improve, decline, or stay stable?
3. Any notable emotional shifts?

Respond in JSON format:
{
  "current_tone": "...",
  "tone_trajectory": "improving|declining|stable|volatile",
  "summary": "...",
  "notable_shifts": ["...", "..."] or []
}`;

    } else {
      // Real-time tone check (periodic throughout day)
      prompt = `Analyze the emotional tone of these recent messages compared to the baseline:

Baseline (morning check-in): "${checkin?.feeling || checkin?.bypass_inferred_state || 'Unknown'}"

Recent messages:
${todaysMessages?.slice(-10).map(m => `- ${m.content}`).join('\n') || 'No recent messages'}

Determine:
1. current_tone: The current emotional state
2. trajectory: Is the tone improving, declining, or stable compared to baseline?
3. concern_flag: Any immediate concerns? (true/false)

Respond in JSON format:
{
  "current_tone": "...",
  "trajectory": "improving|declining|stable",
  "concern_flag": false,
  "brief_note": "..."
}`;
    }

    // Call Lovable AI
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          {
            role: 'system',
            content: `You are FIIS — Family Intervention Intelligence System — functioning as an emotional wellness analyst for a family recovery support app.

PRIMARY OBJECTIVE: Protect the path to one year of continuous sobriety (strict abstinence).
SCORING CONTEXT: Your analysis feeds Recovery Stability Score, Family System Health Score, and Relapse Risk Level.
PHASE-SENSITIVE: 0–90d HIGH emotional sensitivity | 90–180d pattern > event | 6–12m complacency drift detection.
EMOTIONAL EXHAUSTION MODEL: Track hopeless language, cynicism, irritability spikes, withdrawal, boundary fatigue, passive disengagement.
OPERATING PRINCIPLE: Structure > comfort | Pattern > event | Safety > analytics.

Your role is to:
- Analyze emotional patterns with empathy and clinical precision
- Identify concerning patterns that may indicate struggles or emotional exhaustion
- Track emotional trajectories throughout the day against phase-appropriate baselines
- Note consistency (or lack thereof) in emotional check-ins
- Detect bypass patterns as potential avoidance signals
- Be sensitive to the context of addiction recovery and current recovery phase

Always respond with valid JSON only. No markdown, no explanation outside the JSON.`
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', aiResponse.status, errorText);
      throw new Error(`AI analysis failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const analysisText = aiData.choices?.[0]?.message?.content || '{}';
    
    // Parse the AI response
    let analysis;
    try {
      // Clean the response in case there's markdown
      const cleanedText = analysisText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      analysis = JSON.parse(cleanedText);
    } catch (e) {
      console.error('Failed to parse AI response:', analysisText);
      analysis = { error: 'Failed to parse analysis' };
    }

    // Update the check-in with bypass inference if applicable
    if (analysisType === 'bypass_inference' && analysis.inferred_state && checkin?.id) {
      await supabase
        .from('daily_emotional_checkins')
        .update({ bypass_inferred_state: analysis.inferred_state })
        .eq('id', checkin.id);
    }

    // Upsert the tone analysis record
    const analysisRecord = {
      user_id: userId,
      family_id: familyId,
      checkin_id: checkin?.id || null,
      analysis_date: today,
      baseline_tone: analysis.baseline_tone || analysis.inferred_state || null,
      current_tone: analysis.current_tone || analysis.baseline_tone || null,
      tone_trajectory: analysis.tone_trajectory || analysis.trajectory || null,
      message_count_analyzed: todaysMessages?.length || 0,
      analysis_summary: analysis.summary || analysis.brief_note || null,
      pattern_notes: analysis,
      updated_at: new Date().toISOString(),
    };

    await supabase
      .from('emotional_tone_analysis')
      .upsert(analysisRecord, { 
        onConflict: 'user_id,family_id,analysis_date',
        ignoreDuplicates: false 
      });

    // Check for patterns that warrant alerts
    if (analysis.concern_level === 'high' || analysis.concern_flag === true || analysis.pattern_alert) {
      // Create an emotional pattern record
      await supabase
        .from('emotional_patterns')
        .insert({
          user_id: userId,
          family_id: familyId,
          pattern_type: analysis.concern_level === 'high' ? 'concern' : 'observation',
          pattern_description: analysis.pattern_alert || analysis.pattern_note || 'Emotional pattern detected',
          severity: analysis.concern_level === 'high' ? 'warning' : 'concern',
          data: analysis,
        });
    }

    // Check bypass frequency pattern
    if (recentCheckins) {
      const bypassRate = recentCheckins.filter(c => c.was_bypassed).length / recentCheckins.length;
      if (bypassRate > 0.5 && recentCheckins.length >= 5) {
        // High bypass rate - record pattern
        const existingPattern = await supabase
          .from('emotional_patterns')
          .select('id')
          .eq('user_id', userId)
          .eq('family_id', familyId)
          .eq('pattern_type', 'bypass_frequency')
          .gte('created_at', twoWeeksAgo.toISOString())
          .single();

        if (!existingPattern.data) {
          await supabase
            .from('emotional_patterns')
            .insert({
              user_id: userId,
              family_id: familyId,
              pattern_type: 'bypass_frequency',
              pattern_description: `User has bypassed ${Math.round(bypassRate * 100)}% of check-ins in the last 14 days`,
              severity: bypassRate > 0.7 ? 'warning' : 'concern',
              data: { bypassRate, totalCheckins: recentCheckins.length },
            });
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-emotional-tone:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
