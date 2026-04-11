import { useState } from 'react';
import { ArrowLeft, Loader2, Shield, RefreshCw } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SEOHead } from '@/components/SEOHead';
import { useAuth } from '@/hooks/useAuth';
import { useUserFamilyRole } from '@/hooks/useUserFamilyRole';
import { OutcomeSelector } from '@/components/intervention/continuity/OutcomeSelector';
import { AcceptedTreatmentPath } from '@/components/intervention/continuity/AcceptedTreatmentPath';
import { DeclinedTreatmentPath } from '@/components/intervention/continuity/DeclinedTreatmentPath';
import { FamilyRecoveryMode } from '@/components/intervention/continuity/FamilyRecoveryMode';
import { ContinuityTimeline } from '@/components/intervention/continuity/ContinuityTimeline';
import { ContinuityAlerts } from '@/components/intervention/continuity/ContinuityAlerts';
import { ContinuityNotes } from '@/components/intervention/continuity/ContinuityNotes';

const PostInterventionContinuity = () => {
  const { user, loading: authLoading } = useAuth();
  const { isRecovering, loading: roleLoading } = useUserFamilyRole();
  const [outcome, setOutcome] = useState<'accepted' | 'declined' | null>(null);

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (isRecovering) return <Navigate to="/dashboard" replace />;

  return (
    <>
      <SEOHead
        title="Post-Intervention Continuity Engine | FamilyBridge"
        description="Active stabilization and follow-through engine for post-intervention care continuity."
      />
      <div className="min-h-screen bg-background">
        {/* Top bar */}
        <div className="border-b bg-card/50 sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/intervention-execution">
                <Button variant="ghost" size="sm" className="h-8 gap-1.5">
                  <ArrowLeft className="h-4 w-4" /> Execution System
                </Button>
              </Link>
              <h2 className="text-sm font-semibold text-foreground">Post-Intervention Continuity Engine</h2>
            </div>
            <div className="flex items-center gap-2">
              {outcome && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 text-xs"
                  onClick={() => setOutcome(null)}
                >
                  <RefreshCw className="h-3 w-3" /> Change Outcome
                </Button>
              )}
              {outcome && (
                <Badge variant={outcome === 'accepted' ? 'default' : 'secondary'}>
                  {outcome === 'accepted' ? 'Treatment Accepted' : 'Treatment Declined'}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
          {/* Outcome Selection or Path */}
          {!outcome ? (
            <OutcomeSelector onSelect={setOutcome} />
          ) : (
            <>
              {/* Alerts */}
              <ContinuityAlerts outcome={outcome} />

              {/* Outcome-specific path */}
              {outcome === 'accepted' ? <AcceptedTreatmentPath /> : <DeclinedTreatmentPath />}

              {/* Family Recovery Mode (both paths) */}
              <FamilyRecoveryMode outcome={outcome} />

              {/* Timeline */}
              <ContinuityTimeline outcome={outcome} />

              {/* Notes */}
              <ContinuityNotes />

              {/* Transition Logic */}
              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <p className="text-sm font-semibold text-foreground mb-1">
                  {outcome === 'accepted' ? 'Transition Path: Long-Term Monitoring' : 'Transition Path: Readiness Re-Engagement'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {outcome === 'accepted'
                    ? 'As treatment progresses, this system transitions into long-term recovery monitoring through the Recovery Trajectory and Care Transitions tools. Aftercare planning should begin before discharge.'
                    : 'When new readiness signals emerge, the system will automatically loop back to the Intervention Readiness Engine for score re-evaluation. Maintain boundary consistency—this is the primary driver of future readiness windows.'}
                </p>
              </div>

              {/* Ethical Guardrail */}
              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border border-border text-xs text-muted-foreground">
                <Shield className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <p>
                  This system supports continuity of care and accountability. It does not promote control, coercion, or punishment.
                  All guidance emphasizes consistency, autonomy, and creating conditions for voluntary acceptance of help.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default PostInterventionContinuity;
