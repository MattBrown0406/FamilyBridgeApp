import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, ReferenceLine } from "recharts";
import { TrendingUp, TrendingDown, Minus, Zap, AlertTriangle, CheckCircle } from "lucide-react";

interface TrajectoryData {
  observations: Array<{
    occurred_at: string;
    observation_type: string;
  }>;
  autoEvents: Array<{
    occurred_at: string;
    event_type: string;
    event_data: unknown;
  }>;
  riskTrajectory?: {
    direction: "improving" | "stable" | "declining";
    trend_description: string;
    contributing_factors: string[];
  };
}

interface RecoveryTrajectoryPanelProps {
  data: TrajectoryData;
  analysisRiskLevel?: number;
  analysisRiskLevelName?: string;
}

// Stability index calculation based on event types
const getEventStabilityScore = (eventType: string): number => {
  const positiveEvents: Record<string, number> = {
    meeting_checkin: 2,
    meeting_checkout: 1,
    financial_approved: 1,
    boundary_respected: 2,
    emotional_stable: 2,
  };
  
  const negativeEvents: Record<string, number> = {
    overdue_checkout: -2,
    financial_rejected: -1,
    boundary_violation: -3,
    emotional_volatile: -2,
    location_declined: -1,
  };
  
  return positiveEvents[eventType] || negativeEvents[eventType] || 0;
};

const getObservationStabilityScore = (obsType: string): number => {
  const scores: Record<string, number> = {
    behavior: 0,
    conversation: 0,
    decision: 1,
    boundary: 2,
    consequence: -1,
    emotional_climate: 0,
    calm_period: 2,
    concern: -2,
    boundary_failure: -3,
  };
  return scores[obsType] || 0;
};

// Determine trajectory label based on value
const getTrajectoryLabel = (value: number): string => {
  if (value >= 75) return "Improving";
  if (value >= 50) return "Stable";
  if (value >= 25) return "Softening";
  return "Destabilizing";
};

const getTrajectoryColor = (value: number): string => {
  if (value >= 75) return "hsl(var(--chart-2))"; // Green
  if (value >= 50) return "hsl(var(--primary))"; // Primary
  if (value >= 25) return "hsl(38 92% 50%)"; // Amber
  return "hsl(0 84% 60%)"; // Red
};

export function RecoveryTrajectoryPanel({ data, analysisRiskLevel = 0, analysisRiskLevelName }: RecoveryTrajectoryPanelProps) {
  // Generate trajectory data from observations and events
  const chartData = useMemo(() => {
    const allEvents = [
      ...data.observations.map(o => ({
        date: new Date(o.occurred_at),
        score: getObservationStabilityScore(o.observation_type),
        type: 'observation'
      })),
      ...data.autoEvents.map(e => ({
        date: new Date(e.occurred_at),
        score: getEventStabilityScore(e.event_type),
        type: 'event'
      }))
    ].sort((a, b) => a.date.getTime() - b.date.getTime());

    if (allEvents.length === 0) {
      // Return default data points if no events
      return [
        { time: "Start", stability: 50, label: "Stable" },
        { time: "Now", stability: 50, label: "Stable" },
      ];
    }

    // Group by day and calculate rolling stability
    const dayGroups: Map<string, number[]> = new Map();
    allEvents.forEach(event => {
      const dayKey = event.date.toISOString().split('T')[0];
      if (!dayGroups.has(dayKey)) {
        dayGroups.set(dayKey, []);
      }
      dayGroups.get(dayKey)!.push(event.score);
    });

    // Calculate cumulative stability index (0-100 scale)
    let runningStability = 50; // Start at neutral
    const dataPoints: Array<{ time: string; stability: number; label: string }> = [];
    
    const sortedDays = Array.from(dayGroups.keys()).sort();
    sortedDays.forEach((day, index) => {
      const dayScores = dayGroups.get(day)!;
      const dayAvg = dayScores.reduce((a, b) => a + b, 0) / dayScores.length;
      
      // Adjust stability with decay toward neutral
      runningStability = Math.max(0, Math.min(100, 
        runningStability + (dayAvg * 5) + ((50 - runningStability) * 0.1)
      ));
      
      dataPoints.push({
        time: index === 0 ? "Start" : index === sortedDays.length - 1 ? "Now" : `W${Math.ceil((index + 1) / 7)}`,
        stability: Math.round(runningStability),
        label: getTrajectoryLabel(runningStability)
      });
    });

    // Ensure we have at least 2 points for a line
    if (dataPoints.length === 1) {
      dataPoints.unshift({ time: "Start", stability: 50, label: "Stable" });
    }

    // Limit to last 8 data points for readability
    return dataPoints.slice(-8);
  }, [data.observations, data.autoEvents]);

  // Calculate current trajectory status
  const currentStatus = useMemo(() => {
    if (chartData.length < 2) return { direction: "stable" as const, value: 50 };
    
    const lastValue = chartData[chartData.length - 1].stability;
    const prevValue = chartData[chartData.length - 2].stability;
    const diff = lastValue - prevValue;
    
    if (diff > 5) return { direction: "improving" as const, value: lastValue };
    if (diff < -5) return { direction: "declining" as const, value: lastValue };
    return { direction: "stable" as const, value: lastValue };
  }, [chartData]);

  // Generate insights based on data
  const insights = useMemo(() => {
    const stabilizers: string[] = [];
    const friction: string[] = [];
    const inflections: string[] = [];

    // Analyze events for insights
    const eventCounts: Record<string, number> = {};
    data.autoEvents.forEach(e => {
      eventCounts[e.event_type] = (eventCounts[e.event_type] || 0) + 1;
    });

    const obsCounts: Record<string, number> = {};
    data.observations.forEach(o => {
      obsCounts[o.observation_type] = (obsCounts[o.observation_type] || 0) + 1;
    });

    // Identify stabilizers
    if (eventCounts.meeting_checkin && eventCounts.meeting_checkin >= 3) {
      stabilizers.push("Consistent meeting check-ins");
    }
    if (eventCounts.meeting_checkout && eventCounts.meeting_checkout >= 2) {
      stabilizers.push("Reliable checkout follow-through");
    }
    if (obsCounts.calm_period && obsCounts.calm_period >= 2) {
      stabilizers.push("Multiple periods of family calm");
    }
    if (obsCounts.boundary && obsCounts.boundary >= 1) {
      stabilizers.push("Boundary enforcement observed");
    }
    if (eventCounts.financial_approved) {
      stabilizers.push("Financial transparency maintained");
    }

    // Identify friction
    if (eventCounts.overdue_checkout) {
      friction.push("Delayed checkout responses");
    }
    if (obsCounts.concern && obsCounts.concern >= 2) {
      friction.push("Recurring moments of concern");
    }
    if (obsCounts.boundary_failure) {
      friction.push("Inconsistent boundary enforcement");
    }
    if (eventCounts.location_declined) {
      friction.push("Accountability prompt resistance");
    }
    if (obsCounts.consequence && obsCounts.consequence >= 2) {
      friction.push("Unaddressed consequences accumulating");
    }

    // Identify inflection points (recent changes)
    const recentEvents = data.autoEvents.filter(e => {
      const eventDate = new Date(e.occurred_at);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return eventDate >= weekAgo;
    });

    const recentObs = data.observations.filter(o => {
      const obsDate = new Date(o.occurred_at);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return obsDate >= weekAgo;
    });

    if (recentObs.some(o => o.observation_type === 'boundary')) {
      inflections.push("Recent boundary clarification or enforcement");
    }
    if (recentEvents.filter(e => e.event_type === 'meeting_checkin').length >= 2) {
      inflections.push("Increased meeting attendance this week");
    }
    if (recentObs.some(o => o.observation_type === 'calm_period')) {
      inflections.push("New period of stability emerging");
    }
    if (recentObs.some(o => o.observation_type === 'concern')) {
      inflections.push("New concern recently observed");
    }

    // Fallback defaults if no data
    if (stabilizers.length === 0) stabilizers.push("Building baseline observations");
    if (friction.length === 0) friction.push("No significant friction identified");
    if (inflections.length === 0) inflections.push("Continue monitoring for patterns");

    return {
      stabilizers: stabilizers.slice(0, 2),
      friction: friction.slice(0, 2),
      inflections: inflections.slice(0, 2),
    };
  }, [data.observations, data.autoEvents]);

  const currentLabel = getTrajectoryLabel(currentStatus.value);
  const currentColor = getTrajectoryColor(currentStatus.value);

  const chartConfig = {
    stability: {
      label: "Recovery Stability",
      color: currentColor,
    },
  };

  const DirectionIcon = currentStatus.direction === "improving" 
    ? TrendingUp 
    : currentStatus.direction === "declining" 
    ? TrendingDown 
    : Minus;

  return (
    <Card className="border-violet-500/20 overflow-hidden">
      <div className="h-0.5 bg-gradient-to-r from-violet-500/50 via-purple-500/50 to-fuchsia-500/50" />
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center">
            <Zap className="h-3.5 w-3.5 text-violet-600" />
          </div>
          Recovery Trajectory
          <span className="ml-auto flex items-center gap-1.5 text-xs font-normal">
            <DirectionIcon className={`h-3.5 w-3.5 ${
              currentStatus.direction === "improving" ? "text-green-600" :
              currentStatus.direction === "declining" ? "text-red-600" :
              "text-muted-foreground"
            }`} />
            <span className={`font-medium ${
              currentStatus.direction === "improving" ? "text-green-600" :
              currentStatus.direction === "declining" ? "text-red-600" :
              "text-muted-foreground"
            }`}>
              {currentLabel}
            </span>
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-3 space-y-3">
        {/* Chart */}
        <div className="h-[100px] w-full">
          <ChartContainer config={chartConfig} className="h-full w-full">
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
              <defs>
                <linearGradient id="trajectoryGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={currentColor} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={currentColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="time" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                interval="preserveStartEnd"
              />
              <YAxis 
                domain={[0, 100]} 
                hide 
                ticks={[25, 50, 75]}
              />
              {/* Reference lines for trajectory zones */}
              <ReferenceLine y={75} stroke="hsl(var(--chart-2))" strokeDasharray="3 3" strokeOpacity={0.3} />
              <ReferenceLine y={50} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" strokeOpacity={0.2} />
              <ReferenceLine y={25} stroke="hsl(38 92% 50%)" strokeDasharray="3 3" strokeOpacity={0.3} />
              <Area
                type="monotone"
                dataKey="stability"
                stroke={currentColor}
                strokeWidth={2}
                fill="url(#trajectoryGradient)"
                dot={false}
                activeDot={{ r: 4, fill: currentColor }}
              />
            </AreaChart>
          </ChartContainer>
        </div>

        {/* Trajectory Labels */}
        <div className="flex justify-between text-[10px] text-muted-foreground px-1 -mt-1">
          <span>Destabilizing</span>
          <span>Softening</span>
          <span>Stable</span>
          <span>Improving</span>
        </div>

        {/* Bullet Insights */}
        <div className="grid gap-2 pt-2 border-t">
          <div className="flex items-start gap-2 text-xs">
            <CheckCircle className="h-3.5 w-3.5 text-green-600 mt-0.5 shrink-0" />
            <div>
              <span className="text-muted-foreground">Stabilizers: </span>
              <span className="text-foreground">{insights.stabilizers.join("; ")}</span>
            </div>
          </div>
          <div className="flex items-start gap-2 text-xs">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <span className="text-muted-foreground">Friction: </span>
              <span className="text-foreground">{insights.friction.join("; ")}</span>
            </div>
          </div>
          <div className="flex items-start gap-2 text-xs">
            <Zap className="h-3.5 w-3.5 text-violet-600 mt-0.5 shrink-0" />
            <div>
              <span className="text-muted-foreground">Inflection: </span>
              <span className="text-foreground">{insights.inflections.join("; ")}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}