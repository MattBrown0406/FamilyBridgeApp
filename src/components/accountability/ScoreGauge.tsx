import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';

interface Props {
  score: number;
  previousScore?: number | null;
  trend: string;
  label: string;
  size?: 'sm' | 'lg';
}

export const ScoreGauge = ({ score, previousScore, trend, label, size = 'lg' }: Props) => {
  const getScoreColor = (s: number) => {
    if (s >= 80) return 'text-green-600';
    if (s >= 60) return 'text-yellow-600';
    if (s >= 40) return 'text-orange-500';
    return 'text-red-600';
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'declining': return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'unstable': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      default: return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTrendLabel = () => {
    switch (trend) {
      case 'improving': return 'Improving';
      case 'declining': return 'Declining';
      case 'unstable': return 'Unstable';
      default: return 'Stable';
    }
  };

  const diff = previousScore != null ? score - previousScore : null;

  return (
    <div className={cn('text-center', size === 'lg' ? 'space-y-2' : 'space-y-1')}>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <div className={cn('font-bold', getScoreColor(score), size === 'lg' ? 'text-5xl' : 'text-3xl')}>
        {score}
      </div>
      <div className="flex items-center justify-center gap-1.5 text-sm">
        {getTrendIcon()}
        <span className="text-muted-foreground">{getTrendLabel()}</span>
        {diff != null && (
          <span className={cn('text-xs', diff >= 0 ? 'text-green-600' : 'text-red-600')}>
            ({diff >= 0 ? '+' : ''}{diff})
          </span>
        )}
      </div>
    </div>
  );
};
