import { Lightbulb, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { OutcomePrediction } from '@/hooks/useOutcomePredictions';

const LABELS: Record<string, string> = {
  treatment_completion: 'Treatment Completion',
  early_discharge: 'Early Discharge Risk',
  relapse_30: '30-Day Relapse Risk',
  relapse_60: '60-Day Relapse Risk',
  relapse_90: '90-Day Relapse Risk',
  readmission: 'Readmission Probability',
  system_failure: 'System Failure Risk',
};

export function ActionableInsightPanel({ predictions }: { predictions: OutcomePrediction[] }) {
  const highRisk = predictions.filter(p => {
    if (p.prediction_type === 'treatment_completion') return p.probability < 50;
    return p.probability > 60;
  });

  if (!highRisk.length) {
    return (
      <Card>
        <CardContent className="p-4 text-center text-sm text-muted-foreground">
          No high-risk outcomes currently detected. Continue monitoring trends.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {highRisk.map(p => {
        const rec = p.ai_recommendation;
        return (
          <Card key={p.id} className="border-amber-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-600" />
                {LABELS[p.prediction_type] || p.prediction_type}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {p.ai_insight && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">WHY</p>
                  <p className="text-sm text-foreground/80">{p.ai_insight}</p>
                </div>
              )}
              {rec?.actions && rec.actions.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">WHAT TO DO</p>
                  <ul className="space-y-1">
                    {rec.actions.map((a: string, i: number) => (
                      <li key={i} className="flex items-start gap-1.5 text-sm">
                        <CheckCircle className="h-3.5 w-3.5 text-green-600 mt-0.5 shrink-0" />
                        <span>{a}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {rec?.avoid && rec.avoid.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">WHAT TO AVOID</p>
                  <ul className="space-y-1">
                    {rec.avoid.map((a: string, i: number) => (
                      <li key={i} className="flex items-start gap-1.5 text-sm">
                        <XCircle className="h-3.5 w-3.5 text-red-500 mt-0.5 shrink-0" />
                        <span>{a}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
