import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, TrendingUp, Brain } from 'lucide-react';

const dailyActions = [
  { action: 'Hold boundaries', detail: 'Do not soften, negotiate, or modify agreed-upon consequences.' },
  { action: 'Avoid rescuing', detail: 'Do not solve problems the individual created through their use.' },
  { action: 'Avoid emotional escalation', detail: 'Stay calm. Emotional reactions give the individual leverage.' },
  { action: 'Maintain consistency', detail: 'Every family member must align. One inconsistency undermines the system.' },
  { action: 'Attend your own support', detail: 'Al-Anon, therapy, support group—your recovery matters too.' },
];

interface FamilyBehaviorScore {
  label: string;
  score: number;
  maxScore: number;
}

const behaviorScores: FamilyBehaviorScore[] = [
  { label: 'Consistency', score: 8, maxScore: 10 },
  { label: 'Boundary Adherence', score: 7, maxScore: 10 },
  { label: 'Emotional Regulation', score: 6, maxScore: 10 },
  { label: 'Self-Care Engagement', score: 5, maxScore: 10 },
];

const overallScore = Math.round(behaviorScores.reduce((sum, s) => sum + (s.score / s.maxScore) * 100, 0) / behaviorScores.length);

const getScoreColor = (pct: number) => {
  if (pct >= 80) return 'text-green-600';
  if (pct >= 60) return 'text-amber-600';
  return 'text-destructive';
};

const getBarColor = (pct: number) => {
  if (pct >= 80) return 'bg-green-500';
  if (pct >= 60) return 'bg-amber-500';
  return 'bg-destructive';
};

interface FamilyRecoveryModeProps {
  outcome: 'accepted' | 'declined';
}

export const FamilyRecoveryMode = ({ outcome }: FamilyRecoveryModeProps) => {
  const aiMessage = outcome === 'accepted'
    ? 'Family consistency has improved since the intervention. Communication boundaries with the treatment facility are being respected. Continue focusing on your own recovery behaviors—this directly supports long-term outcomes.'
    : 'Family consistency is holding but under stress. Emotional regulation scores suggest elevated anxiety, which is expected in the first week post-intervention. Boundary adherence is strong. Continue Al-Anon or therapy engagement—this is the most impactful thing you can do right now.';

  const aiCaution = outcome === 'accepted'
    ? 'Watch for the urge to "check in" more than the facility allows. Over-contact is a common pattern that can undermine treatment engagement.'
    : 'Boundary inconsistency detected: emotional regulation is the weakest area. This may lead to rescue attempts. Proactive support is recommended.';

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Heart className="h-4 w-4 text-primary" />
            Family Recovery Mode
          </CardTitle>
          <Badge variant="outline" className="text-xs">Active — Both Paths</Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Regardless of intervention outcome, the family system must stabilize. Your behavior is the variable you control.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Daily Actions */}
        <div>
          <p className="text-sm font-semibold text-foreground mb-3">Daily Family Actions</p>
          <div className="space-y-3">
            {dailyActions.map((a, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-primary/10 text-primary">
                  {i + 1}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{a.action}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{a.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Behavior Score */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold text-foreground">Family Behavior Score</p>
            </div>
            <span className={`text-lg font-bold ${getScoreColor(overallScore)}`}>{overallScore}%</span>
          </div>
          <div className="space-y-3">
            {behaviorScores.map((s, i) => {
              const pct = Math.round((s.score / s.maxScore) * 100);
              return (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{s.label}</span>
                    <span className="font-medium text-foreground">{s.score}/{s.maxScore}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${getBarColor(pct)}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Coaching */}
        <div className="border-t pt-4">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold text-foreground">AI Coaching</p>
          </div>
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-sm text-foreground">{aiMessage}</p>
          </div>
          <div className="p-3 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30 mt-2">
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-amber-700 dark:text-amber-400">Watch: </span>
              {aiCaution}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
