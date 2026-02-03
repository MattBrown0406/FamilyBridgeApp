import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Activity, 
  Calendar, 
  Clock, 
  TrendingDown,
  MessageCircle,
  Users,
  Shield,
  Stethoscope,
  HelpCircle,
  Loader2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PatternShiftAlert {
  id: string;
  alert_type: 
    | "boundary_consistency_drift"
    | "help_seeking_latency"
    | "schedule_avoidance"
    | "family_pressure_imbalance"
    | "provider_disengagement";
  description: string;
  time_window: string;
  comparison_baseline: string;
  discussion_prompt: string;
  detected_at: string;
  magnitude: "minor" | "moderate" | "notable";
}

interface PatternShiftAlertsProps {
  familyId: string;
  isProvider?: boolean;
}

const ALERT_TYPE_CONFIG: Record<PatternShiftAlert["alert_type"], { 
  label: string; 
  icon: typeof Activity;
  color: string;
}> = {
  boundary_consistency_drift: {
    label: "Boundary Consistency",
    icon: Shield,
    color: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  },
  help_seeking_latency: {
    label: "Help-Seeking Patterns",
    icon: HelpCircle,
    color: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  },
  schedule_avoidance: {
    label: "Schedule Engagement",
    icon: Calendar,
    color: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
  },
  family_pressure_imbalance: {
    label: "Family Dynamics",
    icon: Users,
    color: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
  },
  provider_disengagement: {
    label: "Engagement Signals",
    icon: Stethoscope,
    color: "bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20",
  },
};

const MAGNITUDE_CONFIG: Record<PatternShiftAlert["magnitude"], {
  label: string;
  dotColor: string;
}> = {
  minor: {
    label: "Minor shift",
    dotColor: "bg-yellow-400",
  },
  moderate: {
    label: "Moderate shift",
    dotColor: "bg-amber-500",
  },
  notable: {
    label: "Notable shift",
    dotColor: "bg-orange-500",
  },
};

// Simulated alerts based on existing FIIS data patterns
function deriveAlertsFromPatterns(
  patternSignals: Array<{ signal_type: string; description: string; confidence?: string }>,
  complianceTrends?: { 
    boundary_adherence?: string; 
    meeting_attendance?: string; 
    trend_direction?: string;
  }
): PatternShiftAlert[] {
  const alerts: PatternShiftAlert[] = [];
  const now = new Date();

  // Check boundary consistency (compare to full history)
  if (complianceTrends?.boundary_adherence === "weak" || complianceTrends?.boundary_adherence === "mixed") {
    alerts.push({
      id: "boundary-drift-1",
      alert_type: "boundary_consistency_drift",
      description: "Boundary adherence has shown variation compared to the historical baseline established since Day 1.",
      time_window: "Full history analysis",
      comparison_baseline: "Historical average since app start",
      discussion_prompt: "Consider exploring recent stressors that may be affecting follow-through on stated boundaries.",
      detected_at: now.toISOString(),
      magnitude: complianceTrends.boundary_adherence === "weak" ? "notable" : "moderate",
    });
  }

  // Check meeting/schedule patterns (compare to full history)
  if (complianceTrends?.meeting_attendance === "inconsistent" || complianceTrends?.meeting_attendance === "declining") {
    alerts.push({
      id: "schedule-avoidance-1",
      alert_type: "schedule_avoidance",
      description: "Scheduled engagement patterns have shifted from the typical pattern established over the family's journey.",
      time_window: "Full history analysis",
      comparison_baseline: "Historical attendance baseline",
      discussion_prompt: "It may be helpful to understand if there are practical barriers or emotional factors influencing attendance.",
      detected_at: now.toISOString(),
      magnitude: complianceTrends.meeting_attendance === "declining" ? "notable" : "moderate",
    });
  }

  // Check for help-seeking latency from patterns
  const helpSeekingPatterns = patternSignals.filter(p => 
    p.signal_type.includes("help") || 
    p.description?.toLowerCase().includes("delay") ||
    p.description?.toLowerCase().includes("reluctan")
  );
  if (helpSeekingPatterns.length > 0) {
    alerts.push({
      id: "help-seeking-1",
      alert_type: "help_seeking_latency",
      description: "Time between expressed need and reaching out for support has increased compared to historical patterns.",
      time_window: "Recent activity vs full history",
      comparison_baseline: "Historical response patterns",
      discussion_prompt: "Consider whether there are barriers—real or perceived—to asking for help when needed.",
      detected_at: now.toISOString(),
      magnitude: "moderate",
    });
  }

  // Check for family pressure imbalance
  const familyPatterns = patternSignals.filter(p => 
    p.signal_type.includes("family") || 
    p.signal_type.includes("split") ||
    p.signal_type.includes("enabling")
  );
  if (familyPatterns.length > 0) {
    alerts.push({
      id: "family-pressure-1",
      alert_type: "family_pressure_imbalance",
      description: "Distribution of engagement and accountability across family members has shifted from historical norms.",
      time_window: "Full history analysis",
      comparison_baseline: "Established family engagement pattern",
      discussion_prompt: "It may be worth discussing how responsibilities and support are being shared within the family unit.",
      detected_at: now.toISOString(),
      magnitude: familyPatterns.some(p => p.signal_type.includes("enabling")) ? "notable" : "minor",
    });
  }

  // Check overall declining trend
  if (complianceTrends?.trend_direction === "declining") {
    alerts.push({
      id: "engagement-decline-1",
      alert_type: "provider_disengagement",
      description: "Overall engagement metrics have declined compared to the established trajectory since app start.",
      time_window: "Full history analysis",
      comparison_baseline: "Peak engagement period",
      discussion_prompt: "This may be a good time to revisit what was working well during higher engagement periods.",
      detected_at: now.toISOString(),
      magnitude: "moderate",
    });
  }

  return alerts;
}

export function PatternShiftAlerts({ familyId, isProvider = false }: PatternShiftAlertsProps) {
  const [alerts, setAlerts] = useState<PatternShiftAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      setIsLoading(true);
      try {
        // Fetch the latest pattern analysis to derive alerts
        const { data: analysisData } = await supabase
          .from("fiis_pattern_analyses")
          .select("pattern_signals, input_summary")
          .eq("family_id", familyId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (analysisData) {
          const patternSignals = Array.isArray(analysisData.pattern_signals) 
            ? analysisData.pattern_signals as Array<{ signal_type: string; description: string; confidence?: string }>
            : [];
          const inputSummary = analysisData.input_summary as Record<string, unknown> | null;
          const complianceTrends = inputSummary?.compliance_trends as { 
            boundary_adherence?: string; 
            meeting_attendance?: string;
            trend_direction?: string;
          } | undefined;

          const derivedAlerts = deriveAlertsFromPatterns(patternSignals, complianceTrends);
          setAlerts(derivedAlerts);
        }
      } catch (error) {
        console.error("Error fetching pattern shift alerts:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (familyId) {
      fetchAlerts();
    }
  }, [familyId]);

  if (isLoading) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (alerts.length === 0) {
    return (
      <Card className="border-dashed bg-muted/30">
        <CardContent className="py-6 text-center">
          <Activity className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">
            No pattern shifts detected at this time.
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Monitoring continues based on observations and engagement data.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
          Pattern Shift Observations
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs">
                <p className="text-xs">
                  These observations highlight shifts from established baselines. 
                  They are intended for discussion, not diagnosis.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.map((alert) => {
          const config = ALERT_TYPE_CONFIG[alert.alert_type];
          const magnitudeConfig = MAGNITUDE_CONFIG[alert.magnitude];
          const Icon = config.icon;

          return (
            <div
              key={alert.id}
              className={`p-4 rounded-lg border ${config.color} space-y-3`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span className="font-medium text-sm">{config.label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${magnitudeConfig.dotColor}`} />
                  <span className="text-xs text-muted-foreground">{magnitudeConfig.label}</span>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm leading-relaxed">
                {alert.description}
              </p>

              {/* Time Window & Baseline */}
              <div className="flex flex-wrap gap-3 text-xs">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{alert.time_window}</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Activity className="h-3 w-3" />
                  <span>vs. {alert.comparison_baseline}</span>
                </div>
              </div>

              {/* Discussion Prompt */}
              <div className="pt-2 border-t border-current/10">
                <div className="flex items-start gap-2">
                  <MessageCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 opacity-70" />
                  <p className="text-xs italic leading-relaxed opacity-90">
                    {alert.discussion_prompt}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
