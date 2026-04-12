import { Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { OutcomePrediction } from '@/hooks/useOutcomePredictions';

export function SystemAlignmentInsight({ predictions }: { predictions: OutcomePrediction[] }) {
  const completion = predictions.find(p => p.prediction_type === 'treatment_completion');
  const systemFailure = predictions.find(p => p.prediction_type === 'system_failure');
  const relapse30 = predictions.find(p => p.prediction_type === 'relapse_30');

  if (!completion && !systemFailure) {
    return null;
  }

  const issues: string[] = [];
  if (systemFailure && systemFailure.probability > 50) issues.push('system misalignment looks elevated');
  if (completion && completion.probability < 50) issues.push('treatment follow-through looks less stable');
  if (relapse30 && relapse30.probability > 50) issues.push('short-term relapse concerns are elevated');

  const summary = issues.length > 0
    ? `Attention needed: ${issues.join(', ')}. Review accountability scores and coordination gaps to steady the trajectory.`
    : 'System alignment appears stable. Continue reviewing trends and reinforcing the current approach.';

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          System Alignment Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-foreground/80 leading-relaxed">{summary}</p>
        {predictions.length > 0 && predictions[0].confidence === 'low' && (
          <p className="text-xs text-muted-foreground mt-2 italic">
            Note: These estimates may shift as more behavioral data becomes available.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
