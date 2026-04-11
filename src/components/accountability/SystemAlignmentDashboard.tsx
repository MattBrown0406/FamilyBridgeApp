import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScoreGauge } from './ScoreGauge';
import { AccountabilityScore } from '@/hooks/useAccountability';
import { Brain, Users, Building2, Activity } from 'lucide-react';

interface Props {
  familyScore: AccountabilityScore | undefined;
  providerScore: AccountabilityScore | undefined;
  systemScore: AccountabilityScore | undefined;
}

export const SystemAlignmentDashboard = ({ familyScore, providerScore, systemScore }: Props) => {
  const fScore = familyScore?.score ?? 0;
  const pScore = providerScore?.score ?? 0;
  const sScore = systemScore?.score ?? Math.round((fScore + pScore) / 2);

  const getBarColor = (s: number) => {
    if (s >= 80) return 'bg-green-500';
    if (s >= 60) return 'bg-yellow-500';
    if (s >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-4">
      {/* System alignment score */}
      <Card>
        <CardContent className="pt-6">
          <ScoreGauge
            score={sScore}
            previousScore={systemScore?.previous_score}
            trend={systemScore?.trend ?? 'stable'}
            label="System Alignment Score"
            size="lg"
          />
        </CardContent>
      </Card>

      {/* Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4" />
              Family Accountability
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="h-3 rounded-full bg-secondary overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${getBarColor(fScore)}`} style={{ width: `${fScore}%` }} />
                </div>
              </div>
              <span className="text-lg font-bold w-10 text-right">{fScore}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {familyScore?.trend === 'improving' ? 'Family consistency is strengthening.' :
               familyScore?.trend === 'declining' ? 'Family consistency needs attention.' :
               'Family alignment is holding steady.'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Provider Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="h-3 rounded-full bg-secondary overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${getBarColor(pScore)}`} style={{ width: `${pScore}%` }} />
                </div>
              </div>
              <span className="text-lg font-bold w-10 text-right">{pScore}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {providerScore?.trend === 'improving' ? 'Provider engagement is strengthening.' :
               providerScore?.trend === 'declining' ? 'Provider responsiveness needs review.' :
               'Provider performance is steady.'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* AI insight */}
      {systemScore?.ai_insight && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Brain className="h-4 w-4" />
              System Insight
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{systemScore.ai_insight}</p>
          </CardContent>
        </Card>
      )}

      {/* Positive reinforcement */}
      {(systemScore?.positive_feedback?.length ?? 0) > 0 && (
        <Card className="border-green-200 bg-green-50/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-green-700">
              <Activity className="h-4 w-4" />
              Positive Indicators
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {systemScore?.positive_feedback?.map((fb, i) => (
                <li key={i} className="text-sm text-green-700">✓ {fb}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
