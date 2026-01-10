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
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface FIISTabProps {
  familyId: string;
  members: Array<{ user_id: string; full_name: string }>;
  onView?: () => void;
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
  confidence: string;
}

interface PatternAnalysis {
  what_seeing: string;
  pattern_signals: PatternSignal[];
  contextual_framing: string;
  clarifying_questions: string[];
  what_to_watch: string[];
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
  repetition: RefreshCw,
  escalation: TrendingUp,
  stabilization: Minus,
  mixed_signals: Activity,
  improvement: CheckCircle,
  regression: TrendingDown,
};

const SIGNAL_COLORS: Record<string, string> = {
  repetition: "bg-amber-500/20 text-amber-700 border-amber-500/30",
  escalation: "bg-red-500/20 text-red-700 border-red-500/30",
  stabilization: "bg-blue-500/20 text-blue-700 border-blue-500/30",
  mixed_signals: "bg-purple-500/20 text-purple-700 border-purple-500/30",
  improvement: "bg-green-500/20 text-green-700 border-green-500/30",
  regression: "bg-red-500/20 text-red-700 border-red-500/30",
};

export function FIISTab({ familyId, members, onView }: FIISTabProps) {
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
        setAnalysis({
          what_seeing: analysisData.what_seeing || "",
          pattern_signals: signals,
          contextual_framing: analysisData.contextual_framing || "",
          clarifying_questions: (analysisData.clarifying_questions as string[]) || [],
          what_to_watch: (analysisData.what_to_watch as string[]) || [],
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
        title: "Observation logged",
        description: "Your observation has been recorded.",
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
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg font-display">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center">
                <Brain className="h-4 w-4 text-violet-600" />
              </div>
              <span className="hidden sm:inline">Family Intervention Intelligence System</span>
              <span className="sm:hidden">FIIS</span>
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowForm(!showForm)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Log Observation
              </Button>
              <Button
                size="sm"
                onClick={handleAnalyze}
                disabled={isAnalyzing || (observations.length === 0 && autoEvents.length === 0)}
                className="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-1" />
                    Analyze Patterns
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            FIIS is a unique and proprietary AI function of the FamilyBridge app. Log observations—both positive moments and reasons for concern. All of this data contributes to a comprehensive analysis of your family's situation. Use plain, conversational language to describe what you observe, and our AI will analyze it and provide recommendations. The system automatically tracks check-ins, financial requests, and other family activities to help identify patterns and early warning signs.
          </p>
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
                Be specific about facts, timing, and observable behaviors. Avoid interpretations.
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
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Brain className="h-4 w-4 text-violet-600" />
              Pattern Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
                          <Badge variant="outline" className="text-[10px] px-1">
                            {signal.confidence}
                          </Badge>
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

      {/* Timeline */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            Activity Timeline
            <Badge variant="secondary" className="ml-2">
              {timeline.length} events
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
                            {isManual ? `Noted by ${obs?.user_name}` : event?.user_name}
                            {" · "}
                            {format(new Date(item.occurred_at), "MMM d, yyyy h:mm a")}
                          </p>
                        </div>
                        {isManual && obs?.user_id === user?.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => deleteObservation(obs.id)}
                          >
                            ×
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
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
