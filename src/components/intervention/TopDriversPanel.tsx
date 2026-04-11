import { Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { TopDriver } from '@/data/interventionReadinessData';

interface TopDriversPanelProps {
  drivers: TopDriver[];
}

export function TopDriversPanel({ drivers }: TopDriversPanelProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Top Drivers of Readiness
        </CardTitle>
        <p className="text-xs text-muted-foreground">Primary factors influencing current score</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {drivers.map((driver, i) => (
            <div key={i} className="p-3 rounded-lg border bg-card">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">{i + 1}</span>
                  {driver.label}
                </span>
              </div>
              <p className="text-xs text-foreground/70 leading-relaxed ml-7">{driver.explanation}</p>
              <div className="ml-7 mt-1.5">
                <Badge variant="secondary" className="text-xs px-1.5 py-0">{driver.category}</Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
