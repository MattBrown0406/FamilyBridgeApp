import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Bot,
  Brain,
  CheckCircle2,
  ClipboardCheck,
  Gauge,
  GitBranch,
  Lightbulb,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const providerSignals = [
  {
    id: 'provider-1',
    title: 'Aftercare adherence below category median',
    metric: 'Aftercare adherence',
    current: '61%',
    benchmark: '73%',
    severity: 'high',
    confidence: 'High confidence',
    observation:
      'Your 90-day residential discharges are converting into confirmed aftercare engagement at a rate 12 points below the current category median.',
    pattern:
      'Programs with stronger one-year outcomes in this category more often complete a verified handoff into the next level of care within 48 hours and then re-confirm at day 7.',
    suggestion:
      'Add a discharge-to-aftercare confirmation sequence at 48 hours and 7 days, and require the family to confirm whether the recommended step actually started.',
    followUp:
      'FIIS can remeasure this over the next 20 discharges and tell you whether the gap is closing.',
  },
  {
    id: 'provider-2',
    title: 'Young adult outpatient outcomes trailing peers',
    metric: '365-day sobriety, men 18-30',
    current: '28%',
    benchmark: '37%',
    severity: 'medium',
    confidence: 'Moderate confidence',
    observation:
      'Men age 18 to 30 in your outpatient pathway are trailing the same-category benchmark at the one-year sobriety checkpoint.',
    pattern:
      'Higher-performing programs in this segment more often pair outpatient with sober living or a structured recovery environment when family instability is high.',
    suggestion:
      'Flag young adult outpatient cases with low home stability for a stronger step-down recommendation and add a family alignment checkpoint during the first 14 days.',
    followUp:
      'FIIS should watch the next cohort separately to see if the change improves 90-day and 365-day outcomes.',
  },
];

const interventionSignals = [
  {
    id: 'intervention-1',
    title: 'Immediate placement rate below benchmark',
    metric: 'Immediate treatment entry',
    current: '51%',
    benchmark: '59%',
    severity: 'high',
    confidence: 'High confidence',
    observation:
      'Your immediate treatment entry rate is below the current interventionist median, while your delayed conversion rate remains average.',
    pattern:
      'Higher-performing interventionists in similar case mixes more often lock transport, intake timing, and the first treatment acceptance script before the intervention begins.',
    suggestion:
      'Strengthen the pre-intervention logistics checklist so transport and admission timing are confirmed before the family enters the room.',
    followUp:
      'FIIS can track whether this lifts your 24-hour conversion rate over the next 15 interventions.',
  },
  {
    id: 'intervention-2',
    title: 'Too many accepted-but-not-admitted cases',
    metric: 'Accepted but no admission',
    current: '14%',
    benchmark: '7%',
    severity: 'medium',
    confidence: 'Moderate confidence',
    observation:
      'A meaningful share of your cases verbally agree to treatment but still fail to complete admission.',
    pattern:
      'Interventionists with lower fallout between acceptance and admission usually drive a tighter 24 to 72 hour follow-up cadence with families and intake teams.',
    suggestion:
      'Create a post-intervention conversion workflow inside FamilyBridge that confirms transport, bag readiness, family messaging, and intake handoff within hours, not days.',
    followUp:
      'FIIS should compare your acceptance-to-admission gap before and after the workflow goes live.',
  },
];

const guidanceLoop = [
  {
    title: 'Measure',
    body: 'Capture provider and intervention outcomes with standardized definitions.',
    icon: ClipboardCheck,
  },
  {
    title: 'Benchmark',
    body: 'Compare against anonymized same-category averages and top quartile ranges.',
    icon: Gauge,
  },
  {
    title: 'Suggest',
    body: 'FIIS surfaces practical operational changes associated with stronger outcomes.',
    icon: Lightbulb,
  },
  {
    title: 'Remeasure',
    body: 'Track whether the suggested workflow change actually improves future cohorts.',
    icon: TrendingUp,
  },
];

const guardrails = [
  'No named peer exposure, only anonymized benchmark comparisons.',
  'Suggestions should be pattern-guided, not fake causal certainty.',
  'Only trigger guidance when sample size and persistence justify it.',
  'Show confidence labels so users can tell signal from weak data.',
  'Tone should feel like coaching, not punishment.',
];

const severityTone: Record<string, string> = {
  high: 'bg-rose-100 text-rose-700 border-rose-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  low: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

const FIISGuidance = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState('provider');

  const totalSignals = useMemo(() => providerSignals.length + interventionSignals.length, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                FIIS Performance Guidance
              </h1>
              <p className="text-xs text-muted-foreground">
                Demo of how FIIS can coach providers and interventionists when outcomes trail anonymized benchmarks.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/features/provider-outcomes')}>
              Provider outcomes
            </Button>
            <Button variant="outline" onClick={() => navigate('/features/intervention-outcomes')}>
              Intervention outcomes
            </Button>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="shadow-sm">
            <CardContent className="pt-5">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Active guidance signals</p>
              <p className="mt-1 text-2xl font-semibold">{totalSignals}</p>
              <p className="text-xs text-muted-foreground mt-1">Current demo guidance opportunities across provider and intervention workflows.</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="pt-5">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Trigger logic</p>
              <p className="mt-1 text-2xl font-semibold">3 layers</p>
              <p className="text-xs text-muted-foreground mt-1">Benchmark gap, pattern persistence, and confidence threshold.</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="pt-5">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Tone model</p>
              <p className="mt-1 text-2xl font-semibold">Coach</p>
              <p className="text-xs text-muted-foreground mt-1">Operational guidance, not punitive AI scoring.</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="pt-5">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Remeasure loop</p>
              <p className="mt-1 text-2xl font-semibold">Built in</p>
              <p className="text-xs text-muted-foreground mt-1">Every suggestion should lead to a measurable follow-up window.</p>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-sm border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-medium text-primary">Best version of FIIS here</p>
                <h2 className="text-xl font-semibold mt-1">Measure, benchmark, suggest, then remeasure.</h2>
                <p className="text-sm text-muted-foreground mt-2 max-w-3xl">
                  FIIS should not pretend it magically knows causation. It should notice consistent underperformance, compare against anonymized peers,
                  suggest practical workflow changes associated with stronger outcomes, and then track whether those changes actually help.
                </p>
              </div>
              <Badge variant="outline" className="w-fit">Guidance is private, benchmarked, and confidence-labeled</Badge>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-4">
          {guidanceLoop.map((step) => {
            const Icon = step.icon;
            return (
              <Card key={step.title} className="shadow-sm">
                <CardContent className="pt-5 space-y-3">
                  <div className="rounded-xl bg-primary/10 p-2 w-fit">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{step.title}</p>
                    <p className="text-sm text-muted-foreground mt-1">{step.body}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Tabs value={tab} onValueChange={setTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto">
            <TabsTrigger value="provider">Provider guidance</TabsTrigger>
            <TabsTrigger value="intervention">Intervention guidance</TabsTrigger>
            <TabsTrigger value="guardrails">Guardrails</TabsTrigger>
            <TabsTrigger value="workflow">Workflow</TabsTrigger>
          </TabsList>

          <TabsContent value="provider" className="space-y-4">
            {providerSignals.map((signal) => (
              <Card key={signal.id} className="shadow-sm">
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Bot className="h-4 w-4 text-primary" />
                        {signal.title}
                      </CardTitle>
                      <CardDescription>{signal.metric}</CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge className={severityTone[signal.severity]} variant="outline">{signal.severity} priority</Badge>
                      <Badge variant="outline">{signal.confidence}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4 text-sm text-muted-foreground">
                  <div className="rounded-xl border p-4">
                    <p className="font-medium text-foreground">Observation</p>
                    <p className="mt-2">{signal.observation}</p>
                    <p className="mt-3 text-xs">Current: {signal.current} • Benchmark: {signal.benchmark}</p>
                  </div>
                  <div className="rounded-xl border p-4">
                    <p className="font-medium text-foreground">Pattern FIIS sees</p>
                    <p className="mt-2">{signal.pattern}</p>
                  </div>
                  <div className="rounded-xl border p-4">
                    <p className="font-medium text-foreground">Suggested adjustment</p>
                    <p className="mt-2">{signal.suggestion}</p>
                  </div>
                  <div className="rounded-xl border p-4">
                    <p className="font-medium text-foreground">Remeasure plan</p>
                    <p className="mt-2">{signal.followUp}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="intervention" className="space-y-4">
            {interventionSignals.map((signal) => (
              <Card key={signal.id} className="shadow-sm">
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        {signal.title}
                      </CardTitle>
                      <CardDescription>{signal.metric}</CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge className={severityTone[signal.severity]} variant="outline">{signal.severity} priority</Badge>
                      <Badge variant="outline">{signal.confidence}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4 text-sm text-muted-foreground">
                  <div className="rounded-xl border p-4">
                    <p className="font-medium text-foreground">Observation</p>
                    <p className="mt-2">{signal.observation}</p>
                    <p className="mt-3 text-xs">Current: {signal.current} • Benchmark: {signal.benchmark}</p>
                  </div>
                  <div className="rounded-xl border p-4">
                    <p className="font-medium text-foreground">Pattern FIIS sees</p>
                    <p className="mt-2">{signal.pattern}</p>
                  </div>
                  <div className="rounded-xl border p-4">
                    <p className="font-medium text-foreground">Suggested adjustment</p>
                    <p className="mt-2">{signal.suggestion}</p>
                  </div>
                  <div className="rounded-xl border p-4">
                    <p className="font-medium text-foreground">Remeasure plan</p>
                    <p className="mt-2">{signal.followUp}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="guardrails" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4" />
                    Product guardrails
                  </CardTitle>
                  <CardDescription>These keep the guidance useful instead of creepy or punitive.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  {guardrails.map((rule) => (
                    <div key={rule} className="flex items-start gap-2 rounded-xl border p-3">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                      <span>{rule}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Trigger rules
                  </CardTitle>
                  <CardDescription>Only surface guidance when the signal deserves attention.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <div className="rounded-xl border p-4">
                    <p className="font-medium text-foreground">Benchmark gap</p>
                    <p className="mt-2">Current performance needs to trail a meaningful threshold, not tiny noise.</p>
                  </div>
                  <div className="rounded-xl border p-4">
                    <p className="font-medium text-foreground">Pattern persistence</p>
                    <p className="mt-2">The gap should show up across enough cases or enough time to be believable.</p>
                  </div>
                  <div className="rounded-xl border p-4">
                    <p className="font-medium text-foreground">Confidence threshold</p>
                    <p className="mt-2">FIIS should only advise when the data quality and sample size support it.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="workflow" className="space-y-4">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">How this should appear in the product</CardTitle>
                <CardDescription>Suggestions should feel like operational intelligence, not an AI lecture.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 lg:grid-cols-3 text-sm text-muted-foreground">
                <div className="rounded-xl border p-4">
                  <p className="font-medium text-foreground flex items-center gap-2"><Gauge className="h-4 w-4" /> Benchmark alert</p>
                  <p className="mt-2">A provider or interventionist sees that a key metric is trailing the anonymized benchmark.</p>
                </div>
                <div className="rounded-xl border p-4">
                  <p className="font-medium text-foreground flex items-center gap-2"><GitBranch className="h-4 w-4" /> Suggested workflow change</p>
                  <p className="mt-2">FIIS recommends one practical operational change tied to a known peer pattern.</p>
                </div>
                <div className="rounded-xl border p-4">
                  <p className="font-medium text-foreground flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Outcome review window</p>
                  <p className="mt-2">FIIS watches the next cohort and reports whether the change actually improved outcomes.</p>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-wrap gap-3">
              <Button onClick={() => navigate('/features/provider-outcomes')}>
                Back to provider outcomes
              </Button>
              <Button variant="outline" onClick={() => navigate('/features/intervention-outcomes')}>
                Back to intervention outcomes
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default FIISGuidance;
