import { Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { WindowStability } from '@/data/interventionReadinessData';

const stabilityConfig: Record<WindowStability, { color: string; description: string }> = {
  Low: { color: 'bg-destructive/15 text-destructive border-destructive/30', description: 'Volatile spike — may not sustain' },
  Moderate: { color: 'bg-warning/15 text-warning-foreground border-warning/30', description: 'Developing trend — forming' },
  High: { color: 'bg-primary/15 text-primary border-primary/30', description: 'Sustained trend — stable' },
};

interface WindowStabilityBadgeProps {
  stability: WindowStability;
  showDescription?: boolean;
}

export function WindowStabilityBadge({ stability, showDescription = false }: WindowStabilityBadgeProps) {
  const config = stabilityConfig[stability];
  return (
    <div className="flex items-center gap-2">
      <Badge className={`${config.color} font-medium gap-1`}>
        <Activity className="h-3 w-3" />
        Window Stability: {stability}
      </Badge>
      {showDescription && (
        <span className="text-xs text-muted-foreground">{config.description}</span>
      )}
    </div>
  );
}
