import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { OutcomePrediction } from '@/hooks/useOutcomePredictions';

const LABELS: Record<string, { label: string; desc: string; inverse?: boolean }> = {
  treatment_completion: { label: 'Treatment Completion Outlook', desc: 'Estimated likelihood of completing the current treatment program', inverse: true },
  early_discharge: { label: 'Early Discharge Outlook', desc: 'Estimated chance of leaving treatment early' },
  relapse_30: { label: '30-Day Relapse Outlook', desc: 'Estimated chance of relapse within 30 days after treatment' },
  relapse_60: { label: '60-Day Relapse Outlook', desc: 'Estimated chance of relapse within 60 days after treatment' },
  relapse_90: { label: '90-Day Relapse Outlook', desc: 'Estimated chance of relapse within 90 days after treatment' },
  readmission: { label: 'Readmission Outlook', desc: 'Estimated likelihood of needing readmission' },
  system_failure: { label: 'System Strain Outlook', desc: 'Estimated chance of breakdown from misalignment across family, provider, and individual' },
};

function getColor(type: string, prob: number): string {
  const inverse = LABELS[type]?.inverse;
  if (inverse) {
    if (prob >= 70) return 'text-green-600';
    if (prob >= 40) return 'text-amber-600';
    return 'text-red-600';
  }
  if (prob <= 30) return 'text-green-600';
  if (prob <= 60) return 'text-amber-600';
  return 'text-red-600';
}

function getBgColor(type: string, prob: number): string {
  const inverse = LABELS[type]?.inverse;
  if (inverse) {
    if (prob >= 70) return 'bg-green-50 border-green-200';
    if (prob >= 40) return 'bg-amber-50 border-amber-200';
    return 'bg-red-50 border-red-200';
  }
  if (prob <= 30) return 'bg-green-50 border-green-200';
  if (prob <= 60) return 'bg-amber-50 border-amber-200';
  return 'bg-red-50 border-red-200';
}

export function OutcomePredictionCard({ prediction }: { prediction: OutcomePrediction }) {
  const meta = LABELS[prediction.prediction_type] || { label: prediction.prediction_type, desc: '' };
  const TrendIcon = prediction.trend === 'improving' ? TrendingDown : prediction.trend === 'declining' ? TrendingUp : Minus;
  const trendLabel = prediction.trend === 'improving' ? 'Improving' : prediction.trend === 'declining' ? 'Worsening' : 'Stable';
  const color = getColor(prediction.prediction_type, prediction.probability);
  const bg = getBgColor(prediction.prediction_type, prediction.probability);

  return (
    <Card className={`border ${bg}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-foreground truncate">{meta.label}</span>
              <Tooltip>
                <TooltipTrigger><Info className="h-3.5 w-3.5 text-muted-foreground" /></TooltipTrigger>
                <TooltipContent><p className="max-w-[200px] text-xs">{meta.desc}</p></TooltipContent>
              </Tooltip>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-2xl font-bold ${color}`}>{Math.round(prediction.probability)}%</span>
              <div className="flex items-center gap-1">
                <TrendIcon className={`h-3.5 w-3.5 ${prediction.trend === 'improving' ? 'text-green-600' : prediction.trend === 'declining' ? 'text-red-600' : 'text-muted-foreground'}`} />
                <span className="text-xs text-muted-foreground">{trendLabel}</span>
              </div>
            </div>
            {prediction.previous_probability !== null && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Prior estimate: {Math.round(prediction.previous_probability)}%
              </p>
            )}
          </div>
          <Badge variant="outline" className="text-[10px] shrink-0 capitalize">
            {prediction.confidence} confidence
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
