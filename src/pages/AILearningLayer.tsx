import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Brain, Shield, TrendingUp, TrendingDown, Info, ChevronRight,
  Eye, Lock, ArrowLeft, Lightbulb, AlertTriangle, CheckCircle2,
  BarChart3, RefreshCw, Users, Building2, Link2, Target, Zap,
} from 'lucide-react';
import PublicCrisisHelp from '@/components/PublicCrisisHelp';
import {
  domainSummaries,
  positiveInsights,
  negativeInsights,
  similarSituationInsights,
  recommendationEvolutions,
  aggregateStats,
  type LearningInsight,
  type LearningDomain,
} from '@/data/learningLayerDemoData';

const confidenceBadge = (level: string) => {
  const map: Record<string, { variant: 'default' | 'secondary' | 'outline'; label: string }> = {
    high: { variant: 'default', label: 'High Confidence' },
    moderate: { variant: 'secondary', label: 'Moderate Confidence' },
    low: { variant: 'outline', label: 'Low Confidence' },
  };
  const cfg = map[level] || map.low;
  return <Badge variant={cfg.variant} className="text-xs">{cfg.label}</Badge>;
};

const sampleBadge = (strength: string) => {
  const map: Record<string, string> = {
    strong: 'Strong comparison pool',
    moderate: 'Moderate comparison pool',
    limited: 'Limited comparison pool',
  };
  return (
    <span className="text-xs text-muted-foreground italic">
      {map[strength] || 'Unknown pool size'}
    </span>
  );
};

const domainIcon = (domain: LearningDomain) => {
  const icons: Record<LearningDomain, React.ReactNode> = {
    readiness: <Target className="h-4 w-4" />,
    intervention_strategy: <Zap className="h-4 w-4" />,
    family_impact: <Users className="h-4 w-4" />,
    provider_performance: <Building2 className="h-4 w-4" />,
    continuity: <Link2 className="h-4 w-4" />,
  };
  return icons[domain];
};

function InsightCard({ insight }: { insight: LearningInsight }) {
  const [expanded, setExpanded] = useState(false);
  const isPositive = insight.direction === 'positive';

  return (
    <Card className={`border-l-4 ${isPositive ? 'border-l-emerald-500' : 'border-l-amber-500'}`}>
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 flex-1">
            {isPositive
              ? <TrendingUp className="h-4 w-4 mt-0.5 shrink-0 text-emerald-600" />
              : <TrendingDown className="h-4 w-4 mt-0.5 shrink-0 text-amber-600" />}
            <p className="text-sm font-medium leading-snug">{insight.pattern}</p>
          </div>
          <div className="shrink-0">{confidenceBadge(insight.confidence)}</div>
        </div>

        {expanded && (
          <div className="ml-6 space-y-2 text-sm">
            <p className="text-muted-foreground">{insight.detail}</p>
            <div className="flex flex-wrap gap-1.5">
              {insight.variables.map((v) => (
                <Badge key={v} variant="outline" className="text-xs font-normal">{v}</Badge>
              ))}
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {sampleBadge(insight.sampleStrength)}
              <span>·</span>
              <span>Updated {insight.updatedAt}</span>
            </div>
          </div>
        )}

        <button
          onClick={() => setExpanded(!expanded)}
          className="ml-6 text-xs text-primary hover:underline"
        >
          {expanded ? 'Show less' : 'View details & variables'}
        </button>
      </CardContent>
    </Card>
  );
}

export default function AILearningLayer() {
  const navigate = useNavigate();
  const [activeDomain, setActiveDomain] = useState<LearningDomain | 'all'>('all');

  const filterByDomain = (items: LearningInsight[]) =>
    activeDomain === 'all' ? items : items.filter((i) => i.domain === activeDomain);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="mb-3">
            <ArrowLeft className="h-4 w-4 mr-1" /> Home
          </Button>

          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Brain className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-bold">AI Learning Layer</h1>
                <Badge variant="secondary">Stage 1</Badge>
                <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                  Demo
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground max-w-2xl">
                Privacy-preserving, cross-case pattern learning. The platform learns from aggregated,
                de-identified patterns to improve recommendations without exposing sensitive information
                across families, providers, or organizations.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-600" />
              <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                Privacy-safe · All outputs de-identified
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
                Privacy-Preserving Learning
              </p>
              <p className="text-emerald-700 dark:text-emerald-400">
                This platform uses aggregated, de-identified pattern learning to improve decision support.
                It does not share sensitive information across unrelated users or organizations.
                All insights shown are generalized, non-inferable, and based on sufficiently large sample sets.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Aggregate Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Patterns Identified', value: aggregateStats.totalPatternsIdentified },
            { label: 'High Confidence', value: aggregateStats.highConfidencePatterns },
            { label: 'Learning Domains', value: aggregateStats.domainsActive },
            { label: 'Recommendations Refined', value: aggregateStats.recommendationsRefined },
            { label: 'Last Updated', value: aggregateStats.lastUpdated },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Learning Domains */}
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <BarChart3 className="h-5 w-5" /> Learning Domains
          </h2>
          <div className="grid md:grid-cols-5 gap-3">
            {domainSummaries.map((d) => (
              <Card
                key={d.domain}
                className={`cursor-pointer transition-colors hover:border-primary ${activeDomain === d.domain ? 'border-primary bg-primary/5' : ''}`}
                onClick={() => setActiveDomain(activeDomain === d.domain ? 'all' : d.domain)}
              >
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{d.icon}</span>
                    <p className="text-sm font-semibold leading-tight">{d.label}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{d.description}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span>{d.totalPatterns} patterns</span>
                    <Badge variant="outline" className="text-xs">{d.highConfidence} high conf.</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">Updated {d.latestUpdate}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          {activeDomain !== 'all' && (
            <Button variant="ghost" size="sm" className="mt-2" onClick={() => setActiveDomain('all')}>
              Clear filter — show all domains
            </Button>
          )}
        </div>

        {/* Main Insights Tabs */}
        <Tabs defaultValue="patterns" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="patterns">Key Patterns</TabsTrigger>
            <TabsTrigger value="helped">What Helped</TabsTrigger>
            <TabsTrigger value="hurt">What Hurt</TabsTrigger>
            <TabsTrigger value="similar">Similar Situations</TabsTrigger>
            <TabsTrigger value="evolution">Rec. Evolution</TabsTrigger>
          </TabsList>

          {/* Key Patterns */}
          <TabsContent value="patterns" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Eye className="h-4 w-4" /> Key Patterns Observed
                </CardTitle>
                <CardDescription>
                  Aggregated, de-identified patterns the platform has identified across a sufficient sample of cases.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[...filterByDomain(positiveInsights), ...filterByDomain(negativeInsights)]
                  .sort((a, b) => {
                    const cOrder = { high: 0, moderate: 1, low: 2 };
                    return cOrder[a.confidence] - cOrder[b.confidence];
                  })
                  .map((insight) => (
                    <InsightCard key={insight.id} insight={insight} />
                  ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* What Helped */}
          <TabsContent value="helped" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> What Tended to Improve Outcomes
                </CardTitle>
                <CardDescription>
                  Generalized findings from aggregated case learning about behaviors and actions associated with better outcomes.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {filterByDomain(positiveInsights).map((i) => (
                  <InsightCard key={i.id} insight={i} />
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* What Hurt */}
          <TabsContent value="hurt" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600" /> What Tended to Undermine Outcomes
                </CardTitle>
                <CardDescription>
                  Generalized findings about behaviors and patterns associated with reduced outcome quality.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {filterByDomain(negativeInsights).map((i) => (
                  <InsightCard key={i.id} insight={i} />
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Similar Situations */}
          <TabsContent value="similar" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-blue-600" /> Similar Situation Insights
                </CardTitle>
                <CardDescription>
                  Privacy-safe, generalized guidance based on de-identified pattern comparisons. No actual case details are exposed.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {similarSituationInsights.map((s) => (
                  <Card key={s.id} className="border-l-4 border-l-blue-400">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                            Context: {s.context}
                          </p>
                          <p className="text-sm">{s.insight}</p>
                        </div>
                        {confidenceBadge(s.confidence)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Applies to: {s.applicability}
                      </p>
                    </CardContent>
                  </Card>
                ))}

                <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                  <Info className="h-4 w-4 mx-auto mb-1" />
                  Insights are only displayed when based on a sufficiently large, de-identified comparison pool.
                  If sample size is too small, no insight is shown.
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recommendation Evolution */}
          <TabsContent value="evolution" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" /> Recommendation Evolution Log
                </CardTitle>
                <CardDescription>
                  How the platform's recommendations have been refined over time based on aggregated learning.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recommendationEvolutions.map((evo, idx) => (
                    <div key={evo.id} className="relative pl-6">
                      <div className="absolute left-0 top-1 h-3 w-3 rounded-full bg-primary" />
                      {idx < recommendationEvolutions.length - 1 && (
                        <div className="absolute left-[5px] top-4 w-0.5 h-full bg-border" />
                      )}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">{evo.area}</Badge>
                          <span className="text-xs text-muted-foreground">{evo.effectiveDate}</span>
                        </div>
                        <p className="text-sm font-medium">{evo.change}</p>
                        <p className="text-xs text-muted-foreground">{evo.reason}</p>
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
              <Info className="h-4 w-4" /> Transparency & Guardrails
            </h3>
            <div className="grid md:grid-cols-2 gap-4 text-xs text-muted-foreground">
              <div className="space-y-1.5">
                <p className="font-medium text-foreground">What this system does:</p>
                <ul className="space-y-1 list-disc pl-4">
                  <li>Logs actions and outcomes in structured form</li>
                  <li>Identifies recurring patterns across de-identified data</li>
                  <li>Summarizes correlations in aggregate, privacy-safe language</li>
                  <li>Refines recommendation language and prioritization</li>
                </ul>
              </div>
              <div className="space-y-1.5">
                <p className="font-medium text-foreground">What this system does NOT do:</p>
                <ul className="space-y-1 list-disc pl-4">
                  <li>Make fully autonomous decisions</li>
                  <li>Claim certainty or treat correlation as causation</li>
                  <li>Expose raw cross-case data or sensitive personal information</li>
                  <li>Rewrite core scoring models without human review</li>
                  <li>Create leaderboards or cross-org comparisons</li>
                </ul>
              </div>
            </div>
            <Separator />
            <p className="text-xs text-muted-foreground italic">
              The platform has observed these patterns across aggregated, de-identified data.
              All insights are generalized, non-inferable, and privacy-safe.
              Correlation does not imply certainty, and human judgment remains essential.
            </p>
          </CardContent>
        </Card>

        {/* Stage 2 Link */}
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Stage 2: Adaptive Learning</p>
              <p className="text-xs text-muted-foreground">
                See how the platform adapts scoring weights, alert thresholds, and recommendation priorities over time.
              </p>
            </div>
            <Button onClick={() => navigate('/ai-learning/stage-2')} variant="outline" size="sm">
              View Stage 2 <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </CardContent>
        </Card>

        <PublicCrisisHelp className="max-w-3xl mx-auto" />

        {/* CTA for demo */}
        <div className="text-center py-6">
          <p className="text-sm text-muted-foreground mb-3">
            Experience the full AI Learning Layer with your own recovery data.
          </p>
          <Button onClick={() => navigate('/auth')} size="lg">
            Get Started <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
