import { useState, useMemo } from 'react';
import { ArrowLeft, Loader2, AlertTriangle, Zap, Info, Shield } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SEOHead } from '@/components/SEOHead';
import { useAuth } from '@/hooks/useAuth';
import { useUserFamilyRole } from '@/hooks/useUserFamilyRole';
import { calculateReadinessScore } from '@/data/interventionReadinessData';
import { demoClient } from '@/data/interventionReadinessData';
import { PreparationWorkflow } from '@/components/intervention/execution/PreparationWorkflow';
import { ExecutionWorkflow } from '@/components/intervention/execution/ExecutionWorkflow';
import { StrategyBuilder } from '@/components/intervention/execution/StrategyBuilder';
import { RoleAssignment } from '@/components/intervention/execution/RoleAssignment';
import { MessageAlignment } from '@/components/intervention/execution/MessageAlignment';
import { InterventionDayPlan } from '@/components/intervention/execution/InterventionDayPlan';
import { ContingencyPlan } from '@/components/intervention/execution/ContingencyPlan';
import { ExecutionStatusTracker } from '@/components/intervention/execution/ExecutionStatusTracker';
import { FamilyBehaviorLockIn } from '@/components/intervention/execution/FamilyBehaviorLockIn';
import { PostInterventionTracker } from '@/components/intervention/execution/PostInterventionTracker';
import { getStatusLabel } from '@/data/interventionReadinessData';

const InterventionExecution = () => {
  const { user, loading: authLoading } = useAuth();
  const { isRecovering, loading: roleLoading } = useUserFamilyRole();

  const totalScore = useMemo(() => calculateReadinessScore(demoClient.signals), []);
  const statusLabel = useMemo(() => getStatusLabel(totalScore), [totalScore]);
  const isExecutionMode = totalScore >= 80;
  const isPreparationMode = totalScore >= 65 && totalScore < 80;
  const isActive = totalScore >= 65;

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
        title="Intervention Execution System | FamilyBridge"
        description="Step-by-step intervention execution engine for families and professionals."
      />
      <div className="min-h-screen bg-background">
        {/* Top bar */}
        <div className="border-b bg-card/50 sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/intervention-readiness">
                <Button variant="ghost" size="sm" className="h-8 gap-1.5">
                  <ArrowLeft className="h-4 w-4" /> Readiness Engine
                </Button>
              </Link>
              <h2 className="text-sm font-semibold text-foreground">Intervention Execution System</h2>
            </div>
            <Badge variant={isExecutionMode ? 'destructive' : 'secondary'}>
              Score: {Math.round(totalScore)}
            </Badge>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
          {/* Mode Banner */}
          {isExecutionMode ? (
            <div className="p-4 rounded-xl bg-destructive/10 border-2 border-destructive/40">
              <div className="flex items-start gap-3">
                <Zap className="h-6 w-6 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-lg font-bold text-destructive">High-Attention Intervention Window</p>
                  <p className="text-sm text-foreground mt-1">
                    Readiness score is {Math.round(totalScore)}. Current signals suggest a narrower planning window over the next 24–72 hours.
                    Move with urgency, not panic.
                  </p>
                </div>
              </div>
            </div>
          ) : isPreparationMode ? (
            <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border-2 border-amber-300 dark:border-amber-700/50">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-lg font-bold text-amber-800 dark:text-amber-300">Preparation Mode</p>
                  <p className="text-sm text-foreground mt-1">
                    Readiness score is {Math.round(totalScore)}. Begin quiet preparation. Do not confront or destabilize the individual.
                    Watch for signs that the situation is moving into a higher-attention window.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-muted/50 border border-border">
              <div className="flex items-start gap-3">
                <Info className="h-6 w-6 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-lg font-bold text-foreground">Readiness Below Threshold</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Current score is {Math.round(totalScore)}. The execution system activates at 65+.
                    Continue monitoring via the Readiness Engine and maintaining boundaries.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Status Tracker */}
          <ExecutionStatusTracker score={totalScore} />

          {/* Mode-specific workflow */}
          {isExecutionMode && <ExecutionWorkflow />}
          {isPreparationMode && <PreparationWorkflow />}

          {/* Family Behavior Lock-In */}
          {isActive && <FamilyBehaviorLockIn isExecutionMode={isExecutionMode} />}

          {/* Strategy Builder */}
          {isActive && <StrategyBuilder score={totalScore} statusLabel={statusLabel} />}

          {/* Role Assignment */}
          {isActive && <RoleAssignment />}

          {/* Message Alignment */}
          {isActive && <MessageAlignment />}

          {/* Intervention Day Plan */}
          {isActive && <InterventionDayPlan />}

          {/* Contingency Plan */}
          {isActive && <ContingencyPlan />}

          {/* Post-Intervention Tracker */}
          {isActive && <PostInterventionTracker />}

          {/* Ethical Guardrail */}
          <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border border-border text-xs text-muted-foreground">
            <Shield className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <p>
              This system supports strategic intervention planning. It does not promote coercion or forced treatment.
              All actions are designed to support the chance that an individual may voluntarily accept help
              by aligning family behavior and timing with periods of greater openness.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default InterventionExecution;
