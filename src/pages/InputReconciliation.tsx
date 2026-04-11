import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { SEOHead } from '@/components/SEOHead';
import {
  AlertTriangle, CheckCircle2, Clock, ArrowLeft, Shield, Eye,
  MessageSquare, FileText, TrendingUp, Bell, ChevronDown, ChevronUp,
  XCircle, HelpCircle, BarChart3, RefreshCw, ArrowRight, Building2, Users, Globe,
} from 'lucide-react';
import {
  demoDetectedIssues, demoDataConfidence, demoDepthPrompts, demoDeferrals,
  demoReconciliationTimeline, systemImpactSummary,
  demoPlatformHealth, demoOrgInputHealth, demoTopIssueCategories,
  type DetectedIssue, type InputConfidence, type TrackingState,
} from '@/data/inputReconciliationDemoData';
import { useSuperAdmin } from '@/hooks/useSuperAdmin';
import { format } from 'date-fns';

const confidenceBadge = (c: InputConfidence) => {
  switch (c) {
    case 'high': return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">High</Badge>;
    case 'moderate': return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Moderate</Badge>;
    case 'low': return <Badge className="bg-red-100 text-red-800 border-red-200">Low</Badge>;
  }
};

const stateLabel = (s: TrackingState) => {
  const map: Record<TrackingState, { label: string; cls: string }> = {
    shallow_input: { label: 'Shallow Input', cls: 'bg-amber-100 text-amber-800 border-amber-200' },
    incomplete_input: { label: 'Incomplete', cls: 'bg-orange-100 text-orange-800 border-orange-200' },
    unresolved_contradiction: { label: 'Contradiction', cls: 'bg-red-100 text-red-800 border-red-200' },
    partial_clarification: { label: 'Partial', cls: 'bg-blue-100 text-blue-800 border-blue-200' },
    resolved: { label: 'Resolved', cls: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  };
  const m = map[s];
  return <Badge className={m.cls}>{m.label}</Badge>;
};

const typeIcon = (t: DetectedIssue['type']) => {
  switch (t) {
    case 'shallow': return <HelpCircle className="h-4 w-4 text-amber-500" />;
    case 'incomplete': return <FileText className="h-4 w-4 text-orange-500" />;
    case 'contradiction': return <XCircle className="h-4 w-4 text-red-500" />;
  }
};

/* =============================================
   SUPER ADMIN SITE-WIDE OVERVIEW COMPONENT
   ============================================= */
const PlatformHealthOverview = () => {
  const ph = demoPlatformHealth;
  const totalConf = ph.confidenceDistribution;
  const totalFamiliesWithConf = totalConf.low + totalConf.moderate + totalConf.high;

  return (
    <div className="space-y-6">
      {/* Top-level stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total Families', value: ph.totalFamilies, icon: Users },
          { label: 'Providers', value: ph.totalProviders, icon: Building2 },
          { label: 'Private Families', value: ph.privateFamilies, icon: Shield },
          { label: 'Avg Confidence', value: `${ph.avgDataConfidence}%`, icon: BarChart3, color: ph.avgDataConfidence >= 70 ? 'text-emerald-600' : ph.avgDataConfidence >= 50 ? 'text-amber-600' : 'text-red-600' },
          { label: 'Unresolved Issues', value: ph.totalUnresolved, icon: AlertTriangle, color: 'text-red-600' },
          { label: 'Deferrals Overdue', value: ph.totalDeferralsOverdue, icon: Clock, color: 'text-amber-600' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="py-3 px-4">
              <div className="flex items-center gap-2 mb-1">
                <s.icon className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
              <p className={`text-xl font-bold ${s.color || ''}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Confidence Distribution */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Data Confidence Distribution Across All Families</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'High Confidence', count: totalConf.high, pct: Math.round((totalConf.high / totalFamiliesWithConf) * 100), cls: 'text-emerald-600' },
              { label: 'Moderate', count: totalConf.moderate, pct: Math.round((totalConf.moderate / totalFamiliesWithConf) * 100), cls: 'text-amber-600' },
              { label: 'Low Confidence', count: totalConf.low, pct: Math.round((totalConf.low / totalFamiliesWithConf) * 100), cls: 'text-red-600' },
            ].map(d => (
              <div key={d.label} className="text-center">
                <p className={`text-2xl font-bold ${d.cls}`}>{d.count}</p>
                <p className="text-xs text-muted-foreground">{d.label} ({d.pct}%)</p>
              </div>
            ))}
          </div>
          <div className="flex h-3 rounded-full overflow-hidden">
            <div className="bg-emerald-400" style={{ width: `${(totalConf.high / totalFamiliesWithConf) * 100}%` }} />
            <div className="bg-amber-400" style={{ width: `${(totalConf.moderate / totalFamiliesWithConf) * 100}%` }} />
            <div className="bg-red-400" style={{ width: `${(totalConf.low / totalFamiliesWithConf) * 100}%` }} />
          </div>
        </CardContent>
      </Card>

      {/* Issue Breakdown + Learning Impact */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Issue Breakdown (Platform-Wide)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { label: 'Contradictions', value: ph.totalContradictions, icon: XCircle, cls: 'text-red-500' },
              { label: 'Shallow Inputs', value: ph.totalShallowInputs, icon: HelpCircle, cls: 'text-amber-500' },
              { label: 'Incomplete Data', value: ph.totalIncomplete, icon: FileText, cls: 'text-orange-500' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <item.icon className={`h-4 w-4 ${item.cls}`} />
                  <span className="text-sm">{item.label}</span>
                </div>
                <span className="font-semibold text-sm">{item.value}</span>
              </div>
            ))}
            <Separator className="my-2" />
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total Unresolved</span>
              <span className="font-bold text-red-600">{ph.totalUnresolved}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Top Issue Categories</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {demoTopIssueCategories.map(cat => (
              <div key={cat.category}>
                <div className="flex justify-between text-xs mb-0.5">
                  <span>{cat.category}</span>
                  <span className="text-muted-foreground">{cat.count} issues ({cat.pct}%)</span>
                </div>
                <Progress value={cat.pct} className="h-1.5" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Per-Org / Per-Group Health Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Input Health by Provider & Family Group</CardTitle>
          <CardDescription className="text-xs">Aggregated, de-identified view of data quality across the platform.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="pb-2 pr-4">Organization</th>
                  <th className="pb-2 pr-3 text-center">Families</th>
                  <th className="pb-2 pr-3 text-center">Confidence</th>
                  <th className="pb-2 pr-3 text-center">Unresolved</th>
                  <th className="pb-2 pr-3 text-center">Contradictions</th>
                  <th className="pb-2 pr-3 text-center">Shallow</th>
                  <th className="pb-2 pr-3 text-center">Overdue</th>
                  <th className="pb-2 text-center">Learning Excluded</th>
                </tr>
              </thead>
              <tbody>
                {demoOrgInputHealth.map(org => (
                  <tr key={org.id} className="border-b last:border-b-0 hover:bg-muted/30">
                    <td className="py-2.5 pr-4">
                      <div className="flex items-center gap-2">
                        {org.type === 'provider' ? (
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                        ) : (
                          <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                        <span className="font-medium">{org.name}</span>
                      </div>
                    </td>
                    <td className="py-2.5 pr-3 text-center">{org.totalFamilies}</td>
                    <td className="py-2.5 pr-3 text-center">
                      <span className={`font-semibold ${org.avgConfidence >= 70 ? 'text-emerald-600' : org.avgConfidence >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                        {org.avgConfidence}%
                      </span>
                    </td>
                    <td className="py-2.5 pr-3 text-center">
                      <span className={org.unresolvedIssues > 10 ? 'text-red-600 font-semibold' : ''}>{org.unresolvedIssues}</span>
                    </td>
                    <td className="py-2.5 pr-3 text-center">
                      <span className={org.contradictions > 3 ? 'text-red-600 font-semibold' : ''}>{org.contradictions}</span>
                    </td>
                    <td className="py-2.5 pr-3 text-center">{org.shallowInputs}</td>
                    <td className="py-2.5 pr-3 text-center">
                      <span className={org.deferralsOverdue > 0 ? 'text-amber-600 font-semibold' : 'text-emerald-600'}>{org.deferralsOverdue}</span>
                    </td>
                    <td className="py-2.5 text-center">
                      <span className={org.learningExclusions > 5 ? 'text-red-600 font-semibold' : ''}>{org.learningExclusions}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Learning Impact */}
      <Card className="border-slate-200 bg-slate-50">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Eye className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium text-sm mb-1">Learning Layer Impact</p>
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-red-600">{ph.learningDataExcluded} families</span> currently have data excluded from cross-case pattern learning due to low input confidence. Improving data quality in these families will strengthen the platform's ability to generate reliable, privacy-safe insights.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 bg-slate-50">
        <CardContent className="py-3">
          <p className="text-xs text-muted-foreground italic">
            This view shows aggregated, de-identified input health data. No protected health information is displayed. All metrics represent data completeness and consistency quality — not clinical outcomes.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

/* =============================================
   MAIN PAGE COMPONENT
   ============================================= */
const InputReconciliation = () => {
  const navigate = useNavigate();
  const { isAdmin, isVerifying } = useSuperAdmin();
  const [expandedIssue, setExpandedIssue] = useState<string | null>(null);
  const [expandedPrompt, setExpandedPrompt] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'platform' | 'case'>('platform');

  const overallConfidence = Math.round(
    demoDataConfidence.reduce((s, d) => s + d.overall, 0) / demoDataConfidence.length
  );
  const unresolvedCount = demoDetectedIssues.filter(i => i.trackingState !== 'resolved').length;

  // Show platform view for super admins by default
  const showPlatformView = isAdmin || new URLSearchParams(window.location.search).has('demo');

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Input Reconciliation | FamilyBridge" description="Structured input accountability ensuring data quality for accurate guidance." />

      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Button variant="ghost" size="sm" className="text-white/70 hover:text-white mb-4" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Shield className="h-6 w-6" /> Input Reconciliation System
              </h1>
              <p className="text-white/70 mt-1 max-w-2xl text-sm">
                {showPlatformView
                  ? 'Platform-wide data quality health across all providers and families.'
                  : 'Ensuring input accuracy and completeness so guidance, predictions, and accountability remain reliable.'}
              </p>
              {showPlatformView && (
                <Badge className="mt-2 bg-white/20 text-white border-white/30">
                  <Globe className="h-3 w-3 mr-1" /> Super Admin — Site-Wide View
                </Badge>
              )}
            </div>
            <div className="flex gap-3">
              {showPlatformView ? (
                <>
                  <Card className="bg-white/10 border-white/20 text-white px-4 py-2">
                    <p className="text-xs text-white/60">Platform Confidence</p>
                    <p className={`text-xl font-bold ${demoPlatformHealth.avgDataConfidence >= 70 ? 'text-emerald-300' : demoPlatformHealth.avgDataConfidence >= 50 ? 'text-amber-300' : 'text-red-300'}`}>
                      {demoPlatformHealth.avgDataConfidence}%
                    </p>
                  </Card>
                  <Card className="bg-white/10 border-white/20 text-white px-4 py-2">
                    <p className="text-xs text-white/60">Unresolved</p>
                    <p className="text-xl font-bold text-red-300">{demoPlatformHealth.totalUnresolved}</p>
                  </Card>
                  <Card className="bg-white/10 border-white/20 text-white px-4 py-2">
                    <p className="text-xs text-white/60">Families</p>
                    <p className="text-xl font-bold">{demoPlatformHealth.totalFamilies}</p>
                  </Card>
                </>
              ) : (
                <>
                  <Card className="bg-white/10 border-white/20 text-white px-4 py-2">
                    <p className="text-xs text-white/60">Data Confidence</p>
                    <p className={`text-xl font-bold ${overallConfidence >= 70 ? 'text-emerald-300' : overallConfidence >= 50 ? 'text-amber-300' : 'text-red-300'}`}>
                      {overallConfidence}%
                    </p>
                  </Card>
                  <Card className="bg-white/10 border-white/20 text-white px-4 py-2">
                    <p className="text-xs text-white/60">Unresolved</p>
                    <p className="text-xl font-bold text-red-300">{unresolvedCount}</p>
                  </Card>
                </>
              )}
            </div>
          </div>

          {/* View Mode Toggle for super admin */}
          {showPlatformView && (
            <div className="flex gap-2 mt-4">
              <Button
                size="sm"
                variant={viewMode === 'platform' ? 'secondary' : 'ghost'}
                className={viewMode === 'platform' ? '' : 'text-white/70 hover:text-white'}
                onClick={() => setViewMode('platform')}
              >
                <Globe className="h-3.5 w-3.5 mr-1" /> Platform Health
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'case' ? 'secondary' : 'ghost'}
                className={viewMode === 'case' ? '' : 'text-white/70 hover:text-white'}
                onClick={() => setViewMode('case')}
              >
                <Users className="h-3.5 w-3.5 mr-1" /> Case-Level View
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Platform Health (Super Admin) */}
        {showPlatformView && viewMode === 'platform' && <PlatformHealthOverview />}

        {/* Case-Level View (original tabs) */}
        {(!showPlatformView || viewMode === 'case') && (
          <>
            {/* System Impact Banner */}
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                  <div className="space-y-1">
                    <p className="font-semibold text-sm text-amber-900">Guidance accuracy is currently limited</p>
                    <p className="text-xs text-amber-800">{systemImpactSummary.recommendations.message}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="issues" className="space-y-4">
              <TabsList className="grid grid-cols-5 w-full max-w-3xl">
                <TabsTrigger value="issues">Issues ({unresolvedCount})</TabsTrigger>
                <TabsTrigger value="confidence">Confidence</TabsTrigger>
                <TabsTrigger value="prompts">Depth Prompts</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="impact">System Impact</TabsTrigger>
              </TabsList>

              {/* ===== ISSUES TAB ===== */}
              <TabsContent value="issues" className="space-y-4">
                <p className="text-sm text-muted-foreground">Detected issues requiring clarification before the system can provide fully confident guidance.</p>
                {demoDetectedIssues.map(issue => {
                  const open = expandedIssue === issue.id;
                  return (
                    <Card key={issue.id} className={`border-l-4 ${issue.type === 'contradiction' ? 'border-l-red-400' : issue.type === 'incomplete' ? 'border-l-orange-400' : 'border-l-amber-400'}`}>
                      <CardContent className="py-4">
                        <div className="flex items-start justify-between gap-3 cursor-pointer" onClick={() => setExpandedIssue(open ? null : issue.id)}>
                          <div className="flex items-start gap-3 flex-1">
                            {typeIcon(issue.type)}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                {stateLabel(issue.trackingState)}
                                <Badge variant="outline" className="text-xs">{issue.category}</Badge>
                                <Badge variant="outline" className="text-xs">Level {issue.escalationLevel}</Badge>
                                <span className="text-xs text-muted-foreground ml-auto">{issue.familyMember}</span>
                              </div>
                              <p className="text-sm">{issue.summary}</p>
                            </div>
                          </div>
                          {open ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                        </div>

                        {open && (
                          <div className="mt-4 pl-7 space-y-3">
                            {issue.priorInput && (
                              <div className="space-y-1">
                                <p className="text-xs font-semibold text-muted-foreground">Prior Input</p>
                                <p className="text-sm italic bg-muted/50 rounded p-2">{issue.priorInput}</p>
                              </div>
                            )}
                            {issue.currentInput && (
                              <div className="space-y-1">
                                <p className="text-xs font-semibold text-muted-foreground">Current Input</p>
                                <p className="text-sm italic bg-muted/50 rounded p-2">{issue.currentInput}</p>
                              </div>
                            )}
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground mb-1">Required Information</p>
                              <ul className="space-y-1">
                                {issue.requiredInfo.map((r, i) => (
                                  <li key={i} className="text-sm flex items-start gap-2">
                                    <ArrowRight className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                                    {r}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div className="flex gap-2 pt-2">
                              <Button size="sm" variant="default">Provide Clarification</Button>
                              <Button size="sm" variant="outline">
                                <Clock className="h-3.5 w-3.5 mr-1" /> Defer
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </TabsContent>

              {/* ===== CONFIDENCE TAB ===== */}
              <TabsContent value="confidence" className="space-y-4">
                <p className="text-sm text-muted-foreground">Data confidence scores by category — higher scores mean more reliable guidance.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {demoDataConfidence.map(dc => (
                    <Card key={dc.category}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm">{dc.category}</CardTitle>
                          {confidenceBadge(dc.confidence)}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-2">
                          {[
                            { label: 'Completeness', value: dc.completeness },
                            { label: 'Consistency', value: dc.consistency },
                            { label: 'Specificity', value: dc.specificity },
                          ].map(m => (
                            <div key={m.label}>
                              <div className="flex justify-between text-xs mb-0.5">
                                <span className="text-muted-foreground">{m.label}</span>
                                <span className="font-medium">{m.value}%</span>
                              </div>
                              <Progress value={m.value} className="h-1.5" />
                            </div>
                          ))}
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium">Overall</span>
                          <span className={`text-sm font-bold ${dc.overall >= 70 ? 'text-emerald-600' : dc.overall >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                            {dc.overall}%
                          </span>
                        </div>
                        {dc.issues.length > 0 && (
                          <ul className="space-y-1">
                            {dc.issues.map((iss, i) => (
                              <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                                <AlertTriangle className="h-3 w-3 text-amber-500 mt-0.5 shrink-0" />
                                {iss}
                              </li>
                            ))}
                          </ul>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* ===== DEPTH PROMPTS TAB ===== */}
              <TabsContent value="prompts" className="space-y-4">
                <p className="text-sm text-muted-foreground">Active prompts requesting deeper, more specific input from family members.</p>
                {demoDepthPrompts.map(dp => {
                  const open = expandedPrompt === dp.id;
                  return (
                    <Card key={dp.id}>
                      <CardContent className="py-4">
                        <div className="flex items-start justify-between gap-3 cursor-pointer" onClick={() => setExpandedPrompt(open ? null : dp.id)}>
                          <div className="flex items-start gap-3 flex-1">
                            <MessageSquare className="h-4 w-4 text-primary mt-0.5" />
                            <div>
                              <Badge variant="outline" className="text-xs mb-1">{dp.category}</Badge>
                              <p className="text-sm font-medium">{dp.trigger}</p>
                            </div>
                          </div>
                          {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                        </div>
                        {open && (
                          <div className="mt-3 pl-7 space-y-3">
                            <div className="bg-muted/50 rounded-lg p-4 border">
                              <p className="text-sm whitespace-pre-line">{dp.promptText}</p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground mb-1">Required Fields</p>
                              <div className="flex gap-2 flex-wrap">
                                {dp.requiredFields.map(f => (
                                  <Badge key={f} variant="secondary" className="text-xs">{f.replace(/_/g, ' ')}</Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}

                {/* Deferral Records */}
                <h3 className="text-sm font-semibold pt-2 flex items-center gap-2">
                  <Clock className="h-4 w-4" /> Active Deferrals
                </h3>
                {demoDeferrals.map(d => (
                  <Card key={d.id} className="border-l-4 border-l-blue-300">
                    <CardContent className="py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm"><span className="font-medium">{d.familyMember}</span> deferred input</p>
                          <p className="text-xs text-muted-foreground">
                            Scheduled return: {format(new Date(d.returnTime), 'MMM d, h:mm a')}
                            {d.returnedAt && ` • Returned: ${format(new Date(d.returnedAt), 'h:mm a')}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {d.reminderSent && (
                            <Badge variant="outline" className="text-xs">
                              <Bell className="h-3 w-3 mr-1" /> Reminder Sent
                            </Badge>
                          )}
                          <Badge className={d.resolved ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}>
                            {d.resolved ? 'Resolved' : 'Pending'}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              {/* ===== TIMELINE TAB ===== */}
              <TabsContent value="timeline" className="space-y-4">
                <p className="text-sm text-muted-foreground">Chronological history of detection, prompting, deferral, and resolution events.</p>
                <div className="space-y-0">
                  {demoReconciliationTimeline.map((evt, idx) => {
                    const iconMap: Record<string, React.ReactNode> = {
                      detection: <AlertTriangle className="h-4 w-4 text-amber-500" />,
                      prompt: <MessageSquare className="h-4 w-4 text-primary" />,
                      clarification: <RefreshCw className="h-4 w-4 text-blue-500" />,
                      deferral: <Clock className="h-4 w-4 text-slate-500" />,
                      resolution: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
                      escalation: <TrendingUp className="h-4 w-4 text-red-500" />,
                      reminder: <Bell className="h-4 w-4 text-blue-400" />,
                    };
                    return (
                      <div key={evt.id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="p-1.5 rounded-full bg-muted">{iconMap[evt.type]}</div>
                          {idx < demoReconciliationTimeline.length - 1 && <div className="w-px flex-1 bg-border" />}
                        </div>
                        <div className="pb-5 flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <span className="text-xs text-muted-foreground">{format(new Date(evt.timestamp), 'MMM d, h:mm a')}</span>
                            <Badge variant="outline" className="text-xs capitalize">{evt.type}</Badge>
                            <Badge variant="outline" className="text-xs">{evt.category}</Badge>
                            {evt.confidence && confidenceBadge(evt.confidence)}
                          </div>
                          <p className="text-sm">{evt.description}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{evt.familyMember}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </TabsContent>

              {/* ===== SYSTEM IMPACT TAB ===== */}
              <TabsContent value="impact" className="space-y-4">
                <p className="text-sm text-muted-foreground">How current data quality affects connected platform systems.</p>
                {[
                  { key: 'outcomePrediction', title: 'Outcome Prediction Engine', icon: BarChart3, data: systemImpactSummary.outcomePrediction },
                  { key: 'learningLayer', title: 'AI Learning Layer', icon: Eye, data: systemImpactSummary.learningLayer },
                  { key: 'accountability', title: 'Accountability Engine', icon: Shield, data: systemImpactSummary.accountability },
                  { key: 'recommendations', title: 'Recommendation System', icon: MessageSquare, data: systemImpactSummary.recommendations },
                ].map(item => (
                  <Card key={item.key}>
                    <CardContent className="py-4">
                      <div className="flex items-start gap-3">
                        <item.icon className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-sm">{item.title}</p>
                            <Badge className={
                              item.data.status === 'reduced_confidence' ? 'bg-amber-100 text-amber-800' :
                              item.data.status === 'partial_exclusion' ? 'bg-orange-100 text-orange-800' :
                              item.data.status === 'incomplete' ? 'bg-red-100 text-red-800' :
                              'bg-amber-100 text-amber-800'
                            }>
                              {item.data.status.replace(/_/g, ' ')}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{item.data.message}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <Card className="border-slate-200 bg-slate-50">
                  <CardContent className="py-4">
                    <p className="text-xs text-muted-foreground italic">
                      This system ensures input accuracy so guidance, predictions, and accountability remain reliable.
                      It does not accuse or judge — it asks for clarity so the platform can serve you better.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
};

export default InputReconciliation;
