import { AlertTriangle, Clock, FastForward } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { MisTimingRisk } from '@/data/interventionReadinessData';

interface MisTimingRiskPanelProps {
  risk: MisTimingRisk;
}

export function MisTimingRiskPanel({ risk }: MisTimingRiskPanelProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-warning" />
          Mis-Timing Risk
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/10">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-destructive" />
              <span className="text-sm font-semibold text-foreground">Too Early</span>
            </div>
            <p className="text-xs text-foreground/70 leading-relaxed">{risk.tooEarly}</p>
          </div>
          <div className="p-4 rounded-lg bg-warning/5 border border-warning/10">
            <div className="flex items-center gap-2 mb-2">
              <FastForward className="h-4 w-4 text-warning" />
              <span className="text-sm font-semibold text-foreground">Too Late</span>
            </div>
            <p className="text-xs text-foreground/70 leading-relaxed">{risk.tooLate}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
