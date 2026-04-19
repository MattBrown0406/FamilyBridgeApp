import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity, AlertTriangle, ArrowRightLeft, Building2, CheckCircle2, HeartPulse, TrendingDown, TrendingUp, Users } from 'lucide-react';

interface BenchmarkTimeline {
  key: string;
  label: string;
  days: number;
  total_clients: number;
  sober_count: number;
  sober_percent: number;
  family_engaged_count: number;
  family_engaged_percent: number;
  direct_support_count?: number;
  direct_support_percent?: number;
  avg_supportive_communication_score?: number;
  avg_concerning_communication_score?: number;
  supportive_valence_count?: number;
  mixed_valence_count?: number;
  strained_valence_count?: number;
  destabilizing_valence_count?: number;
  aftercare_adherent_count: number;
  aftercare_adherent_percent: number;
}

interface OutcomesOverview {
  total_recovering_members: number;
  active_recovering_members: number;
  providers_with_outcome_tracking: number;
  providers_opted_into_benchmarks: number;
  total_completed_handoffs: number;
  critical_alert_count: number;
  warning_alert_count: number;
  sobriety_stability_rate: number;
  progression_rate: number;
  regression_rate: number;
  reset_rate: number;
  completion_rate: number;
  avg_days_in_care: number;
  benchmark_timelines: BenchmarkTimeline[];
}

interface OrganizationOutcome {
  organization_id: string;
  organization_name: string;
  family_count: number;
  client_count: number;
  active_recovering_count: number;
  sobriety_stability_rate: number;
  progression_rate: number;
  regression_rate: number;
  reset_rate: number;
  completion_rate: number;
  avg_days_in_care: number;
  total_handoffs: number;
  handoffs_initiated: number;
  handoffs_received: number;
  handoffs_completed: number;
  score_trend: string;
  critical_alert_count: number;
  warning_alert_count: number;
  benchmark_opt_in: boolean;
  provider_category: string | null;
  levels_of_care: string[];
  benchmark_timelines: BenchmarkTimeline[];
}

interface FamilyOutcome {
  family_id: string;
  family_name: string;
  organization_id: string | null;
  organization_name: string | null;
  user_id: string;
  current_phase: string | null;
  sobriety_days: number;
  reset_count: number;
  had_reset: boolean;
  moved_forward: boolean;
  moved_backward: boolean;
  days_in_care: number;
  was_handed_off: boolean;
}

interface Props {
  outcomes: {
    overview: OutcomesOverview;
    organizations: OrganizationOutcome[];
    families: FamilyOutcome[];
  };
}

const phaseLabel = (phase: string | null) => {
  if (!phase) return 'Unknown';
  return phase
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

export function SuperAdminOutcomesDashboard({ outcomes }: Props) {
  const topProviders = outcomes.organizations.slice(0, 8);
  const highRiskFamilies = outcomes.families
    .filter((family) => family.had_reset || family.moved_backward)
    .sort((a, b) => {
      const aScore = (a.had_reset ? 2 : 0) + (a.moved_backward ? 1 : 0);
      const bScore = (b.had_reset ? 2 : 0) + (b.moved_backward ? 1 : 0);
      return bScore - aScore || b.sobriety_days - a.sobriety_days;
    })
    .slice(0, 12);

  const MetricCard = ({ title, value, note, icon: Icon }: { title: string; value: string | number; note?: string; icon: React.ElementType }) => (
    <Card className="border-0 shadow-sm">
      <CardContent className="pt-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-2xl font-bold leading-none">{value}</div>
            <div className="text-xs text-muted-foreground mt-1">{title}</div>
            {note ? <div className="text-[11px] text-muted-foreground/80 mt-1">{note}</div> : null}
          </div>
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">365-day recovery benchmarks</CardTitle>
          <CardDescription>Counts and percentages at 30, 90, 180, 270, and 365 days post treatment completion.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 xl:grid-cols-5 gap-3">
            {outcomes.overview.benchmark_timelines.map((benchmark) => (
              <div key={benchmark.key} className="rounded-xl border p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium text-sm">{benchmark.label}</div>
                  <Badge variant="outline">{benchmark.total_clients} clients</Badge>
                </div>
                <div className="space-y-2 text-xs">
                  <div>
                    <div className="flex items-center justify-between mb-1"><span>Sobriety</span><span>{benchmark.sober_percent}% ({benchmark.sober_count})</span></div>
                    <Progress value={benchmark.sober_percent} className="h-2" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1"><span>Family engagement</span><span>{benchmark.family_engaged_percent}% ({benchmark.family_engaged_count})</span></div>
                    <Progress value={benchmark.family_engaged_percent} className="h-2" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1"><span>Direct support</span><span>{benchmark.direct_support_percent ?? 0}% ({benchmark.direct_support_count ?? 0})</span></div>
                    <Progress value={benchmark.direct_support_percent ?? 0} className="h-2" />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                    <div>Supportive comms: <span className="font-medium text-foreground">{benchmark.avg_supportive_communication_score ?? 0}</span></div>
                    <div>Concerning comms: <span className="font-medium text-foreground">{benchmark.avg_concerning_communication_score ?? 0}</span></div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1"><span>Aftercare adherence</span><span>{benchmark.aftercare_adherent_percent}% ({benchmark.aftercare_adherent_count})</span></div>
                    <Progress value={benchmark.aftercare_adherent_percent} className="h-2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <MetricCard title="Recovering members" value={outcomes.overview.total_recovering_members} icon={Users} />
        <MetricCard title="Stability rate" value={`${outcomes.overview.sobriety_stability_rate}%`} icon={HeartPulse} />
        <MetricCard title="Progression rate" value={`${outcomes.overview.progression_rate}%`} icon={TrendingUp} />
        <MetricCard title="Regression rate" value={`${outcomes.overview.regression_rate}%`} icon={TrendingDown} />
        <MetricCard title="Completion rate" value={`${outcomes.overview.completion_rate}%`} icon={CheckCircle2} />
        <MetricCard title="Completed handoffs" value={outcomes.overview.total_completed_handoffs} icon={ArrowRightLeft} />
      </div>

      <div className="grid lg:grid-cols-[1.4fr,1fr] gap-4">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4 text-primary" />
              Provider outcomes leaderboard
            </CardTitle>
            <CardDescription>Real cross-provider aggregate outcomes from live family, sobriety, phase, handoff, and alert data.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topProviders.length === 0 ? (
                <div className="text-sm text-muted-foreground py-6 text-center">No provider outcome data yet.</div>
              ) : topProviders.map((provider) => (
                <div key={provider.organization_id} className="rounded-xl border p-3 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{provider.organization_name}</div>
                      <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-2">
                        <span>{provider.family_count} families</span>
                        <span>{provider.client_count} clients</span>
                        {provider.provider_category ? <span>{provider.provider_category}</span> : null}
                      </div>
                    </div>
                    <Badge variant="outline">
                      {provider.score_trend || 'tracked'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <div className="text-muted-foreground">Stability</div>
                      <div className="font-semibold">{provider.sobriety_stability_rate}%</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Progression</div>
                      <div className="font-semibold">{provider.progression_rate}%</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Completion</div>
                      <div className="font-semibold">{provider.completion_rate}%</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Avg days in care</div>
                      <div className="font-semibold">{provider.avg_days_in_care}</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2 text-[11px]">
                      <Badge variant="secondary">{provider.handoffs_completed} completed handoffs</Badge>
                      <Badge variant="secondary">{provider.reset_rate}% resets</Badge>
                      <Badge variant="secondary">{provider.regression_rate}% regressions</Badge>
                      {provider.critical_alert_count > 0 ? <Badge variant="destructive">{provider.critical_alert_count} critical alerts</Badge> : null}
                      {provider.warning_alert_count > 0 ? <Badge variant="outline">{provider.warning_alert_count} warnings</Badge> : null}
                      {provider.benchmark_opt_in ? <Badge variant="outline">Benchmark opt-in</Badge> : null}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                      {provider.benchmark_timelines.map((benchmark) => (
                        <div key={benchmark.key} className="rounded-lg bg-muted/40 p-2 text-[11px] space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{benchmark.label}</span>
                            <span>{benchmark.total_clients} clients</span>
                          </div>
                          <div>Sober: {benchmark.sober_percent}% ({benchmark.sober_count})</div>
                          <div>Family: {benchmark.family_engaged_percent}% ({benchmark.family_engaged_count})</div>
                          <div>Direct support: {benchmark.direct_support_percent ?? 0}% ({benchmark.direct_support_count ?? 0})</div>
                          <div>Comms: +{benchmark.avg_supportive_communication_score ?? 0} / -{benchmark.avg_concerning_communication_score ?? 0}</div>
                          <div>Aftercare: {benchmark.aftercare_adherent_percent}% ({benchmark.aftercare_adherent_count})</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="h-4 w-4 text-primary" />
                System signals
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-muted/50 p-3">
                <div className="text-xl font-bold">{outcomes.overview.providers_with_outcome_tracking}</div>
                <div className="text-xs text-muted-foreground">Providers tracking outcomes</div>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <div className="text-xl font-bold">{outcomes.overview.providers_opted_into_benchmarks}</div>
                <div className="text-xs text-muted-foreground">Benchmark participants</div>
              </div>
              <div className="rounded-lg bg-red-50 p-3 border border-red-100">
                <div className="text-xl font-bold text-red-600">{outcomes.overview.critical_alert_count}</div>
                <div className="text-xs text-muted-foreground">Critical alerts</div>
              </div>
              <div className="rounded-lg bg-amber-50 p-3 border border-amber-100">
                <div className="text-xl font-bold text-amber-600">{outcomes.overview.warning_alert_count}</div>
                <div className="text-xs text-muted-foreground">Warning alerts</div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="h-4 w-4 text-primary" />
                Higher-risk family outcomes
              </CardTitle>
              <CardDescription>Families showing reset or backward-care movement signals.</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[420px] pr-3">
                <div className="space-y-2">
                  {highRiskFamilies.length === 0 ? (
                    <div className="text-sm text-muted-foreground py-6 text-center">No high-risk families flagged right now.</div>
                  ) : highRiskFamilies.map((family) => (
                    <div key={`${family.family_id}-${family.user_id}`} className="rounded-lg border p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-medium truncate">{family.family_name}</div>
                          <div className="text-xs text-muted-foreground truncate mt-1">{family.organization_name || 'Standalone family'}</div>
                        </div>
                        <Badge variant={family.had_reset ? 'destructive' : 'outline'}>
                          {family.had_reset ? 'Reset' : 'Regression'}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                        <div>
                          <div className="text-muted-foreground">Current phase</div>
                          <div className="font-medium">{phaseLabel(family.current_phase)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Sobriety days</div>
                          <div className="font-medium">{family.sobriety_days}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Days in care</div>
                          <div className="font-medium">{family.days_in_care}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Handoff</div>
                          <div className="font-medium">{family.was_handed_off ? 'Completed' : 'No'}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
