import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Brain,
  Plus,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle,
  Eye,
  MessageSquare,
  Calendar,
  Loader2,
  Sparkles,
  RefreshCw,
  Clock,
  Activity,
  FileText,
  Shield,
  Heart,
  UserPlus,
  Target,
  TrendingUp as ArrowUp,
  TrendingDown as ArrowDown,
  BarChart3,
  ClipboardCheck,
  Gauge,
  ArrowRight,
  Zap,
  Stethoscope,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { format, formatDistanceToNow } from "date-fns";
import { RecoveryTrajectoryPanel } from "@/components/RecoveryTrajectoryPanel";
import { PatternShiftAlerts } from "@/components/PatternShiftAlerts";
import { ContinuityTransitionPanel } from "@/components/ContinuityTransitionPanel";
import { FIISFeedbackDialog } from "@/components/FIISFeedbackDialog";

interface FIISTabProps {
  familyId: string;
  members: Array<{ user_id: string; full_name: string }>;
  excludeUserIds?: string[];
  onView?: () => void;
  isModerator?: boolean;
}

interface Observation {
  id: string;
  user_id: string;
  observation_type: string;
  content: string;
  occurred_at: string;
  created_at: string;
  user_name?: string;
}

interface AutoEvent {
  id: string;
  user_id: string;
  event_type: string;
  event_data: unknown;
  occurred_at: string;
  user_name?: string;
}

interface PatternSignal {
  signal_type: string;
  description: string;
  occurrences?: number;
  confidence: string;
  priority?: string;
  one_year_impact?: "supports_goal" | "neutral" | "threatens_goal";
}

interface AnonymizedPattern {
  id: string;
  family_id: string;
  pattern_type: string;
  pattern_description: string;
  severity: string;
  detected_at: string;
  is_acknowledged: boolean;
  created_at: string;
  member_label: string;
}

interface PredictiveIndicator {
  indicator_type: "positive" | "negative" | "neutral";
  indicator: string;
  impact_level: "minor" | "moderate" | "significant";
  recommendation: string;
}

interface OneYearGoal {
  current_days: number;
  days_remaining: number;
  progress_percentage: number;
  current_phase: string;
  likelihood_assessment: string;
  likelihood_reasoning?: string;
}

interface RiskTrajectory {
  direction: "improving" | "stable" | "declining";
  trend_description: string;
  contributing_factors: string[];
  projected_outcome: string;
}

interface ComplianceTrends {
  overall_compliance: "excellent" | "good" | "moderate" | "poor" | "critical";
  meeting_attendance: "consistent" | "mostly_consistent" | "inconsistent" | "declining" | "absent";
  check_in_reliability: "reliable" | "mostly_reliable" | "inconsistent" | "unreliable";
  boundary_adherence: "strong" | "good" | "mixed" | "weak" | "none";
  financial_transparency: "transparent" | "mostly_transparent" | "selective" | "opaque";
  trend_direction: "improving" | "stable" | "declining";
  compliance_notes?: string;
}

interface TransitionReadiness {
  readiness_level: "not_ready" | "early_preparation" | "preparing" | "nearly_ready" | "ready";
  current_phase_mastery: number;
  strengths_demonstrated: string[];
  areas_needing_development: string[];
  recommended_focus: string[];
  estimated_readiness_timeline?: string;
  transition_risks?: string[];
}

interface ProviderClinicalInsight {
  insight_category: 
    | "boundary_consistency"
    | "help_seeking_latency"
    | "intervention_consideration"
    | "accountability_trajectory"
    | "engagement_pattern"
    | "family_alignment"
    | "communication_frequency"
    | "financial_transparency";
  pattern_summary: string;
  trajectory_direction: "improving" | "stable" | "declining";
  magnitude?: number;
  observation_period?: string;
  clinical_consideration: string;
  action_question: string;
  review_priority: "routine_monitoring" | "warrants_discussion" | "priority_review";
}

// Legacy interface for backward compatibility
interface ProviderClinicalAlert {
  alert_category: 
    | "boundary_consistency"
    | "help_seeking_latency"
    | "intervention_pressure"
    | "accountability_trend"
    | "engagement_pattern"
    | "family_alignment"
    | "communication_quality"
    | "financial_pattern";
  metric_description: string;
  trend_direction: "improving" | "stable" | "declining";
  percentage_change?: number;
  time_period?: string;
  clinical_implication: string;
  suggested_intervention: string;
  urgency: "routine_review" | "attention_needed" | "priority_action";
}

interface PatternAnalysis {
  what_seeing: string;
  pattern_signals: PatternSignal[];
  risk_level?: number;
  risk_level_name?: string;
  contextual_framing: string;
  clarifying_questions: string[];
  what_to_watch: string[];
  recommend_professional?: boolean;
  professional_recommendation_reason?: string;
  positive_reinforcement?: string[];
  // One-year goal fields
  one_year_goal?: OneYearGoal;
  one_year_likelihood?: string;
  one_year_likelihood_reasoning?: string;
  predictive_indicators?: PredictiveIndicator[];
  goal_focused_suggestions?: string[];
  behaviors_to_reinforce?: string[];
  behaviors_to_address?: string[];
  // New trajectory and readiness fields
  risk_trajectory?: RiskTrajectory;
  compliance_trends?: ComplianceTrends;
  transition_readiness?: TransitionReadiness;
  // Provider-only insights (new format) and legacy alerts
  provider_clinical_insights?: ProviderClinicalInsight[];
  provider_clinical_alerts?: ProviderClinicalAlert[];
}

const OBSERVATION_TYPES = [
  { value: "behavior", label: "Behavior Observed", icon: Eye },
  { value: "conversation", label: "Conversation", icon: MessageSquare },
  { value: "decision", label: "Decision Made", icon: CheckCircle },
  { value: "boundary", label: "Boundary Stated/Enforced", icon: AlertTriangle },
  { value: "consequence", label: "Event or Consequence (or lack thereof)", icon: Activity },
  { value: "emotional_climate", label: "Emotional Climate Change", icon: TrendingUp },
  { value: "calm_period", label: "Period of Calm", icon: CheckCircle },
  { value: "concern", label: "Moment of Concern", icon: AlertTriangle },
  { value: "boundary_failure", label: "Failure to Enforce Boundaries", icon: AlertTriangle },
] as const;

const SIGNAL_ICONS: Record<string, typeof TrendingUp> = {
  // Legacy signal types
  repetition: RefreshCw,
  escalation: TrendingUp,
  stabilization: Minus,
  mixed_signals: Activity,
  improvement: CheckCircle,
  regression: TrendingDown,
  // New comprehensive signal types
  boundary_respected: CheckCircle,
  boundary_exception: AlertTriangle,
  boundary_violation: AlertTriangle,
  financial_aligned: CheckCircle,
  financial_exception: AlertTriangle,
  financial_manipulation: AlertTriangle,
  recovery_consistent: CheckCircle,
  recovery_inconsistent: RefreshCw,
  recovery_performative: Activity,
  emotional_stable: Minus,
  emotional_reactive: TrendingUp,
  emotional_volatile: TrendingUp,
  family_aligned: CheckCircle,
  family_splitting: TrendingDown,
  enabling_pattern: AlertTriangle,
  progress_indicator: CheckCircle,
  regression_indicator: TrendingDown,
  safety_concern: AlertTriangle,
};

const SIGNAL_COLORS: Record<string, string> = {
  // Legacy signal types
  repetition: "bg-amber-500/20 text-amber-700 border-amber-500/30",
  escalation: "bg-red-500/20 text-red-700 border-red-500/30",
  stabilization: "bg-blue-500/20 text-blue-700 border-blue-500/30",
  mixed_signals: "bg-purple-500/20 text-purple-700 border-purple-500/30",
  improvement: "bg-green-500/20 text-green-700 border-green-500/30",
  regression: "bg-red-500/20 text-red-700 border-red-500/30",
  // New comprehensive signal types - Positive (green)
  boundary_respected: "bg-green-500/20 text-green-700 border-green-500/30",
  financial_aligned: "bg-green-500/20 text-green-700 border-green-500/30",
  recovery_consistent: "bg-green-500/20 text-green-700 border-green-500/30",
  emotional_stable: "bg-green-500/20 text-green-700 border-green-500/30",
  family_aligned: "bg-green-500/20 text-green-700 border-green-500/30",
  progress_indicator: "bg-green-500/20 text-green-700 border-green-500/30",
  // Warning (amber/yellow)
  boundary_exception: "bg-amber-500/20 text-amber-700 border-amber-500/30",
  financial_exception: "bg-amber-500/20 text-amber-700 border-amber-500/30",
  recovery_inconsistent: "bg-amber-500/20 text-amber-700 border-amber-500/30",
  recovery_performative: "bg-amber-500/20 text-amber-700 border-amber-500/30",
  emotional_reactive: "bg-amber-500/20 text-amber-700 border-amber-500/30",
  // Critical (red)
  boundary_violation: "bg-red-500/20 text-red-700 border-red-500/30",
  financial_manipulation: "bg-red-500/20 text-red-700 border-red-500/30",
  emotional_volatile: "bg-red-500/20 text-red-700 border-red-500/30",
  family_splitting: "bg-red-500/20 text-red-700 border-red-500/30",
  enabling_pattern: "bg-red-500/20 text-red-700 border-red-500/30",
  regression_indicator: "bg-red-500/20 text-red-700 border-red-500/30",
  safety_concern: "bg-red-500/20 text-red-700 border-red-500/30",
};

const RISK_LEVEL_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: typeof CheckCircle }> = {
  stable: { label: "Stable", color: "text-green-700 dark:text-green-400", bgColor: "bg-green-500/20 border-green-500/30", icon: CheckCircle },
  early_drift: { label: "Early Drift", color: "text-amber-700 dark:text-amber-400", bgColor: "bg-amber-500/20 border-amber-500/30", icon: AlertTriangle },
  pattern_formation: { label: "Pattern Formation", color: "text-orange-700 dark:text-orange-400", bgColor: "bg-orange-500/20 border-orange-500/30", icon: TrendingUp },
  system_strain: { label: "System Strain", color: "text-red-700 dark:text-red-400", bgColor: "bg-red-500/20 border-red-500/30", icon: TrendingUp },
  critical: { label: "Critical Risk", color: "text-red-800 dark:text-red-300", bgColor: "bg-red-600/30 border-red-600/50", icon: AlertTriangle },
};

export function FIISTab({ familyId, members, excludeUserIds = [], onView, isModerator = false }: FIISTabProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [observations, setObservations] = useState<Observation[]>([]);
  const [autoEvents, setAutoEvents] = useState<AutoEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<PatternAnalysis | null>(null);

  // Disclaimer acknowledgment
  const [hasAcknowledgedDisclaimer, setHasAcknowledgedDisclaimer] = useState<boolean | null>(null);
  const [isAcknowledging, setIsAcknowledging] = useState(false);

  // Anonymized patterns for family members
  const [anonymizedPatterns, setAnonymizedPatterns] = useState<AnonymizedPattern[]>([]);

  // New observation form
  const [showForm, setShowForm] = useState(false);
  const [newType, setNewType] = useState<string>("");
  const [newContent, setNewContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch anonymized patterns for non-moderators
  useEffect(() => {
    const fetchAnonymizedPatterns = async () => {
      if (!familyId || isModerator) return;
      
      try {
        const { data, error } = await supabase
          .rpc('get_anonymized_family_patterns', { _family_id: familyId });
        
        if (error) throw error;
        setAnonymizedPatterns((data as AnonymizedPattern[]) || []);
      } catch (error) {
        console.error('Error fetching anonymized patterns:', error);
      }
    };
    
    fetchAnonymizedPatterns();
  }, [familyId, isModerator]);

  // Check if user has acknowledged the disclaimer
  useEffect(() => {
    const checkDisclaimerAcknowledgment = async () => {
      if (!user || !familyId) return;
      
      const { data, error } = await supabase
        .from("fiis_disclaimer_acknowledgments")
        .select("id")
        .eq("user_id", user.id)
        .eq("family_id", familyId)
        .maybeSingle();
      
      if (error) {
        console.error("Error checking disclaimer acknowledgment:", error);
        setHasAcknowledgedDisclaimer(false);
        return;
      }
      
      setHasAcknowledgedDisclaimer(!!data);
    };
    
    checkDisclaimerAcknowledgment();
  }, [user, familyId]);

  const handleAcknowledgeDisclaimer = async () => {
    if (!user || !familyId) return;
    
    setIsAcknowledging(true);
    try {
      const { error } = await supabase
        .from("fiis_disclaimer_acknowledgments")
        .insert({
          user_id: user.id,
          family_id: familyId,
          user_agent: navigator.userAgent,
        });
      
      if (error) throw error;
      
      setHasAcknowledgedDisclaimer(true);
      toast({
        title: "Disclaimer Acknowledged",
        description: "Thank you. You won't see this disclaimer again.",
      });
    } catch (error) {
      console.error("Error acknowledging disclaimer:", error);
      toast({
        title: "Error",
        description: "Failed to save acknowledgment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAcknowledging(false);
    }
  };

  useEffect(() => {
    if (familyId) {
      fetchData();
      subscribeToChanges();
    }
  }, [familyId]);

  // Mark as viewed when component mounts
  useEffect(() => {
    if (onView) {
      onView();
    }
  }, [onView]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch observations
      const { data: obsData, error: obsError } = await supabase
        .from("fiis_observations")
        .select("*")
        .eq("family_id", familyId)
        .order("occurred_at", { ascending: false })
        .limit(100);

      if (obsError) throw obsError;

      // Fetch auto events
      const { data: eventData, error: eventError } = await supabase
        .from("fiis_auto_events")
        .select("*")
        .eq("family_id", familyId)
        .order("occurred_at", { ascending: false })
        .limit(100);

      if (eventError) throw eventError;

      // Add user names and filter out professional moderators
      const obsWithNames = (obsData || [])
        .filter((obs) => !excludeUserIds.includes(obs.user_id))
        .map((obs) => ({
          ...obs,
          user_name: members.find((m) => m.user_id === obs.user_id)?.full_name || "Unknown",
        }));

      const eventsWithNames = (eventData || [])
        .filter((event) => !excludeUserIds.includes(event.user_id))
        .map((event) => ({
          ...event,
          user_name: members.find((m) => m.user_id === event.user_id)?.full_name || "Unknown",
        }));

      setObservations(obsWithNames);
      setAutoEvents(eventsWithNames);

      // Fetch latest analysis
      const { data: analysisData } = await supabase
        .from("fiis_pattern_analyses")
        .select("*")
        .eq("family_id", familyId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (analysisData) {
        const signals = Array.isArray(analysisData.pattern_signals) 
          ? (analysisData.pattern_signals as unknown as PatternSignal[]) 
          : [];
        const inputSummary = analysisData.input_summary as Record<string, unknown> | null;
        setAnalysis({
          what_seeing: analysisData.what_seeing || "",
          pattern_signals: signals,
          risk_level: (inputSummary?.risk_level as number) || 0,
          risk_level_name: (inputSummary?.risk_level_name as string) || "stable",
          contextual_framing: analysisData.contextual_framing || "",
          clarifying_questions: (analysisData.clarifying_questions as string[]) || [],
          what_to_watch: (analysisData.what_to_watch as string[]) || [],
          recommend_professional: (inputSummary?.recommend_professional as boolean) || false,
        });
      }
    } catch (error) {
      console.error("Error fetching FIIS data:", error);
      toast({
        title: "Error",
        description: "Failed to load intelligence data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const subscribeToChanges = () => {
    const channel = supabase
      .channel(`fiis-${familyId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "fiis_observations", filter: `family_id=eq.${familyId}` },
        () => fetchData()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "fiis_auto_events", filter: `family_id=eq.${familyId}` },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSubmitObservation = async () => {
    if (!newType || !newContent.trim() || !user) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("fiis_observations").insert({
        family_id: familyId,
        user_id: user.id,
        observation_type: newType,
        content: newContent.trim(),
        occurred_at: new Date().toISOString(),
      });

      if (error) throw error;

      toast({
        title: "Observation Received",
        description: "Thank you. Your anonymous observation has been securely recorded and will be included in the analysis.",
      });

      setNewType("");
      setNewContent("");
      setShowForm(false);
      fetchData();
    } catch (error) {
      console.error("Error saving observation:", error);
      toast({
        title: "Error",
        description: "Failed to save observation",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAnalyze = async () => {
    if (!user) return;

    setIsAnalyzing(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.access_token) throw new Error("Not authenticated");

      const response = await supabase.functions.invoke("fiis-analyze", {
        body: {
          familyId,
          observations: observations.slice(0, 50).map((o) => ({
            type: o.observation_type,
            content: o.content,
            occurred_at: o.occurred_at,
            user_name: o.user_name,
          })),
          autoEvents: autoEvents.slice(0, 50).map((e) => ({
            type: e.event_type,
            data: e.event_data,
            occurred_at: e.occurred_at,
            user_name: e.user_name,
          })),
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Analysis failed");
      }

      setAnalysis(response.data);
      toast({
        title: "Analysis complete",
        description: "Pattern analysis has been updated.",
      });
    } catch (error) {
      console.error("Analysis error:", error);
      toast({
        title: "Analysis failed",
        description: error instanceof Error ? error.message : "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const deleteObservation = async (id: string) => {
    try {
      const { error } = await supabase.from("fiis_observations").delete().eq("id", id);
      if (error) throw error;
      fetchData();
      toast({ title: "Deleted", description: "Observation removed." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    }
  };

  // Combine and sort timeline
  const timeline = [
    ...observations.map((o) => ({ ...o, _type: "observation" as const })),
    ...autoEvents.map((e) => ({ ...e, _type: "auto" as const })),
  ].sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime());

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <Card className="overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500" />
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <CardTitle className="flex items-center gap-2 text-lg font-display">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center shrink-0">
                <Brain className="h-4 w-4 text-violet-600" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline">Family Intervention Intelligence System</span>
                  <span className="sm:hidden">FIIS</span>
                </div>
                <span className="text-[10px] font-normal text-muted-foreground tracking-wide">Patent Pending</span>
              </div>
            </CardTitle>
            <div className="flex gap-2 sm:ml-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowForm(!showForm)}
                className="flex-1 sm:flex-none text-xs sm:text-sm"
              >
                <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
                <span className="hidden sm:inline">Log Observation</span>
                <span className="sm:hidden">Log</span>
              </Button>
              <Button
                size="sm"
                onClick={handleAnalyze}
                disabled={isAnalyzing || (observations.length === 0 && autoEvents.length === 0)}
                className="flex-1 sm:flex-none bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-xs sm:text-sm"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 animate-spin" />
                    <span className="hidden sm:inline">Analyzing...</span>
                    <span className="sm:hidden">...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
                    <span className="hidden sm:inline">Analyze Patterns</span>
                    <span className="sm:hidden">Analyze</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Log what you observe—wins and worries alike—in everyday language. FIIS combines your notes with check-ins, financial requests, and family activity to spot patterns and surface early warning signs.
          </p>
          <div className="p-3 rounded-lg bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800">
            <p className="text-xs text-violet-700 dark:text-violet-300">
              <strong>🔒 All entries are anonymous.</strong> Honest observations about everyone's behavior—including your own—create the clearest picture for accountability and growth. The more truthful the input, the more helpful the insights.
            </p>
          </div>
          {/* Disclaimer - only show if not acknowledged */}
          {hasAcknowledgedDisclaimer === false && (
            <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
              <p className="text-sm text-amber-800 dark:text-amber-300 mb-3">
                <strong>⚖️ Important Disclaimer:</strong> FIIS is a tool designed to support family growth and recovery awareness. It does not provide medical, psychiatric, or legal advice, and is not a substitute for professional care. If you or a family member need immediate help, please contact a licensed professional or emergency services.
              </p>
              <Button 
                size="sm" 
                onClick={handleAcknowledgeDisclaimer}
                disabled={isAcknowledging}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                {isAcknowledging ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "I Understand and Acknowledge"
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recovery Trajectory Panel */}
      {(observations.length > 0 || autoEvents.length > 0) && (
        <RecoveryTrajectoryPanel 
          data={{
            observations: observations.map(o => ({
              occurred_at: o.occurred_at,
              observation_type: o.observation_type,
            })),
            autoEvents: autoEvents.map(e => ({
              occurred_at: e.occurred_at,
              event_type: e.event_type,
              event_data: e.event_data,
            })),
            riskTrajectory: analysis?.risk_trajectory,
          }}
          analysisRiskLevel={analysis?.risk_level}
          analysisRiskLevelName={analysis?.risk_level_name}
        />
      )}

      {/* Pattern Shift Alerts - Early warnings without alarmism */}
      <PatternShiftAlerts familyId={familyId} isProvider={isModerator} />

      {/* Continuity & Transition Readiness - Prevents care resets */}
      <ContinuityTransitionPanel familyId={familyId} isProvider={isModerator} />

      {/* New Observation Form */}
      {showForm && (
        <Card className="border-violet-500/30 bg-violet-50/50 dark:bg-violet-950/20">
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Type of Observation</label>
                <Select value={newType} onValueChange={setNewType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {OBSERVATION_TYPES.map((type) => {
                      const Icon = type.icon;
                      return (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">What did you observe?</label>
              <Textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Describe what happened, when it happened, and what followed..."
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Be specific about facts, timing, and observable behaviors. Avoid interpretations. <span className="text-violet-600 dark:text-violet-400 font-medium">Your entry is anonymous—honest reporting about all involved improves everyone's opportunity for growth.</span>
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleSubmitObservation}
                disabled={!newType || !newContent.trim() || isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-1" />
                )}
                Add Observation
              </Button>
              <Button variant="ghost" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pattern Analysis */}
      {analysis && (
        <Card className="border-violet-500/20">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <Brain className="h-4 w-4 text-violet-600" />
                  Pattern Analysis
                </CardTitle>
                {/* Risk Level Indicator */}
                {analysis.risk_level_name && (
                  <div className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 ${RISK_LEVEL_CONFIG[analysis.risk_level_name]?.bgColor || "bg-muted"}`}>
                    {(() => {
                      const config = RISK_LEVEL_CONFIG[analysis.risk_level_name || "stable"];
                      const RiskIcon = config?.icon || Shield;
                      return (
                        <>
                          <RiskIcon className={`h-4 w-4 ${config?.color || ""}`} />
                          <span className={`text-sm font-medium ${config?.color || ""}`}>
                            Level {analysis.risk_level}: {config?.label || analysis.risk_level_name}
                          </span>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
              {/* Moderator Feedback Button */}
              {isModerator && (
                <FIISFeedbackDialog
                  familyId={familyId}
                  originalRiskLevel={analysis.risk_level || 0}
                  originalLikelihood={analysis.one_year_likelihood || "uncertain"}
                  originalWhatSeeing={analysis.what_seeing || ""}
                  onFeedbackSubmitted={() => {
                    toast({
                      title: "Thank you!",
                      description: "Your feedback helps FIIS improve its analysis accuracy.",
                    });
                  }}
                />
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* One-Year Goal Progress Section */}
            {analysis.one_year_goal && analysis.one_year_goal.current_days > 0 && (
              <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold flex items-center gap-2 text-primary">
                    <Target className="h-4 w-4" />
                    One-Year Goal Progress
                  </h4>
                  <Badge 
                    variant={
                      analysis.one_year_likelihood === "very_likely" || analysis.one_year_likelihood === "likely" 
                        ? "default" 
                        : analysis.one_year_likelihood === "at_risk" || analysis.one_year_likelihood === "critical_risk"
                        ? "destructive"
                        : "secondary"
                    }
                    className="capitalize"
                  >
                    {analysis.one_year_likelihood?.replace(/_/g, " ") || "Assessing..."}
                  </Badge>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Day {analysis.one_year_goal.current_days} of 365</span>
                      <span>{analysis.one_year_goal.progress_percentage}% Complete</span>
                    </div>
                    <Progress value={analysis.one_year_goal.progress_percentage} className="h-3" />
                  </div>
                  
                  <div className="flex flex-wrap gap-3 text-xs">
                    <div className="flex items-center gap-1 px-2 py-1 bg-background rounded-md border">
                      <span className="font-medium">{analysis.one_year_goal.current_days}</span>
                      <span className="text-muted-foreground">days sober</span>
                    </div>
                    {analysis.one_year_goal.days_remaining > 0 && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-background rounded-md border">
                        <span className="font-medium">{analysis.one_year_goal.days_remaining}</span>
                        <span className="text-muted-foreground">days to one year</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1 px-2 py-1 bg-background rounded-md border">
                      <span className="text-muted-foreground">{analysis.one_year_goal.current_phase}</span>
                    </div>
                  </div>
                  
                  {analysis.one_year_likelihood_reasoning && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {analysis.one_year_likelihood_reasoning}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Predictive Indicators */}
            {analysis.predictive_indicators && analysis.predictive_indicators.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  Predictive Indicators
                </h4>
                <div className="grid gap-2">
                  {analysis.predictive_indicators.map((indicator, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-lg border ${
                        indicator.indicator_type === "positive"
                          ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800"
                          : indicator.indicator_type === "negative"
                          ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800"
                          : "bg-muted/50 border-border"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {indicator.indicator_type === "positive" ? (
                          <ArrowUp className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                        ) : indicator.indicator_type === "negative" ? (
                          <ArrowDown className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                        ) : (
                          <Minus className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-sm font-medium ${
                              indicator.indicator_type === "positive" 
                                ? "text-green-700 dark:text-green-400"
                                : indicator.indicator_type === "negative"
                                ? "text-red-700 dark:text-red-400"
                                : ""
                            }`}>
                              {indicator.indicator}
                            </span>
                            <Badge variant="outline" className="text-[10px] capitalize">
                              {indicator.impact_level} impact
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{indicator.recommendation}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Goal-Focused Suggestions */}
            {analysis.goal_focused_suggestions && analysis.goal_focused_suggestions.length > 0 && (
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2 text-primary">
                  <Target className="h-4 w-4" />
                  Suggestions to Reach One Year
                </h4>
                <ul className="list-disc list-inside space-y-1">
                  {analysis.goal_focused_suggestions.map((suggestion, i) => (
                    <li key={i} className="text-sm">{suggestion}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Behaviors to Reinforce */}
            {analysis.behaviors_to_reinforce && analysis.behaviors_to_reinforce.length > 0 && (
              <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                <h4 className="text-sm font-medium mb-2 text-green-800 dark:text-green-300 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Behaviors Supporting One-Year Goal
                </h4>
                <ul className="list-disc list-inside space-y-1">
                  {analysis.behaviors_to_reinforce.map((item, i) => (
                    <li key={i} className="text-sm text-green-700 dark:text-green-400">{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Behaviors to Address */}
            {analysis.behaviors_to_address && analysis.behaviors_to_address.length > 0 && (
              <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                <h4 className="text-sm font-medium mb-2 text-amber-800 dark:text-amber-300 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Behaviors Needing Attention
                </h4>
                <ul className="list-disc list-inside space-y-1">
                  {analysis.behaviors_to_address.map((item, i) => (
                    <li key={i} className="text-sm text-amber-700 dark:text-amber-400">{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Risk Trajectory */}
            {analysis.risk_trajectory && (
              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  Risk Trajectory
                  <Badge
                    variant={
                      analysis.risk_trajectory.direction === "improving"
                        ? "default"
                        : analysis.risk_trajectory.direction === "declining"
                        ? "destructive"
                        : "secondary"
                    }
                    className="ml-auto capitalize"
                  >
                    {analysis.risk_trajectory.direction === "improving" && <ArrowDown className="h-3 w-3 mr-1" />}
                    {analysis.risk_trajectory.direction === "declining" && <ArrowUp className="h-3 w-3 mr-1" />}
                    {analysis.risk_trajectory.direction === "stable" && <Minus className="h-3 w-3 mr-1" />}
                    {analysis.risk_trajectory.direction}
                  </Badge>
                </h4>
                <p className="text-sm mb-3">{analysis.risk_trajectory.trend_description}</p>
                {analysis.risk_trajectory.contributing_factors.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Contributing Factors:</p>
                    <div className="flex flex-wrap gap-1">
                      {analysis.risk_trajectory.contributing_factors.map((factor, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {factor}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                <div className="p-2 rounded bg-background border">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium">Projected Outcome:</span> {analysis.risk_trajectory.projected_outcome}
                  </p>
                </div>
              </div>
            )}

            {/* Compliance Trends */}
            {analysis.compliance_trends && (
              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
                  Compliance Trends
                  <Badge
                    variant={
                      analysis.compliance_trends.overall_compliance === "excellent" || analysis.compliance_trends.overall_compliance === "good"
                        ? "default"
                        : analysis.compliance_trends.overall_compliance === "poor" || analysis.compliance_trends.overall_compliance === "critical"
                        ? "destructive"
                        : "secondary"
                    }
                    className="ml-auto capitalize"
                  >
                    {analysis.compliance_trends.overall_compliance}
                  </Badge>
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                  <div className="p-2 rounded bg-background border text-center">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Meetings</p>
                    <p className={`text-xs font-medium capitalize ${
                      analysis.compliance_trends.meeting_attendance === "consistent" ? "text-green-600" :
                      analysis.compliance_trends.meeting_attendance === "absent" || analysis.compliance_trends.meeting_attendance === "declining" ? "text-red-600" :
                      "text-amber-600"
                    }`}>
                      {analysis.compliance_trends.meeting_attendance.replace(/_/g, " ")}
                    </p>
                  </div>
                  <div className="p-2 rounded bg-background border text-center">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Check-ins</p>
                    <p className={`text-xs font-medium capitalize ${
                      analysis.compliance_trends.check_in_reliability === "reliable" ? "text-green-600" :
                      analysis.compliance_trends.check_in_reliability === "unreliable" ? "text-red-600" :
                      "text-amber-600"
                    }`}>
                      {analysis.compliance_trends.check_in_reliability.replace(/_/g, " ")}
                    </p>
                  </div>
                  <div className="p-2 rounded bg-background border text-center">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Boundaries</p>
                    <p className={`text-xs font-medium capitalize ${
                      analysis.compliance_trends.boundary_adherence === "strong" || analysis.compliance_trends.boundary_adherence === "good" ? "text-green-600" :
                      analysis.compliance_trends.boundary_adherence === "weak" || analysis.compliance_trends.boundary_adherence === "none" ? "text-red-600" :
                      "text-amber-600"
                    }`}>
                      {analysis.compliance_trends.boundary_adherence}
                    </p>
                  </div>
                  <div className="p-2 rounded bg-background border text-center">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Finances</p>
                    <p className={`text-xs font-medium capitalize ${
                      analysis.compliance_trends.financial_transparency === "transparent" ? "text-green-600" :
                      analysis.compliance_trends.financial_transparency === "opaque" ? "text-red-600" :
                      "text-amber-600"
                    }`}>
                      {analysis.compliance_trends.financial_transparency.replace(/_/g, " ")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">Overall Trend:</span>
                  <Badge
                    variant={
                      analysis.compliance_trends.trend_direction === "improving" ? "default" :
                      analysis.compliance_trends.trend_direction === "declining" ? "destructive" :
                      "secondary"
                    }
                    className="capitalize"
                  >
                    {analysis.compliance_trends.trend_direction === "improving" && <ArrowUp className="h-3 w-3 mr-1" />}
                    {analysis.compliance_trends.trend_direction === "declining" && <ArrowDown className="h-3 w-3 mr-1" />}
                    {analysis.compliance_trends.trend_direction === "stable" && <Minus className="h-3 w-3 mr-1" />}
                    {analysis.compliance_trends.trend_direction}
                  </Badge>
                </div>
                {analysis.compliance_trends.compliance_notes && (
                  <p className="text-xs text-muted-foreground mt-2">{analysis.compliance_trends.compliance_notes}</p>
                )}
              </div>
            )}

            {/* Transition Readiness */}
            {analysis.transition_readiness && (
              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Gauge className="h-4 w-4 text-muted-foreground" />
                  Transition Readiness
                  <Badge
                    variant={
                      analysis.transition_readiness.readiness_level === "ready" || analysis.transition_readiness.readiness_level === "nearly_ready"
                        ? "default"
                        : analysis.transition_readiness.readiness_level === "not_ready"
                        ? "destructive"
                        : "secondary"
                    }
                    className="ml-auto capitalize"
                  >
                    {analysis.transition_readiness.readiness_level.replace(/_/g, " ")}
                  </Badge>
                </h4>
                
                {/* Phase Mastery Progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Current Phase Mastery</span>
                    <span className="font-medium">{analysis.transition_readiness.current_phase_mastery}%</span>
                  </div>
                  <Progress value={analysis.transition_readiness.current_phase_mastery} className="h-2" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  {/* Strengths */}
                  {analysis.transition_readiness.strengths_demonstrated.length > 0 && (
                    <div className="p-2 rounded bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                      <p className="text-xs font-medium text-green-700 dark:text-green-400 mb-1 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" /> Strengths Demonstrated
                      </p>
                      <ul className="list-disc list-inside text-xs text-green-600 dark:text-green-500 space-y-0.5">
                        {analysis.transition_readiness.strengths_demonstrated.map((strength, i) => (
                          <li key={i}>{strength}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Areas to Develop */}
                  {analysis.transition_readiness.areas_needing_development.length > 0 && (
                    <div className="p-2 rounded bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                      <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-1 flex items-center gap-1">
                        <Zap className="h-3 w-3" /> Areas for Growth
                      </p>
                      <ul className="list-disc list-inside text-xs text-amber-600 dark:text-amber-500 space-y-0.5">
                        {analysis.transition_readiness.areas_needing_development.map((area, i) => (
                          <li key={i}>{area}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Recommended Focus */}
                {analysis.transition_readiness.recommended_focus.length > 0 && (
                  <div className="p-2 rounded bg-primary/5 border border-primary/20 mb-3">
                    <p className="text-xs font-medium text-primary mb-1 flex items-center gap-1">
                      <ArrowRight className="h-3 w-3" /> Recommended Focus
                    </p>
                    <ul className="list-disc list-inside text-xs space-y-0.5">
                      {analysis.transition_readiness.recommended_focus.map((focus, i) => (
                        <li key={i}>{focus}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex flex-wrap gap-3 text-xs">
                  {analysis.transition_readiness.estimated_readiness_timeline && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-background rounded-md border">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Est. Timeline:</span>
                      <span className="font-medium">{analysis.transition_readiness.estimated_readiness_timeline}</span>
                    </div>
                  )}
                </div>

                {/* Transition Risks */}
                {analysis.transition_readiness.transition_risks && analysis.transition_readiness.transition_risks.length > 0 && (
                  <div className="mt-3 p-2 rounded bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                    <p className="text-xs font-medium text-red-700 dark:text-red-400 mb-1 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> Transition Risks
                    </p>
                    <ul className="list-disc list-inside text-xs text-red-600 dark:text-red-500 space-y-0.5">
                      {analysis.transition_readiness.transition_risks.map((risk, i) => (
                        <li key={i}>{risk}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Provider Clinical Insights Panel - Only visible to moderators */}
            {isModerator && (analysis.provider_clinical_insights?.length || analysis.provider_clinical_alerts?.length) ? (
              <div className="p-4 rounded-lg bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-950/30 dark:to-blue-950/30 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold flex items-center gap-2 text-slate-800 dark:text-slate-300">
                    <Stethoscope className="h-4 w-4" />
                    Clinical Insights
                    <Badge variant="outline" className="ml-2 text-[10px] border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                      Provider Only
                    </Badge>
                  </h4>
                </div>
                
                {/* Design Principles Banner */}
                <div className="mb-4 p-3 rounded-lg bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-[10px] text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-1">
                      <BarChart3 className="h-3 w-3" />
                      <span className="font-medium">Pattern</span>
                      <span className="text-slate-400">{">"}</span>
                      <span>Events</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Activity className="h-3 w-3" />
                      <span className="font-medium">Signal</span>
                      <span className="text-slate-400">{">"}</span>
                      <span>Sentiment</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      <span className="font-medium">Actionable</span>
                      <span className="text-slate-400">{">"}</span>
                      <span>Interesting</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      <span>Trajectory-Based</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      <span>Clinically Neutral</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* New format: Clinical Insights */}
                  {analysis.provider_clinical_insights?.map((insight, i) => (
                    <div
                      key={`insight-${i}`}
                      className={`p-3 rounded-lg border bg-background ${
                        insight.review_priority === "priority_review"
                          ? "border-amber-300 dark:border-amber-700"
                          : insight.review_priority === "warrants_discussion"
                          ? "border-blue-300 dark:border-blue-700"
                          : "border-border"
                      }`}
                    >
                      {/* Header row */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            variant="outline"
                            className={`text-[10px] capitalize ${
                              insight.trajectory_direction === "improving"
                                ? "border-green-300 text-green-700 dark:border-green-700 dark:text-green-400"
                                : insight.trajectory_direction === "declining"
                                ? "border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-400"
                                : "border-muted-foreground/30"
                            }`}
                          >
                            {insight.trajectory_direction === "improving" && <ArrowUp className="h-2.5 w-2.5 mr-1" />}
                            {insight.trajectory_direction === "declining" && <ArrowDown className="h-2.5 w-2.5 mr-1" />}
                            {insight.trajectory_direction === "stable" && <Minus className="h-2.5 w-2.5 mr-1" />}
                            {insight.trajectory_direction} trajectory
                          </Badge>
                          <Badge variant="secondary" className="text-[10px] capitalize">
                            {insight.insight_category.replace(/_/g, " ")}
                          </Badge>
                          {insight.observation_period && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Clock className="h-2.5 w-2.5" />
                              {insight.observation_period}
                            </span>
                          )}
                        </div>
                        <Badge
                          variant="secondary"
                          className={`text-[10px] capitalize shrink-0 ${
                            insight.review_priority === "priority_review"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                              : insight.review_priority === "warrants_discussion"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                              : ""
                          }`}
                        >
                          {insight.review_priority.replace(/_/g, " ")}
                        </Badge>
                      </div>
                      
                      {/* Pattern Summary */}
                      <p className="text-sm font-medium mb-2 flex items-start gap-2">
                        <BarChart3 className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                        <span>
                          {insight.pattern_summary}
                          {insight.magnitude !== undefined && (
                            <span className={`ml-1 text-xs ${
                              insight.magnitude > 0 
                                ? "text-green-600 dark:text-green-400" 
                                : insight.magnitude < 0 
                                ? "text-amber-600 dark:text-amber-400"
                                : ""
                            }`}>
                              ({insight.magnitude > 0 ? "+" : ""}{insight.magnitude}%)
                            </span>
                          )}
                        </span>
                      </p>
                      
                      {/* Clinical Consideration & Action Question */}
                      <div className="grid gap-2 text-xs">
                        <div className="p-2 rounded bg-muted/50">
                          <span className="text-muted-foreground font-medium flex items-center gap-1 mb-1">
                            <Eye className="h-3 w-3" />
                            Clinical Consideration:
                          </span>
                          <span>{insight.clinical_consideration}</span>
                        </div>
                        <div className="p-2 rounded bg-primary/5 border border-primary/10">
                          <span className="text-primary font-medium flex items-center gap-1 mb-1">
                            <Target className="h-3 w-3" />
                            What might I do differently?
                          </span>
                          <span className="text-primary/80 italic">{insight.action_question}</span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Legacy format: Clinical Alerts (backward compatibility) */}
                  {!analysis.provider_clinical_insights?.length && analysis.provider_clinical_alerts?.map((alert, i) => (
                    <div
                      key={`alert-${i}`}
                      className={`p-3 rounded-lg border bg-background ${
                        alert.urgency === "priority_action"
                          ? "border-amber-300 dark:border-amber-700"
                          : alert.urgency === "attention_needed"
                          ? "border-blue-300 dark:border-blue-700"
                          : "border-border"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            variant="outline"
                            className={`text-[10px] capitalize ${
                              alert.trend_direction === "improving"
                                ? "border-green-300 text-green-700 dark:border-green-700 dark:text-green-400"
                                : alert.trend_direction === "declining"
                                ? "border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-400"
                                : "border-muted-foreground/30"
                            }`}
                          >
                            {alert.trend_direction === "improving" && <ArrowUp className="h-2.5 w-2.5 mr-1" />}
                            {alert.trend_direction === "declining" && <ArrowDown className="h-2.5 w-2.5 mr-1" />}
                            {alert.trend_direction === "stable" && <Minus className="h-2.5 w-2.5 mr-1" />}
                            {alert.trend_direction} trajectory
                          </Badge>
                          <Badge variant="secondary" className="text-[10px] capitalize">
                            {alert.alert_category.replace(/_/g, " ")}
                          </Badge>
                          {alert.time_period && (
                            <span className="text-[10px] text-muted-foreground">
                              {alert.time_period}
                            </span>
                          )}
                        </div>
                        <Badge
                          variant="secondary"
                          className={`text-[10px] capitalize shrink-0 ${
                            alert.urgency === "priority_action"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                              : alert.urgency === "attention_needed"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                              : ""
                          }`}
                        >
                          {alert.urgency === "priority_action" ? "priority review" : 
                           alert.urgency === "attention_needed" ? "warrants discussion" : 
                           "routine monitoring"}
                        </Badge>
                      </div>
                      
                      <p className="text-sm font-medium mb-2 flex items-start gap-2">
                        <BarChart3 className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                        <span>
                          {alert.metric_description}
                          {alert.percentage_change !== undefined && (
                            <span className={`ml-1 text-xs ${
                              alert.percentage_change > 0 
                                ? "text-green-600 dark:text-green-400" 
                                : alert.percentage_change < 0 
                                ? "text-amber-600 dark:text-amber-400"
                                : ""
                            }`}>
                              ({alert.percentage_change > 0 ? "+" : ""}{alert.percentage_change}%)
                            </span>
                          )}
                        </span>
                      </p>
                      
                      <div className="grid gap-2 text-xs">
                        <div className="p-2 rounded bg-muted/50">
                          <span className="text-muted-foreground font-medium">Clinical Consideration: </span>
                          <span>{alert.clinical_implication}</span>
                        </div>
                        <div className="p-2 rounded bg-primary/5 border border-primary/10">
                          <span className="text-primary font-medium">What might I do differently? </span>
                          <span className="text-primary/80 italic">{alert.suggested_intervention}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Professional Moderator Recommendation */}
            {analysis.recommend_professional && (
              <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                <h4 className="text-sm font-semibold mb-2 text-red-800 dark:text-red-300 flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Professional Support Recommended
                </h4>
                <p className="text-sm text-red-700 dark:text-red-400 mb-3">
                  {analysis.professional_recommendation_reason || 
                    "Inviting a professional moderator is not a sign of failure. It is often the most effective way to protect the path to one year, preserve relationships, restore clarity, and reduce long-term harm."}
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-red-300 dark:border-red-700 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Request Professional Moderator
                </Button>
              </div>
            )}

            {/* Positive Reinforcement (legacy support) */}
            {analysis.positive_reinforcement && analysis.positive_reinforcement.length > 0 && !analysis.behaviors_to_reinforce?.length && (
              <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                <h4 className="text-sm font-medium mb-2 text-green-800 dark:text-green-300 flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  Healthy Behaviors to Reinforce
                </h4>
                <ul className="list-disc list-inside space-y-1">
                  {analysis.positive_reinforcement.map((item, i) => (
                    <li key={i} className="text-sm text-green-700 dark:text-green-400">{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* What I'm Seeing */}
            <div className="p-4 rounded-lg bg-muted/50">
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Eye className="h-4 w-4 text-muted-foreground" />
                What I'm Seeing
              </h4>
              <p className="text-sm">{analysis.what_seeing}</p>
            </div>

            {/* Pattern Signals */}
            {analysis.pattern_signals.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Pattern Signals</h4>
                <div className="flex flex-wrap gap-2">
                  {analysis.pattern_signals.map((signal, i) => {
                    const Icon = SIGNAL_ICONS[signal.signal_type] || Activity;
                    const colorClass = SIGNAL_COLORS[signal.signal_type] || "bg-muted";
                    return (
                      <div
                        key={i}
                        className={`px-3 py-2 rounded-lg border ${colorClass}`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className="h-3 w-3" />
                          <span className="text-xs font-medium capitalize">
                            {signal.signal_type.replace(/_/g, " ")}
                          </span>
                          {signal.occurrences && signal.occurrences > 1 && (
                            <Badge variant="secondary" className="text-[10px] px-1">
                              ×{signal.occurrences}
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-[10px] px-1">
                            {signal.confidence}
                          </Badge>
                          {signal.priority && signal.priority !== "low" && (
                            <Badge 
                              variant={signal.priority === "critical" ? "destructive" : "secondary"} 
                              className="text-[10px] px-1"
                            >
                              {signal.priority}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs">{signal.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Context */}
            {analysis.contextual_framing && (
              <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                <h4 className="text-sm font-medium mb-2 text-amber-800 dark:text-amber-300">
                  Context
                </h4>
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  {analysis.contextual_framing}
                </p>
              </div>
            )}

            {/* Questions to Clarify */}
            {analysis.clarifying_questions.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  Questions to Consider
                </h4>
                <ul className="list-disc list-inside space-y-1">
                  {analysis.clarifying_questions.map((q, i) => (
                    <li key={i} className="text-sm text-muted-foreground">{q}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* What to Watch */}
            {analysis.what_to_watch.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  What to Watch
                </h4>
                <ul className="list-disc list-inside space-y-1">
                  {analysis.what_to_watch.map((w, i) => (
                    <li key={i} className="text-sm text-muted-foreground">{w}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Timeline - Only visible to moderators */}
      {isModerator ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Activity Timeline
              <Badge variant="secondary" className="ml-2">
                {timeline.length} events
              </Badge>
              <Badge variant="outline" className="ml-1 text-xs">
                Moderator Only
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {timeline.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground">No observations or events recorded yet.</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Start logging observations to build a picture over time.
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-3">
                  {timeline.map((item) => {
                    const isManual = item._type === "observation";
                    const obs = isManual ? (item as Observation) : null;
                    const event = !isManual ? (item as AutoEvent) : null;

                    return (
                      <div
                        key={item.id}
                        className={`p-3 rounded-lg border ${
                          isManual
                            ? "bg-violet-50/50 dark:bg-violet-950/20 border-violet-200 dark:border-violet-800"
                            : "bg-muted/50 border-border"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {isManual ? (
                                <Badge variant="outline" className="text-violet-600 border-violet-300 text-xs">
                                  {OBSERVATION_TYPES.find((t) => t.value === obs?.observation_type)?.label || obs?.observation_type}
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs">
                                  {event?.event_type.replace(/_/g, " ")}
                                </Badge>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(item.occurred_at), { addSuffix: true })}
                              </span>
                            </div>
                            <p className="text-sm">
                              {isManual
                                ? obs?.content
                                : formatEventDescription(event?.event_type || "", (event?.event_data as Record<string, unknown>) || {})}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {isManual ? "Anonymous observation" : event?.user_name}
                              {" · "}
                              {format(new Date(item.occurred_at), "MMM d, yyyy h:mm a")}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              Family Patterns
              {anonymizedPatterns.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {anonymizedPatterns.length} detected
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {anonymizedPatterns.length === 0 ? (
              <div className="text-center py-6">
                <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  No behavioral patterns have been detected yet. Your observations are recorded anonymously and securely to help identify patterns over time.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground mb-3">
                  These patterns have been detected in your family. Individual identities are protected—focus on the behavior, not the person.
                </p>
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-2">
                    {anonymizedPatterns.map((pattern) => {
                      const severityColors: Record<string, string> = {
                        warning: "bg-red-500/20 text-red-700 border-red-500/30",
                        concern: "bg-amber-500/20 text-amber-700 border-amber-500/30",
                        observation: "bg-blue-500/20 text-blue-700 border-blue-500/30",
                      };
                      const colorClass = severityColors[pattern.severity] || "bg-muted";
                      
                      return (
                        <div
                          key={pattern.id}
                          className={`p-3 rounded-lg border ${colorClass}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-xs capitalize">
                                  {pattern.pattern_type.replace(/_/g, " ")}
                                </Badge>
                                <Badge 
                                  variant={pattern.severity === "warning" ? "destructive" : "secondary"} 
                                  className="text-xs capitalize"
                                >
                                  {pattern.severity}
                                </Badge>
                                {pattern.is_acknowledged && (
                                  <Badge variant="outline" className="text-xs text-green-600">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Acknowledged
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm">{pattern.pattern_description}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {pattern.member_label} · {formatDistanceToNow(new Date(pattern.detected_at), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function formatEventDescription(type: string, data: Record<string, unknown>): string {
  switch (type) {
    case "checkin":
      return `Checked in at ${data.meeting_name || data.meeting_type || "meeting"}${data.address ? ` (${data.address})` : ""}`;
    case "checkout":
      return "Checked out from meeting";
    case "missed_checkout":
      return "Missed scheduled checkout from meeting";
    case "financial_request":
      return `Requested $${data.amount} for ${data.reason}`;
    case "financial_approved":
      return `Financial request for $${data.amount} was approved`;
    case "financial_denied":
      return `Financial request for $${data.amount} was denied`;
    case "message_filtered":
      return "A message was filtered for inappropriate content";
    case "boundary_proposed":
      return `Proposed boundary: "${data.content}"`;
    case "boundary_approved":
      return "Boundary was approved";
    case "location_request":
      return "Location check-in was requested";
    case "location_shared":
      return `Shared location${data.address ? ` at ${data.address}` : ""}`;
    default:
      return type.replace(/_/g, " ");
  }
}
