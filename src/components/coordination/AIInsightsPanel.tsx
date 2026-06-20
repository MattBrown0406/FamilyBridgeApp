import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Brain, AlertTriangle, TrendingUp, Search, Eye, EyeOff, Loader2 } from 'lucide-react';

interface Insight {
  id: string;
  insight_type: string;
  title: string;
  content: string;
  severity: string;
  is_dismissed: boolean;
  created_at: string;
}

interface Props {
  caseId: string;
  channelId: string;
  userId: string;
}

const severityConfig: Record<string, { color: string; icon: any }> = {
  critical: { color: 'bg-red-100 text-red-700 border-red-200', icon: AlertTriangle },
  warning: { color: 'bg-orange-100 text-orange-700 border-orange-200', icon: AlertTriangle },
  info: { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: TrendingUp },
  recommendation: { color: 'bg-green-100 text-green-700 border-green-200', icon: Search },
};

export const AIInsightsPanel = ({ caseId, channelId, userId }: Props) => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDismissed, setShowDismissed] = useState(false);

  useEffect(() => {
    loadInsights();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  const loadInsights = async () => {
    try {
      const { data } = await supabase
        .from('coordination_ai_insights')
        .select('*')
        .eq('case_id', caseId)
        .order('created_at', { ascending: false });
      setInsights(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const dismissInsight = async (insightId: string) => {
    try {
      await supabase.from('coordination_ai_insights')
        .update({ is_dismissed: true, dismissed_by: userId })
        .eq('id', insightId);
      setInsights(prev => prev.map(i => i.id === insightId ? { ...i, is_dismissed: true } : i));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  const activeInsights = insights.filter(i => !i.is_dismissed);
  const dismissedInsights = insights.filter(i => i.is_dismissed);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">AI Analysis Layer</CardTitle>
          </div>
          <Badge variant="outline" className="gap-1">
            {activeInsights.length} active insights
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          System-generated observations from cross-channel analysis. Visible to providers only.
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Explanation */}
        <div className="p-3 bg-muted/30 rounded-lg border">
          <p className="text-xs text-muted-foreground">
            <strong>How this works:</strong> The AI analysis layer aggregates patterns across family and provider
            channels to highlight communication gaps, alignment issues, and concern indicators. Observations are generated
            automatically as coordination activity occurs.
          </p>
        </div>

        {activeInsights.length === 0 && (
          <div className="text-center py-8">
            <Brain className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              No active observations yet. The AI will generate them as coordination activity occurs.
            </p>
          </div>
        )}

        {/* Active insights */}
        <div className="space-y-3">
          {activeInsights.map(insight => {
            const config = severityConfig[insight.severity] || severityConfig.info;
            const Icon = config.icon;
            return (
              <div key={insight.id} className={`p-4 rounded-lg border ${config.color}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <Icon className="h-4 w-4 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold">{insight.title}</p>
                      <p className="text-sm mt-1">{insight.content}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">{insight.insight_type}</Badge>
                        <Badge variant="outline" className="text-xs">{insight.severity}</Badge>
                      </div>
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 shrink-0"
                    onClick={() => dismissInsight(insight.id)}
                    title="Dismiss"
                  >
                    <EyeOff className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Dismissed toggle */}
        {dismissedInsights.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDismissed(!showDismissed)}
            className="w-full text-muted-foreground"
          >
            <Eye className="h-4 w-4 mr-1" />
            {showDismissed ? 'Hide' : 'Show'} {dismissedInsights.length} dismissed insights
          </Button>
        )}

        {showDismissed && dismissedInsights.map(insight => (
          <div key={insight.id} className="p-3 rounded-lg border opacity-50">
            <p className="text-sm font-medium">{insight.title}</p>
            <p className="text-xs text-muted-foreground mt-1">{insight.content}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
