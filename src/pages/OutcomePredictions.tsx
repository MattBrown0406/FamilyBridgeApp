import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Brain, AlertTriangle, TrendingUp, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useOutcomePredictions } from '@/hooks/useOutcomePredictions';
import { OutcomePredictionCard } from '@/components/predictions/OutcomePredictionCard';
import { RiskDriversPanel } from '@/components/predictions/RiskDriversPanel';
import { ProtectiveFactorsPanel } from '@/components/predictions/ProtectiveFactorsPanel';
import { ActionableInsightPanel } from '@/components/predictions/ActionableInsightPanel';
import { PredictionAlerts } from '@/components/predictions/PredictionAlerts';
import { TrajectoryChart } from '@/components/predictions/TrajectoryChart';
import { SystemAlignmentInsight } from '@/components/predictions/SystemAlignmentInsight';

export default function OutcomePredictions() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [familyId, setFamilyId] = useState<string>();

  useEffect(() => {
    if (!user) return;
    supabase
      .from('family_members')
      .select('family_id')
      .eq('user_id', user.id)
      .neq('role', 'recovering')
      .limit(1)
      .single()
      .then(({ data }) => { if (data) setFamilyId(data.family_id); });
  }, [user]);

  const {
    predictions, alerts, loading, calculating,
    calculatePredictions, dismissAlert, getHistorical,
  } = useOutcomePredictions(familyId);

  // Aggregate risk drivers and protective factors
  const allDrivers = [...new Set(predictions.flatMap(p => p.risk_drivers || []))].slice(0, 5);
  const allFactors = [...new Set(predictions.flatMap(p => p.protective_factors || []))].slice(0, 5);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Please sign in to access predictions.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                Outcome Predictions
              </h1>
              <p className="text-xs text-muted-foreground">Forward-looking recovery intelligence</p>
            </div>
          </div>
          <Button size="sm" onClick={calculatePredictions} disabled={calculating || !familyId}>
            <RefreshCw className={`h-4 w-4 mr-1.5 ${calculating ? 'animate-spin' : ''}`} />
            {calculating ? 'Calculating...' : 'Calculate'}
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
        {/* Alerts */}
        <PredictionAlerts alerts={alerts} onDismiss={dismissAlert} />

        {!familyId ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            No eligible family found. You need to be a non-recovering family member to view predictions.
          </div>
        ) : loading ? (
          <div className="text-center py-12 text-muted-foreground text-sm">Loading predictions...</div>
        ) : predictions.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <Brain className="h-10 w-10 mx-auto text-muted-foreground" />
            <p className="text-muted-foreground text-sm">No predictions calculated yet.</p>
            <Button onClick={calculatePredictions} disabled={calculating}>
              <RefreshCw className={`h-4 w-4 mr-1.5 ${calculating ? 'animate-spin' : ''}`} />
              Generate First Predictions
            </Button>
          </div>
        ) : (
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="w-full grid grid-cols-4">
              <TabsTrigger value="overview" className="text-xs">
                <Brain className="h-3.5 w-3.5 mr-1 hidden sm:inline" />Overview
              </TabsTrigger>
              <TabsTrigger value="risk" className="text-xs">
                <AlertTriangle className="h-3.5 w-3.5 mr-1 hidden sm:inline" />Risk
              </TabsTrigger>
              <TabsTrigger value="trajectory" className="text-xs">
                <TrendingUp className="h-3.5 w-3.5 mr-1 hidden sm:inline" />Trajectory
              </TabsTrigger>
              <TabsTrigger value="actions" className="text-xs">
                <Lightbulb className="h-3.5 w-3.5 mr-1 hidden sm:inline" />Actions
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {predictions.map(p => <OutcomePredictionCard key={p.id} prediction={p} />)}
              </div>
              <SystemAlignmentInsight predictions={predictions} />
            </TabsContent>

            <TabsContent value="risk" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <RiskDriversPanel drivers={allDrivers} />
                <ProtectiveFactorsPanel factors={allFactors} />
              </div>
              <div className="p-3 rounded-lg border bg-muted/30">
                <p className="text-xs text-muted-foreground italic">
                  Predictions are directional estimates based on available behavioral data. They support decision-making but do not guarantee outcomes. Patterns may shift if current trends reverse.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="trajectory">
              <TrajectoryChart getHistorical={getHistorical} />
            </TabsContent>

            <TabsContent value="actions">
              <ActionableInsightPanel predictions={predictions} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
