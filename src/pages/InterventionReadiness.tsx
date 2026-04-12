import { useState, useMemo } from 'react';
import { ArrowLeft, Info, Loader2, Zap, Eye } from 'lucide-react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ReadinessHeader } from '@/components/intervention/ReadinessHeader';
import { SignalCards } from '@/components/intervention/SignalCards';
import { SignalFeed } from '@/components/intervention/SignalFeed';
import { RecommendationPanel } from '@/components/intervention/RecommendationPanel';
import { FamilyGuidancePanel } from '@/components/intervention/FamilyGuidancePanel';
import { InterventionAlerts } from '@/components/intervention/InterventionAlerts';
import { ReadinessTrends } from '@/components/intervention/ReadinessTrends';
import { ClinicianNotes } from '@/components/intervention/ClinicianNotes';
import { CaseWorkflow, getSuggestedStatus } from '@/components/intervention/CaseWorkflow';
import { ScoringLogicPanel } from '@/components/intervention/ScoringLogicPanel';
import { KeyChangesPanel } from '@/components/intervention/KeyChangesPanel';
import { TopDriversPanel } from '@/components/intervention/TopDriversPanel';
import { MisTimingRiskPanel } from '@/components/intervention/MisTimingRiskPanel';
import { Next72HourStrategyPanel } from '@/components/intervention/Next72HourStrategyPanel';
import { InterventionPrepChecklist } from '@/components/intervention/InterventionPrepChecklist';
import { InterventionistModePanel } from '@/components/intervention/InterventionistModePanel';
import {
  demoClient,
  calculateReadinessScore,
  getStatusLabel,
  getRecommendation,
  getWindowStability,
} from '@/data/interventionReadinessData';
import type { ObservedIndicator, ClinicianNote, CaseStatus } from '@/data/interventionReadinessData';
import { SEOHead } from '@/components/SEOHead';
import { useAuth } from '@/hooks/useAuth';
import { useUserFamilyRole } from '@/hooks/useUserFamilyRole';

const InterventionReadiness = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isDemo = searchParams.get('demo') === 'true';
  const { user, loading: authLoading } = useAuth();
  const { isRecovering, loading: roleLoading } = useUserFamilyRole();
  const [indicators, setIndicators] = useState<ObservedIndicator[]>(demoClient.indicators);
  const [notes, setNotes] = useState<ClinicianNote[]>(demoClient.notes);
  const [signals] = useState(demoClient.signals);
  const [caseStatus, setCaseStatus] = useState<CaseStatus>(demoClient.caseStatus);

  const totalScore = useMemo(() => calculateReadinessScore(signals), [signals]);
  const statusLabel = useMemo(() => getStatusLabel(totalScore), [totalScore]);
  const recommendation = useMemo(() => getRecommendation(totalScore), [totalScore]);
  const suggestedStatus = useMemo(() => getSuggestedStatus(totalScore), [totalScore]);
  const windowStability = useMemo(() => getWindowStability(demoClient.history), []);

  // Skip auth checks in demo mode
  if (!isDemo) {
    if (authLoading || roleLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    if (!user) {
      return <Navigate to="/auth" replace />;
    }

    if (isRecovering) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  const handleAddIndicator = (ind: ObservedIndicator) => {
    setIndicators((prev) => [ind, ...prev]);
  };

  const handleAddNote = (note: ClinicianNote) => {
    setNotes((prev) => [note, ...prev]);
  };

  return (
    <>
      <SEOHead
        title="Intervention Readiness Engine | FamilyBridge"
        description="Strategic decision-support tool for timing interventions based on family patterns and readiness signals."
      />
      <div className="min-h-screen bg-background">
        {/* Demo banner */}
        {isDemo && (
          <div className="bg-warning/10 border-b border-warning/30">
            <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Eye className="h-4 w-4 text-warning" />
                <span className="font-medium text-foreground">Demo Mode</span>
                <span className="text-muted-foreground hidden sm:inline">— Viewing sample intervention readiness data</span>
              </div>
              <Button size="sm" className="h-7 text-xs bg-primary text-primary-foreground" onClick={() => navigate('/family-purchase')}>
                Get Started
              </Button>
            </div>
          </div>
        )}

        {/* Top bar */}
        <div className="border-b bg-card/50 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to={isDemo ? '/' : '/dashboard'}>
                <Button variant="ghost" size="sm" className="h-8 gap-1.5">
                  <ArrowLeft className="h-4 w-4" /> {isDemo ? 'Home' : 'Back'}
                </Button>
              </Link>
              <h2 className="text-sm font-semibold text-foreground">Intervention Readiness Engine</h2>
            </div>
            <ScoringLogicPanel signals={signals} totalScore={totalScore} />
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
          {/* Alerts banner */}
          <InterventionAlerts alerts={demoClient.alerts} />

          {/* Header with score + window stability */}
          <ReadinessHeader
            clientName={demoClient.name}
            totalScore={totalScore}
            statusLabel={statusLabel}
            windowStability={windowStability}
            lastUpdated={demoClient.lastUpdated}
            summary={demoClient.summary}
          />

          {/* Case workflow */}
          <CaseWorkflow
            currentStatus={caseStatus}
            suggestedStatus={suggestedStatus}
            onStatusChange={setCaseStatus}
          />

          {/* Execution System Link */}
          {totalScore >= 65 && (
            <div
              className="p-4 rounded-xl border-2 border-destructive/40 bg-destructive/5 cursor-pointer hover:bg-destructive/10 transition-colors"
              onClick={() => navigate('/intervention-execution')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <Zap className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-destructive">
                      {totalScore >= 80 ? 'Intervention Execution System — Critical Window Active' : 'Intervention Execution System — Preparation Mode'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {totalScore >= 80
                        ? 'Readiness threshold exceeded. Open the step-by-step execution engine to coordinate immediate action.'
                        : 'Readiness is approaching actionable range. Begin structured preparation.'}
                    </p>
                  </div>
                </div>
                <Button variant="destructive" size="sm" className="shrink-0">
                  Open →
                </Button>
              </div>
            </div>
          )}

          {/* Key Changes + Top Drivers */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <KeyChangesPanel changes={demoClient.keyChanges} />
            <TopDriversPanel drivers={demoClient.topDrivers} />
          </div>

          {/* Five signal cards */}
          <SignalCards signals={signals} />

          {/* Interventionist Mode */}
          <InterventionistModePanel insight={demoClient.interventionistInsight} />

          {/* Recommendation + Mis-Timing Risk */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <RecommendationPanel recommendation={recommendation} statusLabel={statusLabel} />
            <MisTimingRiskPanel risk={demoClient.misTimingRisk} />
          </div>

          {/* 72-Hour Strategy */}
          <Next72HourStrategyPanel strategy={demoClient.next72HourStrategy} />

          {/* Family Guidance + Prep Checklist */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <FamilyGuidancePanel statusLabel={statusLabel} />
            <InterventionPrepChecklist items={demoClient.prepChecklist} score={totalScore} />
          </div>

          {/* Trends */}
          <ReadinessTrends history={demoClient.history} />

          {/* Signal feed + Notes */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <SignalFeed indicators={indicators} onAddIndicator={handleAddIndicator} />
            <ClinicianNotes notes={notes} onAddNote={handleAddNote} />
          </div>

          {/* Disclaimer */}
          <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border border-border text-xs text-muted-foreground">
            <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <p>
              This tool supports intervention planning and pattern review. It does not diagnose substance
              use disorder, predict behavior with certainty, or replace medical, legal, or emergency
              judgment. Scores are directional and interpretive. Humans remain responsible for all final
              decisions and should involve qualified local professionals when needed.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default InterventionReadiness;
