import { TrendingUp, TrendingDown, Minus, Brain, AlertTriangle, ShieldOff, Zap, HeartHandshake } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { SignalCategory, SignalCategoryName, TrendDirection } from '@/data/interventionReadinessData';

const categoryIcons: Record<SignalCategoryName, React.ReactNode> = {
  'Distress Elevation': <Brain className="h-4 w-4" />,
  'Consequence Awareness': <AlertTriangle className="h-4 w-4" />,
  'Resistance Fatigue': <ShieldOff className="h-4 w-4" />,
  'Instability / System Disruption': <Zap className="h-4 w-4" />,
  'Help-Proximity Behavior': <HeartHandshake className="h-4 w-4" />,
};

const trendIcons: Record<TrendDirection, React.ReactNode> = {
  up: <TrendingUp className="h-3.5 w-3.5 text-primary" />,
  down: <TrendingDown className="h-3.5 w-3.5 text-destructive" />,
  stable: <Minus className="h-3.5 w-3.5 text-muted-foreground" />,
};

const trendLabels: Record<TrendDirection, string> = {
  up: 'Increasing',
  down: 'Decreasing',
  stable: 'Stable',
};

interface SignalCardsProps {
  signals: SignalCategory[];
}

export function SignalCards({ signals }: SignalCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {signals.map((signal) => (
        <Card key={signal.name} className="relative overflow-hidden">
          <CardHeader className="pb-2 pt-4 px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                {categoryIcons[signal.name]}
                <span className="text-xs font-medium uppercase tracking-wide">{Math.round(signal.weight * 100)}% weight</span>
              </div>
              <Badge variant="outline" className="text-xs gap-1 px-1.5 py-0">
                {trendIcons[signal.trend]}
                {trendLabels[signal.trend]}
              </Badge>
            </div>
            <CardTitle className="text-sm font-semibold mt-1 leading-tight">{signal.name}</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="flex items-end gap-2 mb-2">
              <span className="text-2xl font-bold text-foreground">{signal.currentScore}</span>
              <span className="text-xs text-muted-foreground mb-1">/ 10</span>
            </div>
            <Progress value={signal.currentScore * 10} className="h-1.5 mb-3" />
            <p className="text-xs text-muted-foreground leading-relaxed mb-2">{signal.explanation}</p>
            <div className="space-y-1">
              {signal.recentSignals.slice(0, 2).map((sig, i) => (
                <p key={i} className="text-xs text-foreground/70 italic">• {sig}</p>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
