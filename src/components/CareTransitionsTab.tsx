import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowRight,
  Building2,
  Calendar,
  CheckCircle,
  FileText,
  Loader2,
  Plus,
  TrendingUp,
} from "lucide-react";
import { format } from "date-fns";
import { CarePhaseManager } from "./CarePhaseManager";
import { ProviderHandoffManager } from "./ProviderHandoffManager";
import { TransitionSummaryForm } from "./TransitionSummaryForm";

interface CareTransitionsTabProps {
  familyId: string;
  recoveringUserId?: string;
  isModerator?: boolean;
  isOrgAdmin?: boolean;
  currentOrgId?: string;
  sobrietyDays?: number;
  resetCount?: number;
}

interface TransitionSummary {
  id: string;
  from_phase: string;
  to_phase: string;
  sobriety_days_at_transition: number;
  treatment_progress_summary: string | null;
  strengths_identified: string[] | null;
  transition_readiness_score: number | null;
  created_at: string;
}

const PHASE_LABELS: Record<string, string> = {
  detox: "Detox",
  residential_treatment: "Residential Treatment",
  partial_hospitalization: "PHP",
  intensive_outpatient: "IOP",
  outpatient: "Outpatient",
  sober_living: "Sober Living",
  independent: "Independent",
};

export function CareTransitionsTab({
  familyId,
  recoveringUserId,
  isModerator = false,
  isOrgAdmin = false,
  currentOrgId,
  sobrietyDays = 0,
  resetCount = 0,
}: CareTransitionsTabProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("phases");
  const [showNewSummary, setShowNewSummary] = useState(false);
  const [summaries, setSummaries] = useState<TransitionSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const canManage = isModerator || isOrgAdmin;

  useEffect(() => {
    if (recoveringUserId) {
      fetchSummaries();
    }
  }, [familyId, recoveringUserId]);

  const fetchSummaries = async () => {
    if (!recoveringUserId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("transition_summaries")
        .select("id, from_phase, to_phase, sobriety_days_at_transition, treatment_progress_summary, strengths_identified, transition_readiness_score, created_at")
        .eq("family_id", familyId)
        .eq("user_id", recoveringUserId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSummaries(data || []);
    } catch (error) {
      console.error("Error fetching summaries:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!recoveringUserId) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <h3 className="font-medium mb-2">No Recovering Member Identified</h3>
          <p className="text-sm">
            Care transitions tracking requires an identified recovering member in the family group.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="phases" className="text-xs sm:text-sm">
            <TrendingUp className="h-4 w-4 mr-1 hidden sm:inline" />
            Care Phases
          </TabsTrigger>
          <TabsTrigger value="handoffs" className="text-xs sm:text-sm">
            <Building2 className="h-4 w-4 mr-1 hidden sm:inline" />
            Handoffs
          </TabsTrigger>
          <TabsTrigger value="summaries" className="text-xs sm:text-sm">
            <FileText className="h-4 w-4 mr-1 hidden sm:inline" />
            Summaries
          </TabsTrigger>
        </TabsList>

        <TabsContent value="phases" className="mt-4">
          <CarePhaseManager
            familyId={familyId}
            userId={recoveringUserId}
            isModerator={isModerator}
            isOrgAdmin={isOrgAdmin}
          />
        </TabsContent>

        <TabsContent value="handoffs" className="mt-4">
          <ProviderHandoffManager
            familyId={familyId}
            userId={recoveringUserId}
            currentOrgId={currentOrgId}
            isOrgAdmin={isOrgAdmin}
          />
        </TabsContent>

        <TabsContent value="summaries" className="mt-4">
          {showNewSummary ? (
            <TransitionSummaryForm
              familyId={familyId}
              userId={recoveringUserId}
              sobrietyDays={sobrietyDays}
              resetCount={resetCount}
              onSuccess={() => {
                setShowNewSummary(false);
                fetchSummaries();
              }}
              onCancel={() => setShowNewSummary(false)}
            />
          ) : (
            <div className="space-y-4">
              {canManage && (
                <Card>
                  <CardContent className="py-4">
                    <Button onClick={() => setShowNewSummary(true)} className="w-full sm:w-auto">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Transition Summary
                    </Button>
                  </CardContent>
                </Card>
              )}

              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : summaries.length > 0 ? (
                <ScrollArea className="max-h-[600px]">
                  <div className="space-y-3">
                    {summaries.map((summary) => (
                      <Card key={summary.id} className="overflow-hidden">
                        <CardHeader className="pb-2 bg-muted/30">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">
                                {PHASE_LABELS[summary.from_phase] || summary.from_phase}
                              </Badge>
                              <ArrowRight className="h-4 w-4 text-muted-foreground" />
                              <Badge>
                                {PHASE_LABELS[summary.to_phase] || summary.to_phase}
                              </Badge>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(summary.created_at), "MMM d, yyyy")}
                            </span>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-3">
                          <div className="flex gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Days Sober:</span>{" "}
                              <span className="font-medium">{summary.sobriety_days_at_transition}</span>
                            </div>
                            {summary.transition_readiness_score !== null && (
                              <div>
                                <span className="text-muted-foreground">Readiness:</span>{" "}
                                <span className={`font-medium ${
                                  summary.transition_readiness_score >= 80 ? "text-green-600" :
                                  summary.transition_readiness_score >= 60 ? "text-amber-600" :
                                  "text-red-600"
                                }`}>
                                  {summary.transition_readiness_score}%
                                </span>
                              </div>
                            )}
                          </div>
                          
                          {summary.treatment_progress_summary && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {summary.treatment_progress_summary}
                            </p>
                          )}

                          {summary.strengths_identified && summary.strengths_identified.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {summary.strengths_identified.slice(0, 3).map((strength, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  {strength}
                                </Badge>
                              ))}
                              {summary.strengths_identified.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{summary.strengths_identified.length - 3} more
                                </Badge>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No transition summaries have been created yet</p>
                    {canManage && (
                      <Button 
                        variant="link" 
                        size="sm" 
                        onClick={() => setShowNewSummary(true)}
                        className="mt-2"
                      >
                        Create the first summary
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
