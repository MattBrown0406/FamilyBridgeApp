import { useState, useMemo } from 'react';
import { ArrowLeft, Info, Loader2, ShieldAlert } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
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
import {
  demoClient,
  calculateReadinessScore,
  getStatusLabel,
  getRecommendation,
} from '@/data/interventionReadinessData';
import type { ObservedIndicator, ClinicianNote, CaseStatus } from '@/data/interventionReadinessData';
import { SEOHead } from '@/components/SEOHead';
import { useAuth } from '@/hooks/useAuth';
import { useUserFamilyRole } from '@/hooks/useUserFamilyRole';

const InterventionReadiness = () => {
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

  // Block recovering users from accessing this page
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
        description="Strategic decision-support tool for timing interventions based on pattern recognition and readiness signals."
      />
      <div className="min-h-screen bg-background">
        {/* Top bar */}
        <div className="border-b bg-card/50">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/dashboard">
                <Button variant="ghost" size="sm" className="h-8 gap-1.5">
                  <ArrowLeft className="h-4 w-4" /> Back
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

          {/* Header with score */}
          <ReadinessHeader
            clientName={demoClient.name}
            totalScore={totalScore}
            statusLabel={statusLabel}
            lastUpdated={demoClient.lastUpdated}
            summary={demoClient.summary}
          />

          {/* Case workflow */}
          <CaseWorkflow
            currentStatus={caseStatus}
            suggestedStatus={suggestedStatus}
            onStatusChange={setCaseStatus}
          />

          {/* Five signal cards */}
          <SignalCards signals={signals} />

          {/* Recommendation + Family guidance */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <RecommendationPanel recommendation={recommendation} statusLabel={statusLabel} />
            <FamilyGuidancePanel statusLabel={statusLabel} />
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
              This tool supports clinical and intervention decision-making through pattern recognition.
              It does not diagnose substance use disorder, predict behavior with certainty, or replace
              professional judgment. Scores are directional and interpretive. Humans remain responsible
              for all final clinical and intervention decisions.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default InterventionReadiness;
