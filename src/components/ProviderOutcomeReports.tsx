import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Users,
  Activity,
  Target,
  RefreshCcw,
  ArrowUp,
  ArrowDown,
  Minus,
  Clock,
} from "lucide-react";
import { format, subMonths, differenceInDays } from "date-fns";

interface ProviderOutcomeReportsProps {
  organizationId: string;
  organizationName: string;
}

interface OutcomeMetrics {
  totalClients: number;
  totalHandoffs: number;
  sobrietyStabilityRate: number;
  progressionRate: number;
  regressionRate: number;
  resetRate: number;
  avgDaysInCare: number;
  completionRate: number;
  handoffsInitiated: number;
  handoffsReceived: number;
  handoffsCompleted: number;
}

interface ClientOutcome {
  userId: string;
  fullName: string;
  currentPhase: string;
  sobrietyDays: number;
  hadReset: boolean;
  phaseChanges: number;
  movedForward: boolean;
  movedBackward: boolean;
  daysInCare: number;
  wasHandedOff: boolean;
}

interface PhaseStats {
  phase: string;
  count: number;
  avgDays: number;
  progressionRate: number;
}

const PHASE_LABELS: Record<string, string> = {
  detox: "Detox",
  residential_treatment: "Residential Treatment",
  partial_hospitalization: "Partial Hospitalization",
  intensive_outpatient: "Intensive Outpatient",
  outpatient: "Outpatient",
  sober_living: "Sober Living",
  independent: "Independent Living",
};

const PHASE_ORDER = [
  "detox",
  "residential_treatment",
  "partial_hospitalization",
  "intensive_outpatient",
  "outpatient",
  "sober_living",
  "independent",
];

export const ProviderOutcomeReports = ({
  organizationId,
  organizationName,
}: ProviderOutcomeReportsProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState<OutcomeMetrics | null>(null);
  const [clientOutcomes, setClientOutcomes] = useState<ClientOutcome[]>([]);
  const [phaseStats, setPhaseStats] = useState<PhaseStats[]>([]);
  const [dateRange, setDateRange] = useState<"30d" | "90d" | "1y" | "all">("90d");

  useEffect(() => {
    if (organizationId) {
      fetchOutcomeData();
    }
  }, [organizationId, dateRange]);

  const getDateFilter = () => {
    const now = new Date();
    switch (dateRange) {
      case "30d":
        return subMonths(now, 1).toISOString();
      case "90d":
        return subMonths(now, 3).toISOString();
      case "1y":
        return subMonths(now, 12).toISOString();
      case "all":
        return null;
    }
  };

  const fetchOutcomeData = async () => {
    setIsLoading(true);
    try {
      const dateFilter = getDateFilter();

      // Get families for this organization
      const { data: families, error: familiesError } = await supabase
        .from("families")
        .select("id")
        .eq("organization_id", organizationId);

      if (familiesError) throw familiesError;

      const familyIds = families?.map((f) => f.id) || [];

      if (familyIds.length === 0) {
        setMetrics({
          totalClients: 0,
          totalHandoffs: 0,
          sobrietyStabilityRate: 0,
          progressionRate: 0,
          regressionRate: 0,
          resetRate: 0,
          avgDaysInCare: 0,
          completionRate: 0,
          handoffsInitiated: 0,
          handoffsReceived: 0,
          handoffsCompleted: 0,
        });
        setClientOutcomes([]);
        setPhaseStats([]);
        setIsLoading(false);
        return;
      }

      // Get recovering members
      const { data: members, error: membersError } = await supabase
        .from("family_members")
        .select("user_id, family_id, joined_at")
        .in("family_id", familyIds)
        .eq("role", "recovering");

      if (membersError) throw membersError;

      const userIds = [...new Set(members?.map((m) => m.user_id) || [])];

      // Get profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);

      // Get sobriety journeys
      const { data: journeys } = await supabase
        .from("sobriety_journeys")
        .select("*")
        .in("user_id", userIds)
        .in("family_id", familyIds);

      // Get care phases
      let phasesQuery = supabase
        .from("care_phases")
        .select("*")
        .in("family_id", familyIds);

      if (dateFilter) {
        phasesQuery = phasesQuery.gte("created_at", dateFilter);
      }

      const { data: phases } = await phasesQuery;

      // Get handoffs
      let handoffsQuery = supabase
        .from("provider_handoffs")
        .select("*")
        .or(`from_organization_id.eq.${organizationId},to_organization_id.eq.${organizationId}`);

      if (dateFilter) {
        handoffsQuery = handoffsQuery.gte("created_at", dateFilter);
      }

      const { data: handoffs } = await handoffsQuery;

      // Calculate metrics
      const totalClients = userIds.length;
      
      // Count users whose sobriety date hasn't changed (no resets)
      const usersWithStableSobriety = journeys?.filter(
        (j) => j.reset_count === 0 && j.is_active
      ).length || 0;
      
      const sobrietyStabilityRate = totalClients > 0
        ? Math.round((usersWithStableSobriety / totalClients) * 100)
        : 0;

      // Calculate progression (users who moved to a higher level of care)
      let progressedUsers = 0;
      let regressedUsers = 0;
      let resetUsers = 0;

      const clientOutcomesList: ClientOutcome[] = [];

      for (const userId of userIds) {
        const userPhases = phases?.filter((p) => p.user_id === userId) || [];
        const userJourney = journeys?.find(
          (j) => j.user_id === userId && j.is_active
        );
        const profile = profiles?.find((p) => p.id === userId);
        const member = members?.find((m) => m.user_id === userId);

        const currentPhase = userPhases.find((p) => p.is_current);
        const hadReset = userJourney?.reset_count ? userJourney.reset_count > 0 : false;
        
        if (hadReset) resetUsers++;

        // Check phase progression
        const sortedPhases = userPhases
          .filter((p) => p.ended_at)
          .sort((a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime());

        let movedForward = false;
        let movedBackward = false;

        for (let i = 1; i < sortedPhases.length; i++) {
          const prevPhaseIndex = PHASE_ORDER.indexOf(sortedPhases[i - 1].phase_type);
          const currPhaseIndex = PHASE_ORDER.indexOf(sortedPhases[i].phase_type);
          
          if (currPhaseIndex > prevPhaseIndex) {
            movedForward = true;
          } else if (currPhaseIndex < prevPhaseIndex) {
            movedBackward = true;
          }
        }

        if (movedForward && !movedBackward) progressedUsers++;
        if (movedBackward) regressedUsers++;

        const sobrietyDays = userJourney
          ? differenceInDays(new Date(), new Date(userJourney.start_date))
          : 0;

        const daysInCare = member
          ? differenceInDays(new Date(), new Date(member.joined_at))
          : 0;

        const wasHandedOff = handoffs?.some(
          (h) => h.user_id === userId && h.status === "completed"
        ) || false;

        clientOutcomesList.push({
          userId,
          fullName: profile?.full_name || "Unknown",
          currentPhase: currentPhase?.phase_type || "unknown",
          sobrietyDays,
          hadReset,
          phaseChanges: sortedPhases.length,
          movedForward,
          movedBackward,
          daysInCare,
          wasHandedOff,
        });
      }

      const progressionRate = totalClients > 0
        ? Math.round((progressedUsers / totalClients) * 100)
        : 0;

      const regressionRate = totalClients > 0
        ? Math.round((regressedUsers / totalClients) * 100)
        : 0;

      const resetRate = totalClients > 0
        ? Math.round((resetUsers / totalClients) * 100)
        : 0;

      // Calculate avg days in care
      const totalDays = clientOutcomesList.reduce((sum, c) => sum + c.daysInCare, 0);
      const avgDaysInCare = totalClients > 0 ? Math.round(totalDays / totalClients) : 0;

      // Completion rate (reached independent living)
      const completedClients = clientOutcomesList.filter(
        (c) => c.currentPhase === "independent"
      ).length;
      const completionRate = totalClients > 0
        ? Math.round((completedClients / totalClients) * 100)
        : 0;

      // Handoff metrics
      const handoffsInitiated = handoffs?.filter(
        (h) => h.from_organization_id === organizationId
      ).length || 0;
      const handoffsReceived = handoffs?.filter(
        (h) => h.to_organization_id === organizationId
      ).length || 0;
      const handoffsCompleted = handoffs?.filter(
        (h) => h.status === "completed"
      ).length || 0;

      setMetrics({
        totalClients,
        totalHandoffs: handoffs?.length || 0,
        sobrietyStabilityRate,
        progressionRate,
        regressionRate,
        resetRate,
        avgDaysInCare,
        completionRate,
        handoffsInitiated,
        handoffsReceived,
        handoffsCompleted,
      });

      setClientOutcomes(clientOutcomesList);

      // Calculate phase stats
      const phaseStatsList: PhaseStats[] = PHASE_ORDER.map((phase) => {
        const phaseClients = phases?.filter((p) => p.phase_type === phase) || [];
        const uniqueUsers = [...new Set(phaseClients.map((p) => p.user_id))];
        
        const totalPhaseDays = phaseClients
          .filter((p) => p.ended_at)
          .reduce((sum, p) => {
            return sum + differenceInDays(new Date(p.ended_at!), new Date(p.started_at));
          }, 0);
        
        const completedPhases = phaseClients.filter((p) => p.ended_at).length;
        const avgDays = completedPhases > 0 ? Math.round(totalPhaseDays / completedPhases) : 0;

        // Calculate how many moved to next phase
        const nextPhaseIndex = PHASE_ORDER.indexOf(phase) + 1;
        const nextPhase = PHASE_ORDER[nextPhaseIndex];
        
        const progressedToNext = uniqueUsers.filter((userId) => {
          const userCurrentPhase = phases?.find(
            (p) => p.user_id === userId && p.is_current
          );
          return userCurrentPhase && PHASE_ORDER.indexOf(userCurrentPhase.phase_type) >= nextPhaseIndex;
        }).length;

        const progressionRate = uniqueUsers.length > 0
          ? Math.round((progressedToNext / uniqueUsers.length) * 100)
          : 0;

        return {
          phase,
          count: uniqueUsers.length,
          avgDays,
          progressionRate,
        };
      }).filter((s) => s.count > 0);

      setPhaseStats(phaseStatsList);
    } catch (error) {
      console.error("Error fetching outcome data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const MetricCard = ({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
    color = "primary",
  }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ElementType;
    trend?: "up" | "down" | "neutral";
    color?: "primary" | "success" | "warning" | "destructive";
  }) => {
    const colorClasses = {
      primary: "text-primary bg-primary/10",
      success: "text-green-600 bg-green-100",
      warning: "text-amber-600 bg-amber-100",
      destructive: "text-red-600 bg-red-100",
    };

    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{title}</p>
              <p className="text-2xl font-bold mt-1">{value}</p>
              {subtitle && (
                <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
              )}
            </div>
            <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
              <Icon className="h-5 w-5" />
            </div>
          </div>
          {trend && (
            <div className="mt-2 flex items-center gap-1 text-xs">
              {trend === "up" && (
                <>
                  <ArrowUp className="h-3 w-3 text-green-600" />
                  <span className="text-green-600">Positive trend</span>
                </>
              )}
              {trend === "down" && (
                <>
                  <ArrowDown className="h-3 w-3 text-red-600" />
                  <span className="text-red-600">Needs attention</span>
                </>
              )}
              {trend === "neutral" && (
                <>
                  <Minus className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Stable</span>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Range Filter */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Outcome Measurements
        </h3>
        <div className="flex gap-2">
          {(["30d", "90d", "1y", "all"] as const).map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                dateRange === range
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80"
              }`}
            >
              {range === "30d" ? "30 Days" : range === "90d" ? "90 Days" : range === "1y" ? "1 Year" : "All Time"}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Sobriety Stability Rate"
          value={`${metrics?.sobrietyStabilityRate || 0}%`}
          subtitle="Clients maintaining original sobriety date"
          icon={CheckCircle2}
          color="success"
          trend={
            (metrics?.sobrietyStabilityRate || 0) >= 70
              ? "up"
              : (metrics?.sobrietyStabilityRate || 0) >= 50
              ? "neutral"
              : "down"
          }
        />
        <MetricCard
          title="Progression Rate"
          value={`${metrics?.progressionRate || 0}%`}
          subtitle="Clients advancing to next level of care"
          icon={TrendingUp}
          color="success"
          trend={
            (metrics?.progressionRate || 0) >= 60
              ? "up"
              : (metrics?.progressionRate || 0) >= 40
              ? "neutral"
              : "down"
          }
        />
        <MetricCard
          title="Regression Rate"
          value={`${metrics?.regressionRate || 0}%`}
          subtitle="Clients returning to previous level"
          icon={TrendingDown}
          color={(metrics?.regressionRate || 0) <= 15 ? "success" : (metrics?.regressionRate || 0) <= 30 ? "warning" : "destructive"}
          trend={
            (metrics?.regressionRate || 0) <= 15
              ? "up"
              : (metrics?.regressionRate || 0) <= 30
              ? "neutral"
              : "down"
          }
        />
        <MetricCard
          title="Reset Rate"
          value={`${metrics?.resetRate || 0}%`}
          subtitle="Clients who established new sobriety date"
          icon={RefreshCcw}
          color={(metrics?.resetRate || 0) <= 20 ? "success" : (metrics?.resetRate || 0) <= 40 ? "warning" : "destructive"}
          trend={
            (metrics?.resetRate || 0) <= 20
              ? "up"
              : (metrics?.resetRate || 0) <= 40
              ? "neutral"
              : "down"
          }
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Clients"
          value={metrics?.totalClients || 0}
          icon={Users}
          color="primary"
        />
        <MetricCard
          title="Avg. Days in Care"
          value={metrics?.avgDaysInCare || 0}
          icon={Clock}
          color="primary"
        />
        <MetricCard
          title="Completion Rate"
          value={`${metrics?.completionRate || 0}%`}
          subtitle="Reached independent living"
          icon={Target}
          color={
            (metrics?.completionRate || 0) >= 30
              ? "success"
              : "primary"
          }
        />
        <MetricCard
          title="Provider Handoffs"
          value={metrics?.totalHandoffs || 0}
          subtitle={`${metrics?.handoffsInitiated || 0} sent, ${metrics?.handoffsReceived || 0} received`}
          icon={ArrowRightLeft}
          color="primary"
        />
      </div>

      <Tabs defaultValue="phases" className="w-full">
        <TabsList>
          <TabsTrigger value="phases">
            <Activity className="h-4 w-4 mr-2" />
            Phase Analysis
          </TabsTrigger>
          <TabsTrigger value="clients">
            <Users className="h-4 w-4 mr-2" />
            Client Outcomes
          </TabsTrigger>
          <TabsTrigger value="accountability">
            <Target className="h-4 w-4 mr-2" />
            Accountability Metrics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="phases" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Care Level Statistics</CardTitle>
              <CardDescription>
                Breakdown of client progression through each level of care
              </CardDescription>
            </CardHeader>
            <CardContent>
              {phaseStats.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No phase data available for the selected time period.
                </p>
              ) : (
                <div className="space-y-4">
                  {phaseStats.map((stat) => (
                    <div key={stat.phase} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">
                          {PHASE_LABELS[stat.phase] || stat.phase}
                        </span>
                        <Badge variant="secondary">
                          {stat.count} client{stat.count !== 1 ? "s" : ""}
                        </Badge>
                      </div>
                      <div className="grid gap-4 md:grid-cols-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">Avg. Duration:</span>
                          <span className="ml-2 font-medium">{stat.avgDays} days</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Progression Rate:</span>
                          <span className="ml-2 font-medium">{stat.progressionRate}%</span>
                        </div>
                        <div>
                          <Progress value={stat.progressionRate} className="h-2 mt-2" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clients" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Individual Client Outcomes</CardTitle>
              <CardDescription>
                Detailed view of each client's recovery journey
              </CardDescription>
            </CardHeader>
            <CardContent>
              {clientOutcomes.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No client data available for the selected time period.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client</TableHead>
                        <TableHead>Current Phase</TableHead>
                        <TableHead className="text-center">Sobriety Days</TableHead>
                        <TableHead className="text-center">Days in Care</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-center">Handed Off</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clientOutcomes.map((client) => (
                        <TableRow key={client.userId}>
                          <TableCell className="font-medium">
                            {client.fullName}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {PHASE_LABELS[client.currentPhase] || client.currentPhase}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            {client.sobrietyDays}
                          </TableCell>
                          <TableCell className="text-center">
                            {client.daysInCare}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              {client.movedForward && !client.movedBackward && (
                                <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                                  <TrendingUp className="h-3 w-3 mr-1" />
                                  Progressing
                                </Badge>
                              )}
                              {client.movedBackward && (
                                <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                                  <TrendingDown className="h-3 w-3 mr-1" />
                                  Regressed
                                </Badge>
                              )}
                              {client.hadReset && (
                                <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                                  <RefreshCcw className="h-3 w-3 mr-1" />
                                  Reset
                                </Badge>
                              )}
                              {!client.movedForward && !client.movedBackward && !client.hadReset && (
                                <Badge variant="secondary">
                                  <Minus className="h-3 w-3 mr-1" />
                                  Stable
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {client.wasHandedOff ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600 mx-auto" />
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="accountability" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Key Performance Indicators
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">Retention Rate</p>
                      <p className="text-xs text-muted-foreground">
                        Clients who stayed in program
                      </p>
                    </div>
                    <div className="text-2xl font-bold text-primary">
                      {metrics && metrics.totalClients > 0
                        ? Math.round(
                            ((metrics.totalClients - (metrics.handoffsInitiated || 0)) /
                              metrics.totalClients) *
                              100
                          )
                        : 0}
                      %
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">Successful Handoff Rate</p>
                      <p className="text-xs text-muted-foreground">
                        Completed transitions to next provider
                      </p>
                    </div>
                    <div className="text-2xl font-bold text-primary">
                      {metrics && metrics.handoffsInitiated > 0
                        ? Math.round(
                            ((metrics.handoffsCompleted || 0) / metrics.handoffsInitiated) * 100
                          )
                        : 0}
                      %
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">Early Intervention Score</p>
                      <p className="text-xs text-muted-foreground">
                        Low regression + low reset rates
                      </p>
                    </div>
                    <div className="text-2xl font-bold text-primary">
                      {metrics
                        ? Math.max(
                            0,
                            100 - (metrics.regressionRate + metrics.resetRate)
                          )
                        : 0}
                      %
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Areas for Improvement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(metrics?.regressionRate || 0) > 20 && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="font-medium text-amber-800">High Regression Rate</p>
                      <p className="text-xs text-amber-700">
                        {metrics?.regressionRate}% of clients have returned to a previous level of care. 
                        Consider reviewing transition criteria and support systems.
                      </p>
                    </div>
                  )}
                  {(metrics?.resetRate || 0) > 30 && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="font-medium text-red-800">Elevated Reset Rate</p>
                      <p className="text-xs text-red-700">
                        {metrics?.resetRate}% of clients have had to establish a new sobriety date. 
                        Review relapse prevention protocols.
                      </p>
                    </div>
                  )}
                  {(metrics?.completionRate || 0) < 20 && (metrics?.totalClients || 0) > 5 && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="font-medium text-blue-800">Low Completion Rate</p>
                      <p className="text-xs text-blue-700">
                        Only {metrics?.completionRate}% have reached independent living. 
                        This may indicate clients need longer support or additional resources.
                      </p>
                    </div>
                  )}
                  {(metrics?.regressionRate || 0) <= 20 &&
                    (metrics?.resetRate || 0) <= 30 &&
                    ((metrics?.completionRate || 0) >= 20 || (metrics?.totalClients || 0) <= 5) && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="font-medium text-green-800">Strong Performance</p>
                        <p className="text-xs text-green-700">
                          Your organization is meeting key outcome benchmarks. 
                          Continue current practices and share successful strategies.
                        </p>
                      </div>
                    )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
