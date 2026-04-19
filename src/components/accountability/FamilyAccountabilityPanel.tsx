import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScoreGauge } from './ScoreGauge';
import { CommitmentTracker } from './CommitmentTracker';
import { AccountabilityAlerts } from './AccountabilityAlerts';
import { AccountabilityScore, AccountabilityCommitment, AccountabilityAlert } from '@/hooks/useAccountability';
import { Shield, MessageSquare, TrendingUp } from 'lucide-react';

interface Props {
  score: AccountabilityScore | undefined;
  commitments: AccountabilityCommitment[];
  alerts: AccountabilityAlert[];
  canManage: boolean;
  onAddCommitment: (data: any) => Promise<any>;
  onUpdateCommitmentStatus: (id: string, status: string, notes?: string) => Promise<any>;
  onDismissAlert: (id: string) => Promise<any>;
}

export const FamilyAccountabilityPanel = ({
  score, commitments, alerts, canManage,
  onAddCommitment, onUpdateCommitmentStatus, onDismissAlert
}: Props) => {
  const factors = score?.factors || [];
  const positiveFeedback = score?.positive_feedback || [];
  const communicationMetrics = [
    { label: 'Supportive', value: score?.supportiveness_score ?? null },
    { label: 'Criticism', value: score?.criticism_score ?? null },
    { label: 'Enabling', value: score?.enabling_score ?? null },
    { label: 'Regulation', value: score?.emotional_regulation_score ?? null },
    { label: 'Boundaries', value: score?.boundary_consistency_score ?? null },
    { label: 'Recovery alignment', value: score?.recovery_alignment_score ?? null },
  ].filter((metric) => metric.value !== null);

  const valenceTone = score?.communication_valence
    ? score.communication_valence.charAt(0).toUpperCase() + score.communication_valence.slice(1)
    : null;

  return (
    <div className="space-y-4">
      {/* Score display */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <ScoreGauge
                score={score?.score ?? 0}
                previousScore={score?.previous_score}
                trend={score?.trend ?? 'stable'}
                label="Family Accountability Score"
              />
            </div>
            <div className="md:col-span-2 space-y-4">
              {/* Why this score changed */}
              {factors.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5" />
                    Why this score changed
                  </h4>
                  <ul className="space-y-2">
                    {factors.map((f: any, i: number) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <span className="text-foreground mt-0.5">•</span>
                        <div>
                          {typeof f === 'string' ? (
                            <span className="text-muted-foreground">{f}</span>
                          ) : f.name ? (
                            <>
                              <span className="font-medium text-foreground">{f.name}</span>
                              {f.score != null && (
                                <span className={`ml-1.5 text-xs font-semibold ${f.score >= 80 ? 'text-emerald-600' : f.score >= 60 ? 'text-amber-600' : 'text-destructive'}`}>
                                  {f.score}/100
                                </span>
                              )}
                              {f.detail && <p className="text-muted-foreground text-xs mt-0.5">{f.detail}</p>}
                            </>
                          ) : (
                            <span className="text-muted-foreground">{f.description || f.reason || JSON.stringify(f)}</span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {communicationMetrics.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-semibold">Communication signals</h4>
                    {valenceTone ? <Badge variant="outline">{valenceTone}</Badge> : null}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {communicationMetrics.map((metric) => (
                      <div key={metric.label} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">{metric.label}</span>
                          <span className="font-medium text-foreground">{metric.value}</span>
                        </div>
                        <Progress value={metric.value ?? 0} className="h-2" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Insight */}
              {score?.ai_insight && (
                <div className="p-3 rounded-lg bg-muted/50 border">
                  <p className="text-sm font-medium mb-1 flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5" />
                    Behavioral Insight
                  </p>
                  <p className="text-sm text-muted-foreground">{score.ai_insight}</p>
                </div>
              )}

              {/* Positive reinforcement */}
              {positiveFeedback.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5 text-green-700">
                    <TrendingUp className="h-3.5 w-3.5" />
                    What's working
                  </h4>
                  <ul className="space-y-1">
                    {positiveFeedback.map((fb, i) => (
                      <li key={i} className="text-sm text-green-700">✓ {fb}</li>
                    ))}
                  </ul>
                </div>
              )}

              {!score && (
                <p className="text-sm text-muted-foreground">No accountability data calculated yet. Track commitments to generate scores.</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      <AccountabilityAlerts alerts={alerts} sourceFilter="family" onDismiss={onDismissAlert} />

      {/* Commitment tracker */}
      <CommitmentTracker
        commitments={commitments}
        commitmentType="family"
        onAdd={onAddCommitment}
        onUpdateStatus={onUpdateCommitmentStatus}
        canManage={canManage}
      />
    </div>
  );
};
