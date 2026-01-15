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
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface FIISTabProps {
  familyId: string;
  members: Array<{ user_id: string; full_name: string }>;
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

export function FIISTab({ familyId, members, onView, isModerator = false }: FIISTabProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [observations, setObservations] = useState<Observation[]>([]);
  const [autoEvents, setAutoEvents] = useState<AutoEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<PatternAnalysis | null>(null);

  // New observation form
  const [showForm, setShowForm] = useState(false);
  const [newType, setNewType] = useState<string>("");
  const [newContent, setNewContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

      // Add user names
      const obsWithNames = (obsData || []).map((obs) => ({
        ...obs,
        user_name: members.find((m) => m.user_id === obs.user_id)?.full_name || "Unknown",
      }));

      const eventsWithNames = (eventData || []).map((event) => ({
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
          <div className="p-3 rounded-lg bg-muted/50 border border-border">
            <p className="text-xs text-muted-foreground">
              <strong>⚖️ Disclaimer:</strong> FIIS is a tool designed to support family growth and recovery awareness. It does not provide medical, psychiatric, or legal advice, and is not a substitute for professional care. If you or a family member need immediate help, please contact a licensed professional or emergency services.
            </p>
          </div>
        </CardContent>
      </Card>

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
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Professional Moderator Recommendation */}
            {analysis.recommend_professional && (
              <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                <h4 className="text-sm font-semibold mb-2 text-red-800 dark:text-red-300 flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Professional Support Recommended
                </h4>
                <p className="text-sm text-red-700 dark:text-red-400 mb-3">
                  {analysis.professional_recommendation_reason || 
                    "Inviting a professional moderator is not a sign of failure. It is often the most effective way to preserve relationships, restore clarity, and reduce long-term harm."}
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

            {/* Positive Reinforcement */}
            {analysis.positive_reinforcement && analysis.positive_reinforcement.length > 0 && (
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
          <CardContent className="py-6">
            <div className="text-center">
              <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                Your observations are recorded anonymously and securely. Only your family's moderator can view the activity timeline to help guide your family's recovery journey.
              </p>
            </div>
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
