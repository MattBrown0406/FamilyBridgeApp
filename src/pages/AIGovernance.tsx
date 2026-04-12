import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Shield, ArrowLeft, ChevronRight, ChevronDown, ChevronUp, Lock, Info,
  CheckCircle2, AlertTriangle, XCircle, RotateCcw, Clock, ScrollText,
  Activity, Layers, Scale, Bell, Settings, Eye, BarChart3, Combine,
  TrendingUp, TrendingDown, Gauge, ShieldCheck, Database,
} from 'lucide-react';
import PublicCrisisHelp from '@/components/PublicCrisisHelp';
import {
  systemOverview, dataTiers, recentAdaptations, pendingChanges,
  suppressedAdaptations, interactionGovernance, auditLog,
  sampleThresholds, changeSizeLimits,
  type StabilityLevel, type AdaptationTier, type GovernanceStatus,
} from '@/data/governanceDemoData';

const stabilityBadge = (level: StabilityLevel) => {
  const map: Record<StabilityLevel, { className: string; label: string }> = {
    volatile: { className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', label: 'Volatile' },
    emerging: { className: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200', label: 'Emerging' },
    stable: { className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', label: 'Stable' },
    strong: { className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200', label: 'Strong' },
  };
  const cfg = map[level];
  return <Badge className={`text-xs ${cfg.className}`}>{cfg.label}</Badge>;
};

const tierBadge = (tier: AdaptationTier) => {
  const map: Record<AdaptationTier, { className: string; label: string }> = {
    tactical: { className: 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200', label: 'Tier 1 · Tactical' },
    predictive: { className: 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200', label: 'Tier 2 · Predictive' },
    structural: { className: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200', label: 'Tier 3 · Structural' },
  };
  const cfg = map[tier];
  return <Badge className={`text-xs ${cfg.className}`}>{cfg.label}</Badge>;
};

const statusIcon = (status: GovernanceStatus) => {
  switch (status) {
    case 'auto_applied': return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
    case 'approved': return <CheckCircle2 className="h-4 w-4 text-blue-600" />;
    case 'pending': return <Clock className="h-4 w-4 text-amber-600" />;
    case 'suppressed': return <XCircle className="h-4 w-4 text-muted-foreground" />;
    case 'rolled_back': return <RotateCcw className="h-4 w-4 text-red-600" />;
  }
};

const statusLabel = (status: GovernanceStatus) => {
  const map: Record<GovernanceStatus, { className: string; label: string }> = {
    auto_applied: { className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200', label: 'Auto-applied' },
    approved: { className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', label: 'Approved' },
    pending: { className: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200', label: 'Pending Review' },
    suppressed: { className: 'bg-muted text-muted-foreground', label: 'Suppressed' },
    rolled_back: { className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', label: 'Rolled Back' },
  };
  const cfg = map[status];
  return <Badge className={`text-xs ${cfg.className}`}>{cfg.label}</Badge>;
};

export default function AIGovernance() {
  const navigate = useNavigate();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sensitivity, setSensitivity] = useState([systemOverview.adaptationSensitivity]);
  const [autoApplyTactical, setAutoApplyTactical] = useState(true);
  const [autoApplyPredictive, setAutoApplyPredictive] = useState(true);
  const [requireApprovalStructural, setRequireApprovalStructural] = useState(true);

  const toggle = (id: string) => setExpandedId(expandedId === id ? null : id);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-1" /> Home
          </Button>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">AI Governance System</h1>
              <p className="text-sm text-muted-foreground">
                Controls how the platform learns, adapts, and updates — with full transparency and oversight.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Privacy Notice */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="py-3 px-4 flex items-start gap-3">
            <Lock className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground">
              This system adapts using aggregated, de-identified learning. All changes are bounded, transparent, and privacy-safe. No sensitive personal information is exposed or shared across unrelated users or organizations.
            </p>
          </CardContent>
        </Card>

        {/* System Status Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="h-4 w-4 text-emerald-600" />
                <span className="text-xs text-muted-foreground">Learning Status</span>
              </div>
              <p className="text-lg font-semibold capitalize text-foreground">{systemOverview.learningStatus}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-2 mb-1">
                <Gauge className="h-4 w-4 text-blue-600" />
                <span className="text-xs text-muted-foreground">System Health</span>
              </div>
              <p className="text-lg font-semibold capitalize text-foreground">{systemOverview.systemHealth}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-amber-600" />
                <span className="text-xs text-muted-foreground">Pending Review</span>
              </div>
              <p className="text-lg font-semibold text-foreground">{systemOverview.pendingReview}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="h-4 w-4 text-violet-600" />
                <span className="text-xs text-muted-foreground">Total Adaptations</span>
              </div>
              <p className="text-lg font-semibold text-foreground">{systemOverview.totalAdaptations}</p>
            </CardContent>
          </Card>
        </div>

        {/* Baseline Shift Gauge */}
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Total Baseline Shift</span>
              <span className="text-sm text-muted-foreground">
                {systemOverview.baselineShiftTotal}% / {systemOverview.maxAllowedShift}% max
              </span>
            </div>
            <Progress value={(systemOverview.baselineShiftTotal / systemOverview.maxAllowedShift) * 100} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              Absolute maximum shift cap prevents runaway model drift.
            </p>
          </CardContent>
        </Card>

        {/* Main Tabs */}
        <Tabs defaultValue="overview">
          <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
            <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
            <TabsTrigger value="adaptations" className="text-xs">Adaptations</TabsTrigger>
            <TabsTrigger value="pending" className="text-xs">
              Pending ({pendingChanges.length})
            </TabsTrigger>
            <TabsTrigger value="suppressed" className="text-xs">Suppressed</TabsTrigger>
            <TabsTrigger value="admin" className="text-xs">Admin Controls</TabsTrigger>
            <TabsTrigger value="audit" className="text-xs">Audit Log</TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-4 mt-4">
            {/* Data Governance */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Database className="h-4 w-4" /> Data Governance Tiers
                </CardTitle>
                <CardDescription>How data is classified and protected throughout the learning pipeline</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {dataTiers.map((dt) => (
                  <div key={dt.tier} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                    <Badge variant={dt.color} className="text-xs mt-0.5 shrink-0">{dt.label}</Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">{dt.description}</p>
                      <p className="text-xs font-medium mt-1 text-foreground">{dt.usage}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Change Size Limits */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Scale className="h-4 w-4" /> Proportional Change Limits
                </CardTitle>
                <CardDescription>Adaptation size is proportional to signal stability</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {changeSizeLimits.map((cl) => (
                    <div key={cl.stability} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="text-sm font-medium text-foreground">{cl.stability}</p>
                        <p className="text-xs text-muted-foreground">{cl.description}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">{cl.maxChange}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Sample Thresholds */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Layers className="h-4 w-4" /> Minimum Sample Requirements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {sampleThresholds.map((st) => (
                    <div key={st.range} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-2">
                        {st.allowed
                          ? <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          : <XCircle className="h-4 w-4 text-muted-foreground" />
                        }
                        <div>
                          <p className="text-sm font-medium text-foreground">{st.range}</p>
                          <p className="text-xs text-muted-foreground">{st.description}</p>
                        </div>
                      </div>
                      <Badge variant={st.allowed ? 'default' : 'outline'} className="text-xs">{st.label}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Three-Tier Adaptation */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Layers className="h-4 w-4" /> Three-Tier Adaptation System
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 rounded-lg border bg-sky-50/50 dark:bg-sky-950/20">
                  <div className="flex items-center gap-2 mb-1">
                    {tierBadge('tactical')}
                    <span className="text-xs text-muted-foreground">Fast, low-risk</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Recommendation priority, alert urgency, escalation prompts, messaging emphasis.
                    Can update quickly when supported by recent signals.
                  </p>
                </div>
                <div className="p-3 rounded-lg border bg-violet-50/50 dark:bg-violet-950/20">
                  <div className="flex items-center gap-2 mb-1">
                    {tierBadge('predictive')}
                    <span className="text-xs text-muted-foreground">Controlled</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Variable weights, interaction importance, minor threshold tuning.
                    Requires repeated pattern confirmation and moderate confidence.
                  </p>
                </div>
                <div className="p-3 rounded-lg border bg-orange-50/50 dark:bg-orange-950/20">
                  <div className="flex items-center gap-2 mb-1">
                    {tierBadge('structural')}
                    <span className="text-xs text-muted-foreground">Protected</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Core scoring logic, major thresholds, system-wide weighting changes.
                    Requires strong evidence, high confidence, and admin approval.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Variable Interactions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Combine className="h-4 w-4" /> Variable Interaction Governance
                </CardTitle>
                <CardDescription>Detected interactions between variables and their adaptation eligibility</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {interactionGovernance.map((ig) => (
                  <div key={ig.id} className="p-3 rounded-lg border">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {ig.variables.map((v) => (
                        <Badge key={v} variant="secondary" className="text-xs">{v}</Badge>
                      ))}
                      {stabilityBadge(ig.stability)}
                      {ig.adaptationAllowed
                        ? <Badge className="text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">Adaptation Allowed</Badge>
                        : <Badge variant="outline" className="text-xs">Suppressed</Badge>
                      }
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{ig.effect}</p>
                    <p className="text-xs text-muted-foreground mt-1 italic">
                      {ig.sampleCount} cases · {ig.reason}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ADAPTATIONS TAB */}
          <TabsContent value="adaptations" className="space-y-3 mt-4">
            <p className="text-sm text-muted-foreground">
              All recent adaptations applied, rolled back, or proposed by the learning system.
            </p>
            {recentAdaptations.map((a) => (
              <Card key={a.id} className="overflow-hidden">
                <div
                  className="p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => toggle(a.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      {statusIcon(a.status)}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">{a.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{a.description}</p>
                      </div>
                    </div>
                    {expandedId === a.id ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap mt-2">
                    {statusLabel(a.status)}
                    {tierBadge(a.tier)}
                    {stabilityBadge(a.stability)}
                    <Badge variant="outline" className="text-xs">{a.affectedEngine}</Badge>
                    <span className="text-xs text-muted-foreground ml-auto">{a.timestamp}</span>
                  </div>
                </div>
                {expandedId === a.id && (
                  <div className="border-t px-4 py-3 bg-muted/20 space-y-3">
                    <div>
                      <p className="text-xs font-medium text-foreground mb-1">Rationale</p>
                      <p className="text-xs text-muted-foreground">{a.rationale}</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Confidence</p>
                        <p className="text-sm font-medium capitalize text-foreground">{a.confidence}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Magnitude</p>
                        <p className="text-sm font-medium text-foreground">{a.magnitude}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Sample Size</p>
                        <p className="text-sm font-medium text-foreground">{a.sampleCount} ({a.sampleRange})</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Stability</p>
                        <p className="text-sm font-medium capitalize text-foreground">{a.stability}</p>
                      </div>
                    </div>
                    {a.canRollback && (
                      <Button variant="outline" size="sm" className="text-xs">
                        <RotateCcw className="h-3 w-3 mr-1" /> Rollback This Change
                      </Button>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </TabsContent>

          {/* PENDING TAB */}
          <TabsContent value="pending" className="space-y-3 mt-4">
            <p className="text-sm text-muted-foreground">
              Changes awaiting admin review before application. Structural changes always require approval.
            </p>
            {pendingChanges.map((p) => (
              <Card key={p.id}>
                <CardContent className="pt-4 pb-3 space-y-3">
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{p.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{p.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {tierBadge(p.tier)}
                    {stabilityBadge(p.stability)}
                    <Badge variant="outline" className="text-xs">{p.affectedEngine}</Badge>
                    <Badge variant="outline" className="text-xs">{p.magnitude}</Badge>
                  </div>
                  <div className="p-2 rounded bg-muted/30">
                    <p className="text-xs text-muted-foreground">{p.rationale}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Confidence: <strong className="text-foreground capitalize">{p.confidence}</strong></span>
                    <span>·</span>
                    <span>{p.sampleCount} cases</span>
                    <span>·</span>
                    <span>{p.timestamp}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="text-xs">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Approve
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs">
                      <XCircle className="h-3 w-3 mr-1" /> Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* SUPPRESSED TAB */}
          <TabsContent value="suppressed" className="space-y-3 mt-4">
            <Card className="border-muted">
              <CardContent className="py-3 px-4 flex items-start gap-2">
                <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  These adaptations were suppressed because the system does not yet have enough privacy-safe, aggregated evidence to justify changes.
                </p>
              </CardContent>
            </Card>
            {suppressedAdaptations.map((s) => (
              <Card key={s.id}>
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-start gap-2 mb-2">
                    <XCircle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{s.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{s.reason}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {stabilityBadge(s.stability)}
                    <Badge variant="outline" className="text-xs">{s.affectedEngine}</Badge>
                  </div>
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span>Sample progress</span>
                      <span>{s.sampleCount} / {s.requiredSamples}</span>
                    </div>
                    <Progress value={(s.sampleCount / s.requiredSamples) * 100} className="h-1.5" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* ADMIN CONTROLS TAB */}
          <TabsContent value="admin" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Settings className="h-4 w-4" /> Adaptation Sensitivity
                </CardTitle>
                <CardDescription>Controls how aggressively the system adapts to new signals</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-foreground">Sensitivity Level</span>
                    <span className="text-sm font-medium text-foreground">{sensitivity[0]}%</span>
                  </div>
                  <Slider
                    value={sensitivity}
                    onValueChange={setSensitivity}
                    min={10}
                    max={100}
                    step={5}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Conservative</span>
                    <span>Aggressive</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" /> Auto-Apply Rules
                </CardTitle>
                <CardDescription>Configure which adaptation tiers can be auto-applied vs. requiring approval</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="text-sm font-medium text-foreground">Tier 1 · Tactical</p>
                    <p className="text-xs text-muted-foreground">Recommendation priority, alert urgency</p>
                  </div>
                  <Switch checked={autoApplyTactical} onCheckedChange={setAutoApplyTactical} />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="text-sm font-medium text-foreground">Tier 2 · Predictive</p>
                    <p className="text-xs text-muted-foreground">Variable weights, minor thresholds</p>
                  </div>
                  <Switch checked={autoApplyPredictive} onCheckedChange={setAutoApplyPredictive} />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="text-sm font-medium text-foreground">Tier 3 · Structural</p>
                    <p className="text-xs text-muted-foreground">Core scoring, major thresholds</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Always requires approval</span>
                    <Switch checked={requireApprovalStructural} onCheckedChange={setRequireApprovalStructural} disabled />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <RotateCcw className="h-4 w-4" /> Rollback System
                </CardTitle>
                <CardDescription>Automatic rollback triggers and manual controls</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 rounded-lg border">
                  <p className="text-sm font-medium text-foreground">Auto-Rollback Triggers</p>
                  <ul className="text-xs text-muted-foreground mt-1 space-y-1 list-disc list-inside">
                    <li>Prediction accuracy drops &gt; 2% after an adaptation</li>
                    <li>Recommendation effectiveness declines measurably</li>
                    <li>System stability indicator shifts to "Volatile"</li>
                  </ul>
                </div>
                <div className="p-3 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">Rollbacks Executed</p>
                      <p className="text-xs text-muted-foreground">{systemOverview.rolledBack} changes rolled back to date</p>
                    </div>
                    <Badge variant="outline" className="text-xs">{systemOverview.rolledBack}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Accountability Governance */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Scale className="h-4 w-4" /> Accountability Governance
                </CardTitle>
                <CardDescription>Special rules for family and provider accountability adaptation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 rounded-lg border">
                  <p className="text-sm font-medium text-foreground">Family Accountability</p>
                  <ul className="text-xs text-muted-foreground mt-1 space-y-1 list-disc list-inside">
                    <li>Only increase weighting if pattern is consistent across time or cases</li>
                    <li>Never overreact to isolated events or temporary distress</li>
                    <li>Adaptation driven by patterns, not moments</li>
                  </ul>
                </div>
                <div className="p-3 rounded-lg border">
                  <p className="text-sm font-medium text-foreground">Provider Accountability</p>
                  <ul className="text-xs text-muted-foreground mt-1 space-y-1 list-disc list-inside">
                    <li>Only increase weighting if delays or breakdowns are repeated</li>
                    <li>Never penalize one-off misses or isolated delays</li>
                    <li>Communication issues must be consistent before adaptation</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AUDIT LOG TAB */}
          <TabsContent value="audit" className="space-y-3 mt-4">
            <p className="text-sm text-muted-foreground">
              Complete audit trail of all governance decisions, adaptations, and administrative actions.
            </p>
            {auditLog.map((entry) => (
              <div key={entry.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                <ScrollText className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-foreground">{entry.action}</p>
                    {tierBadge(entry.tier)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{entry.detail}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <span>{entry.actor}</span>
                    <span>·</span>
                    <span>{entry.engine}</span>
                    <span>·</span>
                    <span>{entry.timestamp}</span>
                  </div>
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <Card className="border-muted">
          <CardContent className="py-4 px-4 space-y-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium text-foreground">Governance Principles</p>
            </div>
            <Separator />
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              <li>Adaptation is governed by signal stability, evidence strength, and proportional limits, not by fixed time delays.</li>
              <li>All changes are bounded, explainable, and auditable.</li>
              <li>No sensitive personal information is used in learning or exposed in outputs.</li>
              <li>Human judgment remains essential. This system supports decision-making, it does not replace it.</li>
            </ul>
          </CardContent>
        </Card>

        <PublicCrisisHelp className="max-w-3xl mx-auto" />

        {/* CTA */}
        <div className="text-center py-6">
          <p className="text-sm text-muted-foreground mb-3">
            Experience governed, adaptive intelligence with your own recovery data.
          </p>
          <Button onClick={() => navigate('/auth')} size="lg">
            Get Started <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
