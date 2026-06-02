import { TutorialModal } from '@/components/tutorial/TutorialModal';
import { interventionOutcomesSteps } from '@/components/tutorial/tutorialSteps';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  Clock3,
  ShieldCheck,
  Siren,
  TimerReset,
  Users,
  XCircle,
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
import { Bar, BarChart, CartesianGrid, Line, LineChart as RechartsLineChart, XAxis, YAxis } from 'recharts';

const interventionMetrics = [
  {
    title: 'Immediate treatment entry',
    value: '58%',
    note: 'Entered treatment same day or within 24 hours of the intervention',
    icon: CheckCircle2,
  },
  {
    title: 'Delayed treatment entry',
    value: '23%',
    note: 'Entered treatment after the intervention but within the defined tracking window',
    icon: TimerReset,
  },
  {
    title: 'No treatment entry',
    value: '19%',
    note: 'No verified treatment admission inside the active reporting window',
    icon: XCircle,
  },
  {
    title: 'Median time to treatment',
    value: '4.2 days',
    note: 'Among cases that did not go immediately but later entered treatment',
    icon: Clock3,
  },
];

const placementTiming = [
  { bucket: 'At intervention', percentage: 58 },
  { bucket: '1-7 days', percentage: 14 },
  { bucket: '8-30 days', percentage: 7 },
  { bucket: '31-90 days', percentage: 2 },
  { bucket: 'Never', percentage: 19 },
];

const interventionistComparison = [
  { name: 'Matt Brown', immediate: 64, delayed: 21, never: 15 },
  { name: 'Tasha Miller', immediate: 52, delayed: 25, never: 23 },
  { name: 'A. Roberts', immediate: 47, delayed: 28, never: 25 },
  { name: 'J. Navarro', immediate: 59, delayed: 18, never: 23 },
];

const conversionWindow = [
  { checkpoint: '24h', entry: 58 },
  { checkpoint: '7d', entry: 72 },
  { checkpoint: '30d', entry: 79 },
  { checkpoint: '90d', entry: 81 },
];

const criteriaCards = [
  {
    title: 'Immediate placement rate',
    body: 'Percentage of interventions that result in treatment admission the same day or within 24 hours.',
  },
  {
    title: 'Delayed placement rate',
    body: 'Percentage of interventions where the loved one refuses initially but enters treatment later.',
  },
  {
    title: 'No-placement rate',
    body: 'Percentage of cases with no verified treatment entry inside the selected reporting window.',
  },
  {
    title: 'Time-to-treatment',
    body: 'Median and average number of days between the intervention and first verified admission.',
  },
];

const dataCapture = [
  {
    title: 'Intervention event',
    items: ['Intervention date and time', 'Lead interventionist', 'Recommended level of care', 'Accepted yes/no at intervention'],
  },
  {
    title: 'Immediate outcome',
    items: ['Entered treatment immediately', 'Did not enter treatment', 'Accepted but admission still pending', 'Location / level of care entered'],
  },
  {
    title: 'Delayed follow-up',
    items: ['Treatment entered after intervention', 'Days until admission', 'Recommended placement match yes/no', 'Lost-to-follow-up or unknown'],
  },
  {
    title: 'Outcome confidence',
    items: ['Family-reported', 'Interventionist-confirmed', 'Provider-confirmed', 'Multi-source confirmed'],
  },
];

const chartConfig = {
  percentage: { label: 'Percentage', color: '#7c3aed' },
  immediate: { label: 'Immediate', color: '#22c55e' },
  delayed: { label: 'Delayed', color: '#f59e0b' },
  never: { label: 'Never', color: '#ef4444' },
  entry: { label: 'Entered treatment', color: '#2563eb' },
} as const;

const InterventionOutcomes = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');

  const bestPerformer = useMemo(() => {
    return [...interventionistComparison].sort((a, b) => b.immediate - a.immediate)[0];
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <TutorialModal steps={interventionOutcomesSteps} storageKey="fb_tutorial_intervention_outcomes" />
      <div className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold flex items-center gap-2">
                <Siren className="h-5 w-5 text-primary" />
                Intervention Outcomes Intelligence
              </h1>
              <p className="text-xs text-muted-foreground">
                Demo of interventionist performance tracking inside FamilyBridge.
              </p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={() => navigate('/features/provider-outcomes')}>
              Provider outcomes
            </Button>
            <Button variant="outline" onClick={() => navigate('/features/fiis-guidance')}>
              FIIS guidance
            </Button>
            <Button onClick={() => navigate('/demo/provider')}>
              Provider demo
            </Button>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {interventionMetrics.map((metric) => {
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
                <h2 className="text-xl font-semibold mt-1">This lets FamilyBridge measure intervention effectiveness before treatment even begins.</h2>
                <p className="text-sm text-muted-foreground mt-2 max-w-3xl">
                  Providers and interventionists can finally separate immediate treatment entry, delayed conversion, and no-placement cases,
                  then compare those outcomes by interventionist, age, gender, and recommendation pathway.
                </p>
              </div>
              <Badge variant="outline" className="w-fit">Top immediate placement rate: {bestPerformer.name} at {bestPerformer.immediate}%</Badge>
            </div>
          </CardContent>
        </Card>

        <Tabs value={tab} onValueChange={setTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="timing">Timing</TabsTrigger>
            <TabsTrigger value="data">Data Model</TabsTrigger>
            <TabsTrigger value="scorecards">Scorecards</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Intervention outcome buckets</CardTitle>
                  <CardDescription>Every intervention should land in one of these buckets.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[320px] w-full aspect-auto">
                    <BarChart data={placementTiming} margin={{ left: 8, right: 8, top: 8 }}>
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="bucket" tickLine={false} axisLine={false} interval={0} />
                      <YAxis tickLine={false} axisLine={false} width={36} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="percentage" fill="var(--color-percentage)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Core intervention metrics</CardTitle>
                  <CardDescription>These definitions should be standardized across all interventionists.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2">
                  {criteriaCards.map((item) => (
                    <div key={item.title} className="rounded-xl border p-4 text-sm text-muted-foreground">
                      <p className="font-medium text-foreground">{item.title}</p>
                      <p className="mt-2">{item.body}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="timing" className="space-y-6">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Cumulative treatment entry after intervention</CardTitle>
                <CardDescription>Shows how many cases convert by 24 hours, 7 days, 30 days, and 90 days.</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[320px] w-full aspect-auto">
                  <RechartsLineChart data={conversionWindow} margin={{ left: 8, right: 8, top: 8 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="checkpoint" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} width={36} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Line type="monotone" dataKey="entry" stroke="var(--color-entry)" strokeWidth={3} dot={{ r: 4 }} />
                  </RechartsLineChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <div className="grid gap-4 lg:grid-cols-3 text-sm text-muted-foreground">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Immediate yes</CardTitle>
                </CardHeader>
                <CardContent>
                  Same-day or within 24 hours. This is the cleanest measure of direct intervention effectiveness.
                </CardContent>
              </Card>
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Delayed yes</CardTitle>
                </CardHeader>
                <CardContent>
                  Refused or stalled at the intervention, then entered treatment later. Still counts, but should be tracked separately.
                </CardContent>
              </Card>
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Never entered</CardTitle>
                </CardHeader>
                <CardContent>
                  No verified admission inside the reporting window. This matters more than vague “they were thinking about it” claims.
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="data" className="space-y-6">
            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
              {dataCapture.map((section) => (
                <Card key={section.title} className="shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base">{section.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-muted-foreground">
                    {section.items.map((item) => (
                      <div key={item} className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Recommended schema direction</CardTitle>
                <CardDescription>Build intervention outcomes as a distinct module, then connect it to treatment outcomes later.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2 text-sm text-muted-foreground">
                <div className="rounded-xl border p-4">
                  <p className="font-medium text-foreground">Intervention record</p>
                  <p className="mt-2">Tracks the intervention itself: date, interventionist, family, recommended placement, and accepted/refused status at the time of the intervention.</p>
                </div>
                <div className="rounded-xl border p-4">
                  <p className="font-medium text-foreground">Placement outcome record</p>
                  <p className="mt-2">Tracks whether treatment occurred immediately, later, never, or remains unknown, plus the number of days to admission.</p>
                </div>
                <div className="rounded-xl border p-4">
                  <p className="font-medium text-foreground">Placement match</p>
                  <p className="mt-2">Compare recommended level of care vs actual level of care entered so “went somewhere” does not hide weak placement quality.</p>
                </div>
                <div className="rounded-xl border p-4">
                  <p className="font-medium text-foreground">Confidence source</p>
                  <p className="mt-2">Tag each outcome as family-reported, interventionist-confirmed, provider-confirmed, or multi-source confirmed.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scorecards" className="space-y-6">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Interventionist scorecard comparison</CardTitle>
                <CardDescription>This is where FamilyBridge starts becoming a real intelligence layer for intervention performance.</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[360px] w-full aspect-auto">
                  <BarChart data={interventionistComparison} margin={{ left: 8, right: 8, top: 8 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} interval={0} />
                    <YAxis tickLine={false} axisLine={false} width={36} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar dataKey="immediate" fill="var(--color-immediate)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="delayed" fill="var(--color-delayed)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="never" fill="var(--color-never)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <div className="grid gap-4 lg:grid-cols-3 text-sm text-muted-foreground">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Honest comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  Separate immediate conversion from delayed conversion so interventionists are not rewarded with inflated “eventual yes” numbers that hide weak placement at the intervention itself.
                </CardContent>
              </Card>
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" /> Useful coaching</CardTitle>
                </CardHeader>
                <CardContent>
                  Over time you can see who is strong at immediate treatment entry, who gets later conversions, and where family follow-through is breaking down.
                </CardContent>
              </Card>
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Next build step</CardTitle>
                </CardHeader>
                <CardContent>
                  Wire real intervention records, admission events, and follow-up timing into the database so this scorecard becomes live instead of demo-only.
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default InterventionOutcomes;
