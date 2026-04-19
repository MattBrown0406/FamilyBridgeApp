import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BarChart3,
  Building2,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  GitBranch,
  HeartPulse,
  Info,
  LineChart,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart as RechartsLineChart, Pie, PieChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';

const benchmarkByLevel = [
  { level: '30-day Residential', completion: 64, sober365: 29, aftercare: 42 },
  { level: '90-day Residential', completion: 81, sober365: 49, aftercare: 68 },
  { level: 'Outpatient', completion: 58, sober365: 34, aftercare: 57 },
  { level: 'Sober Living', completion: 73, sober365: 52, aftercare: 71 },
];

const centerPerformance = [
  { level: '30-day Residential', benchmark: 29, center: 33 },
  { level: '90-day Residential', benchmark: 49, center: 56 },
  { level: 'Outpatient', benchmark: 34, center: 38 },
  { level: 'Sober Living', benchmark: 52, center: 61 },
];

const ageGenderOutcomes = [
  { segment: 'Men 18-30', completion: 62, sober365: 31, aftercare: 44 },
  { segment: 'Women 18-30', completion: 68, sober365: 37, aftercare: 51 },
  { segment: 'Men 30+', completion: 74, sober365: 46, aftercare: 63 },
  { segment: 'Women 30+', completion: 77, sober365: 49, aftercare: 67 },
];

const recoveryTrajectory = [
  { checkpoint: 'Discharge', sober: 100, aftercare: 78, family: 72 },
  { checkpoint: '30 days', sober: 74, aftercare: 69, family: 70 },
  { checkpoint: '90 days', sober: 61, aftercare: 62, family: 67 },
  { checkpoint: '180 days', sober: 54, aftercare: 58, family: 64 },
  { checkpoint: '365 days', sober: 47, aftercare: 53, family: 61 },
];

const dischargeNextStep = [
  { name: 'Followed aftercare plan', value: 61, color: '#22c55e' },
  { name: 'Partial follow-through', value: 24, color: '#f59e0b' },
  { name: 'Did not follow plan', value: 15, color: '#ef4444' },
];

const metricCards = [
  {
    title: 'Treatment completion',
    value: '72%',
    note: 'Across all FamilyBridge-tracked episodes in the demo dataset',
    icon: ClipboardCheck,
  },
  {
    title: '1-year sobriety',
    value: '47%',
    note: 'Unified benchmark metric: sober at 365 days',
    icon: ShieldCheck,
  },
  {
    title: 'Aftercare adherence',
    value: '61%',
    note: 'Started the recommended next step within 7 days of discharge',
    icon: GitBranch,
  },
  {
    title: 'Readmission anywhere',
    value: '19%',
    note: 'Any treatment readmission inside 365 days, not just same provider',
    icon: HeartPulse,
  },
];

const collectionEvents = [
  {
    title: 'Episode intake',
    points: ['Level of care', 'Age band', 'Gender', 'Primary substance', 'Admit date'],
  },
  {
    title: 'Discharge and completion',
    points: ['Completed vs left early', 'Discharge date', 'Recommended next step', 'Family engagement at discharge'],
  },
  {
    title: 'Follow-up checkpoints',
    points: ['30/90/180/365-day sobriety status', 'Any relapse or return to use', 'Aftercare participation', 'Living environment'],
  },
  {
    title: 'Outcome validation',
    points: ['Family-reported', 'Provider-confirmed', 'Self-reported', 'Multi-source confidence label'],
  },
];

const reportingModules = [
  'Universal benchmarking by level of care',
  'Center-specific performance vs network average',
  'Age and gender segmentation',
  'Aftercare adherence impact on 1-year sobriety',
  'Same-provider vs any-program readmission tracking',
  'Family engagement correlation reporting',
];

const barConfig = {
  benchmark: { label: 'Benchmark', color: '#94a3b8' },
  center: { label: 'Provider', color: '#7c3aed' },
  completion: { label: 'Completion', color: '#2563eb' },
  sober365: { label: '365-day sober', color: '#22c55e' },
  aftercare: { label: 'Aftercare', color: '#f59e0b' },
} as const;

const lineConfig = {
  sober: { label: 'Sober', color: '#22c55e' },
  aftercare: { label: 'Following aftercare', color: '#7c3aed' },
  family: { label: 'Family engaged', color: '#0ea5e9' },
} as const;

const ProviderOutcomes = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');

  const strongestSegment = useMemo(() => {
    return [...ageGenderOutcomes].sort((a, b) => b.sober365 - a.sober365)[0];
  }, []);

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
                <BarChart3 className="h-5 w-5 text-primary" />
                Provider Outcomes Intelligence
              </h1>
              <p className="text-xs text-muted-foreground">
                Demo of FamilyBridge outcome measurement, benchmark reporting, and provider scorecards.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/demo/provider')}>
              Demo Provider View
            </Button>
            <Button onClick={() => navigate('/provider-workspace')}>
              Provider Workspace
            </Button>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metricCards.map((metric) => {
            const Icon = metric.icon;
            return (
              <Card key={metric.title} className="shadow-sm">
                <CardContent className="pt-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">{metric.title}</p>
                      <p className="mt-1 text-2xl font-semibold">{metric.value}</p>
                    </div>
                    <div className="rounded-xl bg-primary/10 p-2">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{metric.note}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="shadow-sm border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-medium text-primary">Why this matters</p>
                <h2 className="text-xl font-semibold mt-1">FamilyBridge can become the outcomes layer across the full recovery continuum.</h2>
                <p className="text-sm text-muted-foreground mt-2 max-w-3xl">
                  Instead of only tracking whether treatment happened, this lets providers measure completion, aftercare follow-through,
                  long-term sobriety, and readmission across residential, outpatient, and sober living while still giving each center its own private scorecard.
                </p>
              </div>
              <Badge variant="outline" className="w-fit">Best current segment: {strongestSegment.segment} at {strongestSegment.sober365}% 1-year sober</Badge>
            </div>
          </CardContent>
        </Card>

        <Tabs value={tab} onValueChange={setTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="benchmarking">Benchmarking</TabsTrigger>
            <TabsTrigger value="collection">Data Collection</TabsTrigger>
            <TabsTrigger value="provider-demo">Provider Demo</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Recovery trajectory at a glance</CardTitle>
                  <CardDescription>Unified checkpoints showing sobriety, aftercare follow-through, and family engagement over time.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={lineConfig} className="h-[320px] w-full aspect-auto">
                    <RechartsLineChart data={recoveryTrajectory} margin={{ left: 12, right: 12, top: 8 }}>
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="checkpoint" tickLine={false} axisLine={false} />
                      <YAxis tickLine={false} axisLine={false} width={36} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Line type="monotone" dataKey="sober" stroke="var(--color-sober)" strokeWidth={3} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="aftercare" stroke="var(--color-aftercare)" strokeWidth={3} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="family" stroke="var(--color-family)" strokeWidth={3} dot={{ r: 4 }} />
                    </RechartsLineChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Discharge to aftercare follow-through</CardTitle>
                  <CardDescription>This is one of the highest-value measurements because most providers lose visibility after discharge.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={dischargeNextStep} dataKey="value" nameKey="name" innerRadius={58} outerRadius={92} paddingAngle={3}>
                          {dischargeNextStep.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2">
                    {dischargeNextStep.map((item) => (
                      <div key={item.name} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                          <span>{item.name}</span>
                        </div>
                        <span className="font-semibold">{item.value}%</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="shadow-sm lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">What FamilyBridge should measure across every provider</CardTitle>
                  <CardDescription>These are the shared KPIs that make cross-center comparisons actually useful.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2">
                  {reportingModules.map((module) => (
                    <div key={module} className="rounded-xl border p-4 text-sm flex items-start gap-3">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                      <span>{module}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Universal definitions</CardTitle>
                  <CardDescription>Keep these standardized so every provider is talking about the same thing.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <div className="rounded-xl border p-3">
                    <p className="font-medium text-foreground">1-year sober</p>
                    <p className="mt-1">Primary universal metric: sober at 365 days after discharge or transition.</p>
                  </div>
                  <div className="rounded-xl border p-3">
                    <p className="font-medium text-foreground">Readmission anywhere</p>
                    <p className="mt-1">Tracks readmission to any program, not just the same provider, so outcomes stay honest.</p>
                  </div>
                  <div className="rounded-xl border p-3">
                    <p className="font-medium text-foreground">Aftercare adherence</p>
                    <p className="mt-1">Started the recommended next step within a defined window and remained engaged.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="benchmarking" className="space-y-6">
            <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Benchmark by level of care</CardTitle>
                  <CardDescription>Unified metrics across residential, outpatient, and sober living.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={barConfig} className="h-[340px] w-full aspect-auto">
                    <BarChart data={benchmarkByLevel} margin={{ left: 8, right: 8, top: 8 }}>
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="level" tickLine={false} axisLine={false} interval={0} angle={-15} textAnchor="end" height={70} />
                      <YAxis tickLine={false} axisLine={false} width={36} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Bar dataKey="completion" fill="var(--color-completion)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="sober365" fill="var(--color-sober365)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="aftercare" fill="var(--color-aftercare)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Your center vs benchmark</CardTitle>
                  <CardDescription>Exactly the kind of scorecard a provider would want to show leadership.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={barConfig} className="h-[340px] w-full aspect-auto">
                    <BarChart data={centerPerformance} margin={{ left: 8, right: 8, top: 8 }}>
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="level" tickLine={false} axisLine={false} interval={0} angle={-15} textAnchor="end" height={70} />
                      <YAxis tickLine={false} axisLine={false} width={36} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Bar dataKey="benchmark" fill="var(--color-benchmark)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="center" fill="var(--color-center)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Outcome segmentation by age and gender</CardTitle>
                <CardDescription>Use this for honest internal analysis, not cheap marketing claims.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {ageGenderOutcomes.map((segment) => (
                  <Card key={segment.segment} className="border-dashed shadow-none">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">{segment.segment}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div className="flex items-center justify-between rounded-lg border p-3">
                        <span>Completion</span>
                        <span className="font-semibold">{segment.completion}%</span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg border p-3">
                        <span>1-year sober</span>
                        <span className="font-semibold">{segment.sober365}%</span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg border p-3">
                        <span>Aftercare</span>
                        <span className="font-semibold">{segment.aftercare}%</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="collection" className="space-y-6">
            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
              {collectionEvents.map((event) => (
                <Card key={event.title} className="shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base">{event.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-muted-foreground">
                    {event.points.map((point) => (
                      <div key={point} className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                        <span>{point}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Longitudinal check-in schedule
                  </CardTitle>
                  <CardDescription>The app should prompt the right people at the right time instead of hoping someone remembers.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {[
                    ['Discharge', 'Provider confirms completion, next step, discharge date, and recommended aftercare plan.'],
                    ['30 days', 'Family and patient check-in on sobriety, meetings, housing, and aftercare engagement.'],
                    ['90 days', 'Escalation checkpoint for relapse risk, return to use, or disengagement from care.'],
                    ['180 days', 'Recovery environment and consistency checkpoint.'],
                    ['365 days', 'Universal benchmark outcome collection for reporting and benchmarking.'],
                  ].map(([title, body]) => (
                    <div key={title} className="rounded-xl border p-4">
                      <p className="font-medium">{title}</p>
                      <p className="text-muted-foreground mt-1">{body}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Design principles that make this credible
                  </CardTitle>
                  <CardDescription>If this is sloppy, providers won’t trust it and the data won’t mean much.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <div className="rounded-xl border p-4">
                    <p className="font-medium text-foreground">Track any-program readmission</p>
                    <p className="mt-1">Not just same-provider readmission, otherwise the cleanest-looking centers may just be losing visibility.</p>
                  </div>
                  <div className="rounded-xl border p-4">
                    <p className="font-medium text-foreground">Use confidence labels</p>
                    <p className="mt-1">Mark each outcome as self-reported, family-reported, provider-confirmed, or multi-source confirmed.</p>
                  </div>
                  <div className="rounded-xl border p-4">
                    <p className="font-medium text-foreground">Keep raw provider data private</p>
                    <p className="mt-1">Benchmark against anonymized network-level data while preserving each provider’s own performance layer.</p>
                  </div>
                  <div className="rounded-xl border p-4">
                    <p className="font-medium text-foreground">Segment without overclaiming</p>
                    <p className="mt-1">Age and gender should inform insight, but length of stay, aftercare, and recovery environment will usually matter more.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="provider-demo" className="space-y-6">
            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="shadow-sm lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">How providers would experience this</CardTitle>
                  <CardDescription>This is the narrative you want in demos and sales calls.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-muted-foreground">
                  <div className="rounded-xl border p-4">
                    <p className="font-medium text-foreground flex items-center gap-2"><Building2 className="h-4 w-4" /> Provider-level dashboard</p>
                    <p className="mt-2">Shows treatment completion, 30/90/180/365-day sobriety, aftercare adherence, and readmission, broken down by residential, outpatient, and sober living.</p>
                  </div>
                  <div className="rounded-xl border p-4">
                    <p className="font-medium text-foreground flex items-center gap-2"><Users className="h-4 w-4" /> FamilyBridge follow-up engine</p>
                    <p className="mt-2">Prompts families and providers for milestone check-ins so providers keep visibility after discharge without manually chasing everyone.</p>
                  </div>
                  <div className="rounded-xl border p-4">
                    <p className="font-medium text-foreground flex items-center gap-2"><Clock3 className="h-4 w-4" /> Long-term optimization</p>
                    <p className="mt-2">Over time the provider sees which ages, genders, lengths of stay, and aftercare pathways are producing the best one-year outcomes.</p>
                  </div>
                  <div className="rounded-xl border p-4">
                    <p className="font-medium text-foreground flex items-center gap-2"><LineChart className="h-4 w-4" /> Benchmarking without humiliation</p>
                    <p className="mt-2">Each center sees their own scorecard vs an anonymized FamilyBridge benchmark, not a public leaderboard.</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Best next build order</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <div className="rounded-xl border p-3">
                    <p className="font-medium text-foreground">Phase 1</p>
                    <p className="mt-1">Outcome schema, episode records, discharge fields, milestone check-ins.</p>
                  </div>
                  <div className="rounded-xl border p-3">
                    <p className="font-medium text-foreground">Phase 2</p>
                    <p className="mt-1">Provider outcomes dashboard and center scorecard.</p>
                  </div>
                  <div className="rounded-xl border p-3">
                    <p className="font-medium text-foreground">Phase 3</p>
                    <p className="mt-1">Benchmark segmentation by level of care, age band, gender, and aftercare adherence.</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button className="w-full" onClick={() => navigate('/demo/provider')}>
                      Open provider demo
                    </Button>
                    <Button variant="outline" className="w-full" onClick={() => navigate('/features/intervention-outcomes')}>
                      View intervention outcomes
                    </Button>
                    <Button variant="outline" className="w-full" onClick={() => navigate('/features/fiis-guidance')}>
                      View FIIS guidance
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default ProviderOutcomes;
