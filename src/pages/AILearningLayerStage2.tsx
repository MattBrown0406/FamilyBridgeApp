import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  Brain, Shield, TrendingUp, TrendingDown, Info, ChevronRight, ChevronDown, ChevronUp,
  Lock, ArrowLeft, AlertTriangle, CheckCircle2, BarChart3, RefreshCw,
  Scale, Bell, Combine, ClipboardCheck, ScrollText, Clock, X, Check,
} from 'lucide-react';
import {
  adaptiveWeights,
  thresholdAdjustments,
  variableInteractions,
  recommendationShifts,
  adminReviewQueue,
  auditLog,
  stage2Stats,
  type ConfidenceLevel,
  type ChangeStatus,
} from '@/data/learningLayerStage2Data';

const confidenceBadge = (level: ConfidenceLevel) => {
  const map: Record<ConfidenceLevel, { variant: 'default' | 'secondary' | 'outline'; label: string }> = {
    high: { variant: 'default', label: 'High' },
    moderate: { variant: 'secondary', label: 'Moderate' },
    low: { variant: 'outline', label: 'Low' },
  };
  const cfg = map[level];
  return <Badge variant={cfg.variant} className="text-xs">{cfg.label}</Badge>;
};

const statusBadge = (status: ChangeStatus) => {
  const map: Record<ChangeStatus, { className: string; label: string }> = {
    auto_applied: { className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200', label: 'Auto-applied' },
    approved: { className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', label: 'Approved' },
    pending_review: { className: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200', label: 'Pending Review' },
    rejected: { className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', label: 'Rejected' },
  };
  const cfg = map[status];
  return <Badge className={`text-xs ${cfg.className}`}>{cfg.label}</Badge>;
};

const impactBadge = (impact: string) => {
  const map: Record<string, string> = {
    low: 'bg-muted text-muted-foreground',
    medium: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
    high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };
  return <Badge className={`text-xs ${map[impact] || map.low}`}>{impact} impact</Badge>;
};

function WeightChangeBar({ previous, current, max = 0.30 }: { previous: number; current: number; max?: number }) {
  const prevPct = (previous / max) * 100;
  const currPct = (current / max) * 100;
  const increased = current > previous;

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 text-xs">
        <span className="text-muted-foreground w-16">Previous</span>
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-muted-foreground/30 rounded-full" style={{ width: `${prevPct}%` }} />
        </div>
        <span className="w-10 text-right font-mono">{previous.toFixed(2)}</span>
      </div>
      <div className="flex items-center gap-2 text-xs">
        <span className="text-muted-foreground w-16">Current</span>
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${increased ? 'bg-emerald-500' : 'bg-amber-500'}`}
            style={{ width: `${currPct}%` }}
          />
        </div>
        <span className="w-10 text-right font-mono font-medium">{current.toFixed(2)}</span>
      </div>
    </div>
  );
}

export default function AILearningLayerStage2() {
  const navigate = useNavigate();
  const [expandedWeights, setExpandedWeights] = useState<Set<string>>(new Set());

  const toggleWeight = (id: string) => {
    setExpandedWeights((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/ai-learning')} className="mb-3">
            <ArrowLeft className="h-4 w-4 mr-1" /> Stage 1
          </Button>

          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Brain className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-bold">AI Learning Layer</h1>
                <Badge variant="secondary">Stage 2 — Adaptive</Badge>
                <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">Demo</Badge>
              </div>
              <p className="text-sm text-muted-foreground max-w-2xl">
                Controlled adaptive learning — the platform refines scoring weights, alert thresholds, and recommendation
                priorities using aggregated, de-identified outcome data. All changes are bounded, explainable, and auditable.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-600" />
              <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                HIPAA Compliant · Bounded · Auditable
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Privacy Notice */}
        <Card className="border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20">
          <CardContent className="p-4 flex items-start gap-3">
            <Lock className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-sm space-y-1">
              <p className="font-medium text-emerald-800 dark:text-emerald-300">
                Privacy-Safe Adaptive Learning
              </p>
              <p className="text-emerald-700 dark:text-emerald-400">
                This platform uses aggregated, de-identified learning to improve scoring, alerts, and recommendations
                over time. Adaptive changes are bounded, privacy-safe, and reviewable. No protected health information
                is exposed across unrelated users or organizations.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {[
            { label: 'Total Adaptations', value: stage2Stats.totalAdaptations },
            { label: 'Auto-Applied', value: stage2Stats.autoApplied },
            { label: 'Admin Approved', value: stage2Stats.adminApproved },
            { label: 'Pending Review', value: stage2Stats.pendingReview },
            { label: 'Interactions Found', value: stage2Stats.interactionsDiscovered },
            { label: 'Avg. Confidence', value: stage2Stats.averageConfidence },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="weights" className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="weights" className="text-xs">
              <Scale className="h-3.5 w-3.5 mr-1 hidden sm:inline" />Weights
            </TabsTrigger>
            <TabsTrigger value="thresholds" className="text-xs">
              <Bell className="h-3.5 w-3.5 mr-1 hidden sm:inline" />Thresholds
            </TabsTrigger>
            <TabsTrigger value="interactions" className="text-xs">
              <Combine className="h-3.5 w-3.5 mr-1 hidden sm:inline" />Interactions
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="text-xs">
              <TrendingUp className="h-3.5 w-3.5 mr-1 hidden sm:inline" />Priorities
            </TabsTrigger>
            <TabsTrigger value="review" className="text-xs">
              <ClipboardCheck className="h-3.5 w-3.5 mr-1 hidden sm:inline" />Review
              {adminReviewQueue.filter(r => r.status === 'pending_review').length > 0 && (
                <Badge variant="destructive" className="ml-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                  {adminReviewQueue.filter(r => r.status === 'pending_review').length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="audit" className="text-xs">
              <ScrollText className="h-3.5 w-3.5 mr-1 hidden sm:inline" />Audit
            </TabsTrigger>
          </TabsList>

          {/* Adaptive Weights */}
          <TabsContent value="weights" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Scale className="h-4 w-4" /> Adaptive Variable Weights
                </CardTitle>
                <CardDescription>
                  How the platform has adjusted variable importance based on aggregated outcome learning.
                  Changes are gradual, capped, and require minimum confidence and sample thresholds.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {adaptiveWeights.map((w) => (
                  <Card key={w.id} className={`border-l-4 ${w.direction === 'increased' ? 'border-l-emerald-500' : 'border-l-amber-500'}`}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 flex-1">
                          {w.direction === 'increased'
                            ? <TrendingUp className="h-4 w-4 mt-0.5 shrink-0 text-emerald-600" />
                            : <TrendingDown className="h-4 w-4 mt-0.5 shrink-0 text-amber-600" />}
                          <div>
                            <p className="text-sm font-medium">{w.variable}</p>
                            <p className="text-xs text-muted-foreground">{w.engine} Engine</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {confidenceBadge(w.confidence)}
                          {statusBadge(w.status)}
                        </div>
                      </div>

                      <WeightChangeBar previous={w.previousWeight} current={w.currentWeight} />

                      <button onClick={() => toggleWeight(w.id)} className="text-xs text-primary hover:underline flex items-center gap-1">
                        {expandedWeights.has(w.id) ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        {expandedWeights.has(w.id) ? 'Hide rationale' : 'View rationale'}
                      </button>

                      {expandedWeights.has(w.id) && (
                        <div className="text-xs text-muted-foreground space-y-1 pl-6 border-l-2 border-muted">
                          <p>{w.reason}</p>
                          <div className="flex gap-3 pt-1">
                            <span>Pattern stable for {w.stablePatternDays} days</span>
                            <span>·</span>
                            <span>Sample: {w.sampleSufficiency}</span>
                            {w.appliedAt && <><span>·</span><span>Applied {w.appliedAt}</span></>}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Threshold Adjustments */}
          <TabsContent value="thresholds" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Bell className="h-4 w-4" /> Adaptive Threshold Tuning
                </CardTitle>
                <CardDescription>
                  Alert and warning thresholds refined based on aggregated outcome patterns. Adjustments are bounded and explainable.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {thresholdAdjustments.map((t) => (
                  <Card key={t.id} className={`border-l-4 ${t.direction === 'lowered' ? 'border-l-blue-500' : 'border-l-amber-500'}`}>
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium">{t.alertType}</p>
                          <p className="text-xs text-muted-foreground">{t.engine} Engine</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {confidenceBadge(t.confidence)}
                          {statusBadge(t.status)}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Previous</p>
                          <p className="font-mono font-medium">{t.previousThreshold} {t.unit}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Current</p>
                          <p className={`font-mono font-medium ${t.direction === 'lowered' ? 'text-blue-600' : 'text-amber-600'}`}>
                            {t.currentThreshold} {t.unit}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs ml-2">
                          {t.direction === 'lowered' ? '↓ Earlier detection' : '↑ Noise reduction'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{t.reason}</p>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Variable Interactions */}
          <TabsContent value="interactions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Combine className="h-4 w-4" /> Variable Interaction Effects
                </CardTitle>
                <CardDescription>
                  Combinations of variables that produce stronger effects than either variable alone. All findings are aggregated and de-identified.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {variableInteractions.map((vi) => (
                  <Card key={vi.id} className="border-l-4 border-l-purple-500">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-wrap gap-1.5">
                          {vi.variables.map((v, i) => (
                            <span key={v} className="flex items-center gap-1">
                              <Badge variant="outline" className="text-xs">{v}</Badge>
                              {i < vi.variables.length - 1 && <span className="text-xs text-muted-foreground">+</span>}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {confidenceBadge(vi.confidence)}
                          <Badge variant="outline" className="text-xs capitalize">{vi.strength}</Badge>
                        </div>
                      </div>
                      <p className="text-sm">{vi.interaction}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Effect: {vi.effect}</span>
                        <span>·</span>
                        <span>Outcome: {vi.affectedOutcome}</span>
                        <span>·</span>
                        <span>Discovered {vi.discoveredAt}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recommendation Prioritization */}
          <TabsContent value="recommendations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" /> Recommendation Priority Shifts
                </CardTitle>
                <CardDescription>
                  How the platform has re-ordered recommendations based on learned effectiveness. Higher priority = shown earlier and emphasized more strongly.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {recommendationShifts.map((rs) => {
                  const moved = rs.previousPriority - rs.currentPriority;
                  const movedUp = moved > 0;
                  return (
                    <Card key={rs.id} className={`border-l-4 ${movedUp ? 'border-l-emerald-500' : 'border-l-amber-500'}`}>
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium">{rs.recommendation}</p>
                          <div className="flex items-center gap-2 shrink-0">
                            {confidenceBadge(rs.confidence)}
                            <Badge variant={movedUp ? 'default' : 'secondary'} className="text-xs">
                              {movedUp ? `↑ +${moved}` : `↓ ${moved}`}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-muted-foreground">Context: {rs.context}</span>
                          <span>·</span>
                          <span>Priority #{rs.previousPriority} → #{rs.currentPriority}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{rs.reason}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Admin Review Queue */}
          <TabsContent value="review" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4" /> Admin Review Queue
                </CardTitle>
                <CardDescription>
                  Higher-impact adaptive changes requiring admin approval before application. Low-impact, high-confidence changes may be auto-applied.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {adminReviewQueue.map((item) => (
                  <Card key={item.id} className="border border-amber-200 dark:border-amber-800">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium">{item.title}</p>
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {impactBadge(item.impact)}
                          {confidenceBadge(item.confidence)}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="rounded-lg bg-muted p-3">
                          <p className="text-xs text-muted-foreground mb-1">Current</p>
                          <p className="font-mono font-medium">{item.currentValue}</p>
                        </div>
                        <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
                          <p className="text-xs text-muted-foreground mb-1">Proposed</p>
                          <p className="font-mono font-medium text-primary">{item.proposedValue}</p>
                        </div>
                      </div>

                      <div className="text-xs text-muted-foreground border-l-2 border-muted pl-3">
                        <p className="font-medium text-foreground mb-1">Rationale</p>
                        <p>{item.rationale}</p>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Submitted {item.submittedAt}</span>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="text-xs h-7">
                            <X className="h-3 w-3 mr-1" /> Reject
                          </Button>
                          <Button size="sm" className="text-xs h-7">
                            <Check className="h-3 w-3 mr-1" /> Approve
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audit Log */}
          <TabsContent value="audit" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ScrollText className="h-4 w-4" /> Adaptation Audit Log
                </CardTitle>
                <CardDescription>
                  Complete record of all learning-driven adjustments — what changed, why, when, and how it was approved.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-0">
                  {auditLog.map((entry, idx) => (
                    <div key={entry.id} className="flex gap-3 py-3 border-b last:border-0">
                      <div className="shrink-0 pt-0.5">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono text-muted-foreground">{entry.timestamp}</span>
                          <Badge variant="outline" className="text-xs">{entry.engine}</Badge>
                          {statusBadge(entry.status)}
                          {confidenceBadge(entry.confidence)}
                        </div>
                        <p className="text-sm font-medium">{entry.action}</p>
                        <p className="text-xs text-muted-foreground">{entry.detail}</p>
                        <p className="text-xs text-muted-foreground italic">{entry.appliedBy}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Transparency Footer */}
        <Card className="border-muted">
          <CardContent className="p-4 space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Info className="h-4 w-4" /> Adaptive Learning Guardrails
            </h3>
            <div className="grid md:grid-cols-2 gap-4 text-xs text-muted-foreground">
              <div className="space-y-1.5">
                <p className="font-medium text-foreground">Bounded change rules:</p>
                <ul className="space-y-1 list-disc pl-4">
                  <li>All weight changes are gradual and capped within safe limits</li>
                  <li>Minimum sample thresholds required before any adaptation</li>
                  <li>Confidence scoring required before changes are applied</li>
                  <li>High-impact changes require admin review and approval</li>
                  <li>Complete audit trail maintained for every adjustment</li>
                </ul>
              </div>
              <div className="space-y-1.5">
                <p className="font-medium text-foreground">What is never done:</p>
                <ul className="space-y-1 list-disc pl-4">
                  <li>No sudden dramatic reweighting of core variables</li>
                  <li>No adaptation from small or identifiable sample sets</li>
                  <li>No opaque or unexplainable model changes</li>
                  <li>No deterministic claims — correlation ≠ certainty</li>
                  <li>No exposure of protected health information</li>
                  <li>No cross-org benchmarking or comparison</li>
                </ul>
              </div>
            </div>
            <Separator />
            <p className="text-xs text-muted-foreground italic">
              Adaptive changes are based on aggregated, de-identified outcome learning.
              Human judgment remains essential — this system supports decision-making, it does not replace it.
            </p>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center py-6">
          <p className="text-sm text-muted-foreground mb-3">
            Experience adaptive intelligence with your own recovery data.
          </p>
          <Button onClick={() => navigate('/auth')} size="lg">
            Get Started <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
