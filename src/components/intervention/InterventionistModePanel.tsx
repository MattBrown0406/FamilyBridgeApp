import { Eye, Shield, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { InterventionistInsight } from '@/data/interventionReadinessData';

interface InterventionistModePanelProps {
  insight: InterventionistInsight;
}

export function InterventionistModePanel({ insight }: InterventionistModePanelProps) {
  return (
    <Card className="border-primary/20 bg-primary/[0.02]">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Eye className="h-5 w-5 text-primary" />
          Interventionist Assessment
        </CardTitle>
        <p className="text-xs text-muted-foreground">Direct interpretation — professional use only</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 rounded-lg bg-background border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Clinical Read</span>
          </div>
          <p className="text-sm text-foreground/80 leading-relaxed">{insight.assessment}</p>
        </div>

        <div className="p-4 rounded-lg bg-background border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Tactical Note</span>
          </div>
          <p className="text-sm text-foreground/80 leading-relaxed italic">{insight.tacticalNote}</p>
        </div>

        <div className="p-3 rounded-lg bg-muted/50 border border-border">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">Confidence</span>
          </div>
          <p className="text-xs text-foreground/70 leading-relaxed">{insight.confidence}</p>
        </div>
      </CardContent>
    </Card>
  );
}
