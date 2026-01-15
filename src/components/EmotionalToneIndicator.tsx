import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Heart, Sparkles } from 'lucide-react';

interface EmotionalToneIndicatorProps {
  familyId: string;
  userId?: string; // If viewing another family member
  compact?: boolean;
}

interface ToneAnalysis {
  baseline_tone: string | null;
  current_tone: string | null;
  tone_trajectory: string | null;
  analysis_summary: string | null;
  message_count_analyzed: number;
}

export function EmotionalToneIndicator({ familyId, userId, compact = false }: EmotionalToneIndicatorProps) {
  const { user } = useAuth();
  const [analysis, setAnalysis] = useState<ToneAnalysis | null>(null);
  const [checkin, setCheckin] = useState<{ feeling: string | null; was_bypassed: boolean } | null>(null);
  const [loading, setLoading] = useState(true);

  const targetUserId = userId || user?.id;

  useEffect(() => {
    if (targetUserId && familyId) {
      fetchToneData();
      subscribeToUpdates();
    }
  }, [targetUserId, familyId]);

  const fetchToneData = async () => {
    const today = new Date().toISOString().split('T')[0];

    // Fetch both in parallel
    const [analysisResult, checkinResult] = await Promise.all([
      supabase
        .from('emotional_tone_analysis')
        .select('baseline_tone, current_tone, tone_trajectory, analysis_summary, message_count_analyzed')
        .eq('user_id', targetUserId)
        .eq('family_id', familyId)
        .eq('analysis_date', today)
        .maybeSingle(),
      supabase
        .from('daily_emotional_checkins')
        .select('feeling, was_bypassed')
        .eq('user_id', targetUserId)
        .eq('family_id', familyId)
        .eq('check_in_date', today)
        .maybeSingle()
    ]);

    if (analysisResult.data) {
      setAnalysis(analysisResult.data);
    }
    if (checkinResult.data) {
      setCheckin(checkinResult.data);
    }
    setLoading(false);
  };

  const subscribeToUpdates = () => {
    const channel = supabase
      .channel(`tone-${targetUserId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'emotional_tone_analysis',
          filter: `user_id=eq.${targetUserId}`,
        },
        () => fetchToneData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const getTrajectoryIcon = () => {
    switch (analysis?.tone_trajectory) {
      case 'improving':
        return <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />;
      case 'declining':
        return <TrendingDown className="h-3.5 w-3.5 text-rose-500" />;
      case 'volatile':
        return <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />;
      default:
        return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
    }
  };

  const getTrajectoryLabel = () => {
    switch (analysis?.tone_trajectory) {
      case 'improving':
        return 'Improving';
      case 'declining':
        return 'Declining';
      case 'volatile':
        return 'Variable';
      default:
        return 'Stable';
    }
  };

  const getTrajectoryColor = () => {
    switch (analysis?.tone_trajectory) {
      case 'improving':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'declining':
        return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400';
      case 'volatile':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return null;
  }

  // No check-in today
  if (!checkin) {
    return null;
  }

  if (compact) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5">
            <Heart className="h-3.5 w-3.5 text-rose-400" />
            {analysis?.current_tone && (
              <span className="text-xs text-muted-foreground capitalize">
                {analysis.current_tone}
              </span>
            )}
            {getTrajectoryIcon()}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-medium">Emotional State</p>
            {checkin.was_bypassed ? (
              <p className="text-sm text-muted-foreground">Check-in was skipped</p>
            ) : (
              <p className="text-sm">Started: "{checkin.feeling}"</p>
            )}
            {analysis?.current_tone && (
              <p className="text-sm">Current: {analysis.current_tone}</p>
            )}
            {analysis?.tone_trajectory && (
              <p className="text-sm">Trend: {getTrajectoryLabel()}</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className="p-3 rounded-lg bg-muted/50 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart className="h-4 w-4 text-rose-500" />
          <span className="text-sm font-medium">Today's Emotional State</span>
        </div>
        {analysis?.tone_trajectory && (
          <Badge variant="secondary" className={`${getTrajectoryColor()} gap-1`}>
            {getTrajectoryIcon()}
            {getTrajectoryLabel()}
          </Badge>
        )}
      </div>

      <div className="space-y-1.5">
        {checkin.was_bypassed ? (
          <p className="text-sm text-muted-foreground italic">
            Check-in was skipped this morning
          </p>
        ) : (
          <p className="text-sm">
            <span className="text-muted-foreground">Started feeling:</span>{' '}
            <span className="font-medium capitalize">{checkin.feeling}</span>
          </p>
        )}

        {analysis?.current_tone && analysis.current_tone !== analysis.baseline_tone && (
          <p className="text-sm">
            <span className="text-muted-foreground">Current tone:</span>{' '}
            <span className="font-medium capitalize">{analysis.current_tone}</span>
          </p>
        )}

        {analysis?.analysis_summary && (
          <div className="flex items-start gap-1.5 pt-1">
            <Sparkles className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground">
              {analysis.analysis_summary}
            </p>
          </div>
        )}

        {analysis?.message_count_analyzed > 0 && (
          <p className="text-xs text-muted-foreground">
            Based on {analysis.message_count_analyzed} message{analysis.message_count_analyzed !== 1 ? 's' : ''} today
          </p>
        )}
      </div>
    </div>
  );
}
