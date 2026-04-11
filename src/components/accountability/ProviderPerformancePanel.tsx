import { Card, CardContent } from '@/components/ui/card';
import { ScoreGauge } from './ScoreGauge';
import { CommitmentTracker } from './CommitmentTracker';
import { AccountabilityAlerts } from './AccountabilityAlerts';
import { AccountabilityScore, AccountabilityCommitment, AccountabilityAlert } from '@/hooks/useAccountability';
import { Clock, MessageSquare, TrendingUp, AlertTriangle } from 'lucide-react';

interface Props {
  score: AccountabilityScore | undefined;
  commitments: AccountabilityCommitment[];
  alerts: AccountabilityAlert[];
  canManage: boolean;
  onAddCommitment: (data: any) => Promise<any>;
  onUpdateCommitmentStatus: (id: string, status: string, notes?: string) => Promise<any>;
  onDismissAlert: (id: string) => Promise<any>;
}

export const ProviderPerformancePanel = ({
  score, commitments, alerts, canManage,
  onAddCommitment, onUpdateCommitmentStatus, onDismissAlert
}: Props) => {
  const factors = score?.factors || [];
  const positiveFeedback = score?.positive_feedback || [];

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <ScoreGauge
                score={score?.score ?? 0}
                previousScore={score?.previous_score}
                trend={score?.trend ?? 'stable'}
                label="Provider Performance Score"
              />
            </div>
            <div className="md:col-span-2 space-y-4">
              {factors.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    Performance factors
                  </h4>
                  <ul className="space-y-1.5">
                    {factors.map((f: any, i: number) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-foreground">•</span>
                        <span>{typeof f === 'string' ? f : f.description || f.reason || JSON.stringify(f)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {score?.ai_insight && (
                <div className="p-3 rounded-lg bg-muted/50 border">
                  <p className="text-sm font-medium mb-1 flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Performance Insight
                  </p>
                  <p className="text-sm text-muted-foreground">{score.ai_insight}</p>
                </div>
              )}

              {positiveFeedback.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5 text-green-700">
                    <TrendingUp className="h-3.5 w-3.5" />
                    Strengths
                  </h4>
                  <ul className="space-y-1">
                    {positiveFeedback.map((fb, i) => (
                      <li key={i} className="text-sm text-green-700">✓ {fb}</li>
                    ))}
                  </ul>
                </div>
              )}

              {!score && (
                <p className="text-sm text-muted-foreground">No provider performance data yet. Define benchmarks and track adherence to generate scores.</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <AccountabilityAlerts alerts={alerts} sourceFilter="provider" onDismiss={onDismissAlert} />

      <CommitmentTracker
        commitments={commitments}
        commitmentType="provider"
        onAdd={onAddCommitment}
        onUpdateStatus={onUpdateCommitmentStatus}
        canManage={canManage}
      />
    </div>
  );
};
