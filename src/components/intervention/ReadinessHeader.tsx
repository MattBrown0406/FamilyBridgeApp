import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { WindowStabilityBadge } from './WindowStabilityBadge';
import type { ReadinessStatusLabel, WindowStability } from '@/data/interventionReadinessData';

interface ReadinessHeaderProps {
  clientName: string;
  totalScore: number;
  statusLabel: ReadinessStatusLabel;
  windowStability: WindowStability;
  lastUpdated: string;
  summary: string;
}

const statusColors: Record<ReadinessStatusLabel, string> = {
  'Not Ready': 'bg-muted text-muted-foreground',
  'Emerging Window': 'bg-warning/15 text-warning-foreground border border-warning/30',
  'Active Window': 'bg-primary/15 text-primary border border-primary/30',
  'Critical Window': 'bg-destructive/15 text-destructive border border-destructive/30',
};

const scoreRingColor = (score: number) => {
  if (score <= 40) return 'stroke-muted-foreground';
  if (score <= 65) return 'stroke-warning';
  if (score <= 80) return 'stroke-primary';
  return 'stroke-destructive';
};

export function ReadinessHeader({ clientName, totalScore, statusLabel, windowStability, lastUpdated, summary }: ReadinessHeaderProps) {
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (totalScore / 100) * circumference;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-start gap-6">
          {/* Score ring */}
          <div className="flex-shrink-0 flex flex-col items-center gap-2">
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="54" fill="none" strokeWidth="8" className="stroke-muted" />
                <circle
                  cx="60" cy="60" r="54" fill="none" strokeWidth="8"
                  strokeLinecap="round"
                  className={scoreRingColor(totalScore)}
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-foreground">{totalScore}</span>
                <span className="text-xs text-muted-foreground">/ 100</span>
              </div>
            </div>
            <WindowStabilityBadge stability={windowStability} />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-foreground">{clientName}</h1>
              <Badge className={`${statusColors[statusLabel]} font-medium`}>
                {statusLabel}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Last updated: {format(new Date(lastUpdated), 'MMM d, yyyy h:mm a')}
            </p>
            <p className="text-sm text-foreground/80 leading-relaxed">{summary}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
