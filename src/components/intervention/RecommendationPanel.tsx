import { Lightbulb, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Recommendation, ReadinessStatusLabel } from '@/data/interventionReadinessData';

interface RecommendationPanelProps {
  recommendation: Recommendation;
  statusLabel: ReadinessStatusLabel;
}

export function RecommendationPanel({ recommendation, statusLabel }: RecommendationPanelProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-warning" />
          AI Recommendation — {statusLabel}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-foreground/80 leading-relaxed">{recommendation.summary}</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">What to do now</span>
            </div>
            <p className="text-xs text-foreground/70 leading-relaxed">{recommendation.actionNow}</p>
          </div>
          <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/10">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="h-4 w-4 text-destructive" />
              <span className="text-sm font-semibold text-foreground">What to avoid</span>
            </div>
            <p className="text-xs text-foreground/70 leading-relaxed">{recommendation.avoidNow}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">When to reassess</span>
            </div>
            <p className="text-xs text-foreground/70 leading-relaxed">{recommendation.reassessWhen}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
