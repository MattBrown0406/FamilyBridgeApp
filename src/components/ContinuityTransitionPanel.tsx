import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle,
  AlertTriangle,
  Users,
  Shield,
  TrendingUp,
  Loader2,
  ArrowRight,
  Heart,
  XCircle,
  Layers,
  HelpCircle,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface ContinuityData {
  whatsWorking: string[];
  whatDestabilizes: string[];
  familyDynamics: {
    summary: string;
    alignmentLevel: "aligned" | "mixed" | "fragmented";
    keyDynamics: string[];
  };
  accountabilityStructures: {
    name: string;
    status: "active" | "inconsistent" | "inactive";
    notes?: string;
  }[];
  transitionRisks: string[];
  readinessLevel: "early" | "emerging" | "adequate" | "fragile";
  readinessScore: number;
  readinessNotes?: string;
}

interface ContinuityTransitionPanelProps {
  familyId: string;
  isProvider?: boolean;
}

const READINESS_CONFIG: Record<ContinuityData["readinessLevel"], {
  label: string;
  color: string;
  bgColor: string;
  description: string;
}> = {
  early: {
    label: "Early",
    color: "text-blue-700 dark:text-blue-400",
    bgColor: "bg-blue-500/10 border-blue-500/20",
    description: "Foundation being established. Continue building stability before considering transitions.",
  },
  emerging: {
    label: "Emerging",
    color: "text-amber-700 dark:text-amber-400",
    bgColor: "bg-amber-500/10 border-amber-500/20",
    description: "Positive patterns forming. Some structures need strengthening before step-down.",
  },
  adequate: {
    label: "Adequate",
    color: "text-green-700 dark:text-green-400",
    bgColor: "bg-green-500/10 border-green-500/20",
    description: "Core structures in place. May be ready for careful transition with continued support.",
  },
  fragile: {
    label: "Fragile",
    color: "text-red-700 dark:text-red-400",
    bgColor: "bg-red-500/10 border-red-500/20",
    description: "Stability indicators weakening. Focus on reinforcing current support before any changes.",
  },
};

const ALIGNMENT_CONFIG: Record<ContinuityData["familyDynamics"]["alignmentLevel"], {
  label: string;
  color: string;
}> = {
  aligned: { label: "Aligned", color: "text-green-600" },
  mixed: { label: "Mixed", color: "text-amber-600" },
  fragmented: { label: "Fragmented", color: "text-red-600" },
};

const STRUCTURE_STATUS_CONFIG: Record<ContinuityData["accountabilityStructures"][0]["status"], {
  icon: typeof CheckCircle;
  color: string;
}> = {
  active: { icon: CheckCircle, color: "text-green-600" },
  inconsistent: { icon: AlertTriangle, color: "text-amber-600" },
  inactive: { icon: XCircle, color: "text-red-600" },
};

// Derive continuity data from FIIS analysis
function deriveContinuityData(
  analysisData: {
    pattern_signals?: Array<{ signal_type: string; description: string }>;
    input_summary?: Record<string, unknown>;
    what_to_watch?: string[];
  } | null
): ContinuityData {
  const inputSummary = analysisData?.input_summary || {};
  const patternSignals = analysisData?.pattern_signals || [];
  const whatToWatch = analysisData?.what_to_watch || [];
  
  // Extract transition readiness if available
  const transitionReadiness = inputSummary.transition_readiness as {
    readiness_level?: string;
    current_phase_mastery?: number;
    strengths_demonstrated?: string[];
    areas_needing_development?: string[];
    transition_risks?: string[];
  } | undefined;

  // Extract compliance trends
  const complianceTrends = inputSummary.compliance_trends as {
    meeting_attendance?: string;
    boundary_adherence?: string;
    financial_transparency?: string;
    check_in_reliability?: string;
  } | undefined;

  // Derive what's working from positive signals and strengths
  const whatsWorking: string[] = [];
  const positiveSignals = patternSignals.filter(s => 
    s.signal_type.includes("respected") || 
    s.signal_type.includes("consistent") ||
    s.signal_type.includes("aligned") ||
    s.signal_type.includes("stable") ||
    s.signal_type.includes("progress")
  );
  positiveSignals.forEach(s => whatsWorking.push(s.description));
  
  if (transitionReadiness?.strengths_demonstrated) {
    whatsWorking.push(...transitionReadiness.strengths_demonstrated);
  }
  
  // Add defaults if empty
  if (whatsWorking.length === 0) {
    if (complianceTrends?.meeting_attendance === "consistent") {
      whatsWorking.push("Consistent meeting attendance pattern");
    }
    if (complianceTrends?.boundary_adherence === "strong" || complianceTrends?.boundary_adherence === "good") {
      whatsWorking.push("Boundaries being respected and maintained");
    }
  }

  // Derive what destabilizes from negative signals and areas needing development
  const whatDestabilizes: string[] = [];
  const negativeSignals = patternSignals.filter(s => 
    s.signal_type.includes("violation") || 
    s.signal_type.includes("volatile") ||
    s.signal_type.includes("manipulation") ||
    s.signal_type.includes("enabling") ||
    s.signal_type.includes("splitting")
  );
  negativeSignals.forEach(s => whatDestabilizes.push(s.description));
  
  if (transitionReadiness?.areas_needing_development) {
    whatDestabilizes.push(...transitionReadiness.areas_needing_development);
  }

  // Add from what to watch
  whatToWatch.slice(0, 2).forEach(w => {
    if (!whatDestabilizes.includes(w)) {
      whatDestabilizes.push(w);
    }
  });

  // Derive family dynamics
  const familySignals = patternSignals.filter(s => 
    s.signal_type.includes("family") || s.signal_type.includes("enabling")
  );
  let alignmentLevel: ContinuityData["familyDynamics"]["alignmentLevel"] = "aligned";
  if (familySignals.some(s => s.signal_type.includes("splitting"))) {
    alignmentLevel = "fragmented";
  } else if (familySignals.some(s => s.signal_type.includes("enabling")) || familySignals.length > 0) {
    alignmentLevel = "mixed";
  }

  const familyDynamics = {
    summary: alignmentLevel === "aligned" 
      ? "Family members appear to be working together with consistent messaging."
      : alignmentLevel === "mixed"
      ? "Some variation in family approach. May benefit from alignment discussion."
      : "Significant differences in family approach observed. Coordination needed.",
    alignmentLevel,
    keyDynamics: familySignals.map(s => s.description).slice(0, 3),
  };

  // Derive accountability structures
  const accountabilityStructures: ContinuityData["accountabilityStructures"] = [];
  
  accountabilityStructures.push({
    name: "Meeting Attendance",
    status: complianceTrends?.meeting_attendance === "consistent" ? "active" 
      : complianceTrends?.meeting_attendance === "inconsistent" ? "inconsistent" 
      : complianceTrends?.meeting_attendance === "declining" ? "inactive"
      : "active",
  });

  accountabilityStructures.push({
    name: "Boundary Framework",
    status: complianceTrends?.boundary_adherence === "strong" || complianceTrends?.boundary_adherence === "good" ? "active"
      : complianceTrends?.boundary_adherence === "mixed" ? "inconsistent"
      : complianceTrends?.boundary_adherence === "weak" ? "inactive"
      : "active",
  });

  accountabilityStructures.push({
    name: "Check-in Reliability",
    status: complianceTrends?.check_in_reliability === "reliable" ? "active"
      : complianceTrends?.check_in_reliability === "inconsistent" ? "inconsistent"
      : complianceTrends?.check_in_reliability === "unreliable" ? "inactive"
      : "active",
  });

  accountabilityStructures.push({
    name: "Financial Transparency",
    status: complianceTrends?.financial_transparency === "transparent" ? "active"
      : complianceTrends?.financial_transparency === "selective" ? "inconsistent"
      : complianceTrends?.financial_transparency === "opaque" ? "inactive"
      : "active",
  });

  // Derive transition risks
  const transitionRisks = transitionReadiness?.transition_risks || [];
  if (transitionRisks.length === 0) {
    if (alignmentLevel === "fragmented") {
      transitionRisks.push("Family alignment needs strengthening before transition");
    }
    if (accountabilityStructures.some(s => s.status === "inactive")) {
      transitionRisks.push("Some accountability structures require activation");
    }
    if (whatDestabilizes.length > 2) {
      transitionRisks.push("Multiple destabilizing factors present");
    }
  }

  // Derive readiness level
  let readinessLevel: ContinuityData["readinessLevel"] = "early";
  const readinessLevelMap: Record<string, ContinuityData["readinessLevel"]> = {
    "not_ready": "early",
    "early_preparation": "early",
    "preparing": "emerging",
    "nearly_ready": "adequate",
    "ready": "adequate",
  };
  
  if (transitionReadiness?.readiness_level) {
    readinessLevel = readinessLevelMap[transitionReadiness.readiness_level] || "early";
  } else {
    // Calculate based on structures
    const activeCount = accountabilityStructures.filter(s => s.status === "active").length;
    const inactiveCount = accountabilityStructures.filter(s => s.status === "inactive").length;
    
    if (inactiveCount >= 2 || whatDestabilizes.length > 3) {
      readinessLevel = "fragile";
    } else if (activeCount >= 3 && whatsWorking.length >= 2) {
      readinessLevel = "adequate";
    } else if (activeCount >= 2) {
      readinessLevel = "emerging";
    } else {
      readinessLevel = "early";
    }
  }

  // Calculate readiness score
  const readinessScore = transitionReadiness?.current_phase_mastery 
    || (readinessLevel === "adequate" ? 75 : readinessLevel === "emerging" ? 50 : readinessLevel === "fragile" ? 25 : 35);

  return {
    whatsWorking: whatsWorking.slice(0, 5),
    whatDestabilizes: whatDestabilizes.slice(0, 5),
    familyDynamics,
    accountabilityStructures,
    transitionRisks: transitionRisks.slice(0, 4),
    readinessLevel,
    readinessScore,
  };
}

export function ContinuityTransitionPanel({ familyId, isProvider = false }: ContinuityTransitionPanelProps) {
  const [data, setData] = useState<ContinuityData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const { data: analysisData } = await supabase
          .from("fiis_pattern_analyses")
          .select("pattern_signals, input_summary, what_to_watch")
          .eq("family_id", familyId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (analysisData) {
          const derived = deriveContinuityData({
            pattern_signals: analysisData.pattern_signals as Array<{ signal_type: string; description: string }>,
            input_summary: analysisData.input_summary as Record<string, unknown>,
            what_to_watch: analysisData.what_to_watch as string[],
          });
          setData(derived);
        } else {
          // Set default empty state
          setData(deriveContinuityData(null));
        }
      } catch (error) {
        console.error("Error fetching continuity data:", error);
        setData(deriveContinuityData(null));
      } finally {
        setIsLoading(false);
      }
    };

    if (familyId) {
      fetchData();
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

  if (!data) {
    return null;
  }

  const readinessConfig = READINESS_CONFIG[data.readinessLevel];
  const alignmentConfig = ALIGNMENT_CONFIG[data.familyDynamics.alignmentLevel];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-muted-foreground" />
            Continuity & Transition Readiness
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs">
                  <p className="text-xs">
                    Helps prevent care resets by identifying what to preserve during 
                    step-down decisions, sober living placement, or post-discharge planning.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Badge className={`${readinessConfig.bgColor} ${readinessConfig.color} border`}>
            {readinessConfig.label}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Readiness Indicator Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Transition Readiness</span>
            <span className={readinessConfig.color}>{data.readinessScore}%</span>
          </div>
          <Progress value={data.readinessScore} className="h-2" />
          <p className="text-xs text-muted-foreground italic">
            {readinessConfig.description}
          </p>
        </div>

        <Accordion type="multiple" defaultValue={["working", "structures"]} className="space-y-2">
          {/* What's Working */}
          <AccordionItem value="working" className="border rounded-lg px-3">
            <AccordionTrigger className="py-3 hover:no-underline">
              <div className="flex items-center gap-2 text-sm font-medium">
                <CheckCircle className="h-4 w-4 text-green-600" />
                What's Working (Persist)
                {data.whatsWorking.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {data.whatsWorking.length}
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-3">
              {data.whatsWorking.length > 0 ? (
                <ul className="space-y-1.5">
                  {data.whatsWorking.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Heart className="h-3.5 w-3.5 mt-0.5 text-green-500 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Continue observations to identify stabilizing factors.
                </p>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* What Destabilizes */}
          <AccordionItem value="destabilizes" className="border rounded-lg px-3">
            <AccordionTrigger className="py-3 hover:no-underline">
              <div className="flex items-center gap-2 text-sm font-medium">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                What Destabilizes (Avoid)
                {data.whatDestabilizes.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {data.whatDestabilizes.length}
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-3">
              {data.whatDestabilizes.length > 0 ? (
                <ul className="space-y-1.5">
                  {data.whatDestabilizes.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <XCircle className="h-3.5 w-3.5 mt-0.5 text-amber-500 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  No destabilizing patterns identified at this time.
                </p>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* Family Dynamics */}
          <AccordionItem value="dynamics" className="border rounded-lg px-3">
            <AccordionTrigger className="py-3 hover:no-underline">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Users className="h-4 w-4 text-blue-600" />
                Family Dynamics Snapshot
                <Badge variant="outline" className={`text-xs ${alignmentConfig.color}`}>
                  {alignmentConfig.label}
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-3 space-y-2">
              <p className="text-sm">{data.familyDynamics.summary}</p>
              {data.familyDynamics.keyDynamics.length > 0 && (
                <ul className="space-y-1 mt-2">
                  {data.familyDynamics.keyDynamics.map((dynamic, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                      <ArrowRight className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      {dynamic}
                    </li>
                  ))}
                </ul>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* Accountability Structures */}
          <AccordionItem value="structures" className="border rounded-lg px-3">
            <AccordionTrigger className="py-3 hover:no-underline">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Shield className="h-4 w-4 text-purple-600" />
                Accountability Structures
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-3">
              <div className="grid grid-cols-2 gap-2">
                {data.accountabilityStructures.map((structure, i) => {
                  const statusConfig = STRUCTURE_STATUS_CONFIG[structure.status];
                  const StatusIcon = statusConfig.icon;
                  return (
                    <div 
                      key={i} 
                      className="flex items-center gap-2 p-2 rounded-md bg-muted/50 text-sm"
                    >
                      <StatusIcon className={`h-3.5 w-3.5 ${statusConfig.color} flex-shrink-0`} />
                      <span className="truncate">{structure.name}</span>
                    </div>
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Transition Risks */}
          {data.transitionRisks.length > 0 && (
            <AccordionItem value="risks" className="border rounded-lg px-3 border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
              <AccordionTrigger className="py-3 hover:no-underline">
                <div className="flex items-center gap-2 text-sm font-medium text-amber-800 dark:text-amber-300">
                  <TrendingUp className="h-4 w-4" />
                  Transition Risk Indicators
                  <Badge variant="outline" className="text-xs border-amber-300 text-amber-700">
                    {data.transitionRisks.length}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-3">
                <ul className="space-y-1.5">
                  {data.transitionRisks.map((risk, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-400">
                      <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                      <span>{risk}</span>
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>

        {/* Use Cases Footer */}
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium">Useful for:</span> Step-down decisions • Sober living placement • Post-discharge planning
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
