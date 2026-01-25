import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  Building2,
  CheckCircle,
  FileText,
  Home,
  Loader2,
  Plus,
  Save,
  Shield,
  Stethoscope,
  Target,
  Trash2,
  TrendingUp,
  Users,
  X,
} from "lucide-react";

interface TransitionSummaryFormProps {
  familyId: string;
  userId: string;
  sobrietyDays: number;
  resetCount: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const PHASE_OPTIONS = [
  { value: "detox", label: "Detox", icon: AlertTriangle },
  { value: "residential_treatment", label: "Residential Treatment", icon: Building2 },
  { value: "partial_hospitalization", label: "Partial Hospitalization (PHP)", icon: Stethoscope },
  { value: "intensive_outpatient", label: "Intensive Outpatient (IOP)", icon: Users },
  { value: "outpatient", label: "Outpatient", icon: TrendingUp },
  { value: "sober_living", label: "Sober Living", icon: Home },
  { value: "independent", label: "Independent Living", icon: CheckCircle },
];

export function TransitionSummaryForm({
  familyId,
  userId,
  sobrietyDays,
  resetCount,
  onSuccess,
  onCancel,
}: TransitionSummaryFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [fromPhase, setFromPhase] = useState("");
  const [toPhase, setToPhase] = useState("");
  const [treatmentProgressSummary, setTreatmentProgressSummary] = useState("");
  const [strengths, setStrengths] = useState<string[]>([]);
  const [newStrength, setNewStrength] = useState("");
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [newFocusArea, setNewFocusArea] = useState("");
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [newRecommendation, setNewRecommendation] = useState("");
  const [medicationsNotes, setMedicationsNotes] = useState("");
  const [supportSystemNotes, setSupportSystemNotes] = useState("");
  const [riskFactors, setRiskFactors] = useState<string[]>([]);
  const [newRiskFactor, setNewRiskFactor] = useState("");
  const [protectiveFactors, setProtectiveFactors] = useState<string[]>([]);
  const [newProtectiveFactor, setNewProtectiveFactor] = useState("");
  const [readinessScore, setReadinessScore] = useState(70);
  const [milestones, setMilestones] = useState<string[]>([]);
  const [newMilestone, setNewMilestone] = useState("");
  const [shareWithNextProvider, setShareWithNextProvider] = useState(true);

  const addToList = (
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    value: string,
    setValue: React.Dispatch<React.SetStateAction<string>>
  ) => {
    if (value.trim()) {
      setList([...list, value.trim()]);
      setValue("");
    }
  };

  const removeFromList = (
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    index: number
  ) => {
    setList(list.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!fromPhase || !toPhase) {
      toast({
        title: "Missing Information",
        description: "Please select both the current and next care phases",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("transition_summaries")
        .insert({
          user_id: userId,
          family_id: familyId,
          from_phase: fromPhase as "detox" | "residential_treatment" | "partial_hospitalization" | "intensive_outpatient" | "outpatient" | "sober_living" | "independent",
          to_phase: toPhase as "detox" | "residential_treatment" | "partial_hospitalization" | "intensive_outpatient" | "outpatient" | "sober_living" | "independent",
          sobriety_days_at_transition: sobrietyDays,
          total_reset_count: resetCount,
          treatment_progress_summary: treatmentProgressSummary || null,
          strengths_identified: strengths.length > 0 ? strengths : null,
          areas_for_continued_focus: focusAreas.length > 0 ? focusAreas : null,
          aftercare_recommendations: recommendations.length > 0 ? recommendations : null,
          medications_notes: medicationsNotes || null,
          support_system_notes: supportSystemNotes || null,
          risk_factors: riskFactors.length > 0 ? riskFactors : null,
          protective_factors: protectiveFactors.length > 0 ? protectiveFactors : null,
          transition_readiness_score: readinessScore,
          milestones_achieved: milestones.length > 0 ? milestones : null,
          created_by: user.id,
          is_shared_with_next_provider: shareWithNextProvider,
        });

      if (error) throw error;

      toast({
        title: "Transition Summary Created",
        description: "The structured summary has been saved successfully",
      });

      onSuccess?.();
    } catch (error) {
      console.error("Error creating transition summary:", error);
      toast({
        title: "Error",
        description: "Failed to create transition summary",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Create Transition Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Document the client's progress, strengths, and recommendations as they transition 
            to their next level of care.
          </p>
          
          {/* Sobriety snapshot */}
          <div className="flex gap-4 p-3 rounded-lg bg-muted/50 border">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{sobrietyDays}</div>
              <div className="text-xs text-muted-foreground">Days Sober</div>
            </div>
            {resetCount > 0 && (
              <div className="text-center border-l pl-4">
                <div className="text-2xl font-bold text-muted-foreground">{resetCount}</div>
                <div className="text-xs text-muted-foreground">Reset Count</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Phase Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Care Phase Transition</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Completing Phase</label>
              <Select value={fromPhase} onValueChange={setFromPhase}>
                <SelectTrigger>
                  <SelectValue placeholder="Select current phase..." />
                </SelectTrigger>
                <SelectContent>
                  {PHASE_OPTIONS.map((phase) => {
                    const Icon = phase.icon;
                    return (
                      <SelectItem key={phase.value} value={phase.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {phase.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Transitioning To</label>
              <Select value={toPhase} onValueChange={setToPhase}>
                <SelectTrigger>
                  <SelectValue placeholder="Select next phase..." />
                </SelectTrigger>
                <SelectContent>
                  {PHASE_OPTIONS.map((phase) => {
                    const Icon = phase.icon;
                    return (
                      <SelectItem key={phase.value} value={phase.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {phase.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Treatment Progress */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Treatment Progress Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={treatmentProgressSummary}
            onChange={(e) => setTreatmentProgressSummary(e.target.value)}
            placeholder="Summarize the client's overall progress during this phase of treatment..."
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Strengths & Focus Areas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Strengths Identified
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={newStrength}
                onChange={(e) => setNewStrength(e.target.value)}
                placeholder="Add a strength..."
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addToList(strengths, setStrengths, newStrength, setNewStrength))}
              />
              <Button 
                size="icon" 
                variant="outline"
                onClick={() => addToList(strengths, setStrengths, newStrength, setNewStrength)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {strengths.map((item, i) => (
                <Badge key={i} variant="secondary" className="gap-1">
                  {item}
                  <X 
                    className="h-3 w-3 cursor-pointer hover:text-destructive" 
                    onClick={() => removeFromList(strengths, setStrengths, i)}
                  />
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-amber-600" />
              Areas for Continued Focus
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={newFocusArea}
                onChange={(e) => setNewFocusArea(e.target.value)}
                placeholder="Add a focus area..."
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addToList(focusAreas, setFocusAreas, newFocusArea, setNewFocusArea))}
              />
              <Button 
                size="icon" 
                variant="outline"
                onClick={() => addToList(focusAreas, setFocusAreas, newFocusArea, setNewFocusArea)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {focusAreas.map((item, i) => (
                <Badge key={i} variant="outline" className="gap-1 border-amber-300 text-amber-700">
                  {item}
                  <X 
                    className="h-3 w-3 cursor-pointer hover:text-destructive" 
                    onClick={() => removeFromList(focusAreas, setFocusAreas, i)}
                  />
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Aftercare Recommendations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={newRecommendation}
              onChange={(e) => setNewRecommendation(e.target.value)}
              placeholder="Add a recommendation..."
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addToList(recommendations, setRecommendations, newRecommendation, setNewRecommendation))}
            />
            <Button 
              size="icon" 
              variant="outline"
              onClick={() => addToList(recommendations, setRecommendations, newRecommendation, setNewRecommendation)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {recommendations.map((item, i) => (
              <Badge key={i} variant="secondary" className="gap-1">
                {item}
                <X 
                  className="h-3 w-3 cursor-pointer hover:text-destructive" 
                  onClick={() => removeFromList(recommendations, setRecommendations, i)}
                />
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Risk & Protective Factors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              Risk Factors
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={newRiskFactor}
                onChange={(e) => setNewRiskFactor(e.target.value)}
                placeholder="Add a risk factor..."
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addToList(riskFactors, setRiskFactors, newRiskFactor, setNewRiskFactor))}
              />
              <Button 
                size="icon" 
                variant="outline"
                onClick={() => addToList(riskFactors, setRiskFactors, newRiskFactor, setNewRiskFactor)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {riskFactors.map((item, i) => (
                <Badge key={i} variant="outline" className="gap-1 border-red-300 text-red-700">
                  {item}
                  <X 
                    className="h-3 w-3 cursor-pointer hover:text-destructive" 
                    onClick={() => removeFromList(riskFactors, setRiskFactors, i)}
                  />
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-600" />
              Protective Factors
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={newProtectiveFactor}
                onChange={(e) => setNewProtectiveFactor(e.target.value)}
                placeholder="Add a protective factor..."
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addToList(protectiveFactors, setProtectiveFactors, newProtectiveFactor, setNewProtectiveFactor))}
              />
              <Button 
                size="icon" 
                variant="outline"
                onClick={() => addToList(protectiveFactors, setProtectiveFactors, newProtectiveFactor, setNewProtectiveFactor)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {protectiveFactors.map((item, i) => (
                <Badge key={i} variant="secondary" className="gap-1 bg-green-100 text-green-700">
                  {item}
                  <X 
                    className="h-3 w-3 cursor-pointer hover:text-destructive" 
                    onClick={() => removeFromList(protectiveFactors, setProtectiveFactors, i)}
                  />
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transition Readiness */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Transition Readiness Score</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Slider
              value={[readinessScore]}
              onValueChange={(v) => setReadinessScore(v[0])}
              max={100}
              min={0}
              step={5}
              className="flex-1"
            />
            <div className="w-16 text-right">
              <span className={`text-2xl font-bold ${
                readinessScore >= 80 ? "text-green-600" :
                readinessScore >= 60 ? "text-amber-600" :
                "text-red-600"
              }`}>
                {readinessScore}%
              </span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Rate the client's overall readiness to transition to the next level of care
          </p>
        </CardContent>
      </Card>

      {/* Additional Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Medications Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={medicationsNotes}
              onChange={(e) => setMedicationsNotes(e.target.value)}
              placeholder="Current medications, changes, or recommendations..."
              rows={3}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Support System Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={supportSystemNotes}
              onChange={(e) => setSupportSystemNotes(e.target.value)}
              placeholder="Family involvement, sponsor status, community connections..."
              rows={3}
            />
          </CardContent>
        </Card>
      </div>

      {/* Milestones */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Milestones Achieved During This Phase</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={newMilestone}
              onChange={(e) => setNewMilestone(e.target.value)}
              placeholder="Add a milestone..."
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addToList(milestones, setMilestones, newMilestone, setNewMilestone))}
            />
            <Button 
              size="icon" 
              variant="outline"
              onClick={() => addToList(milestones, setMilestones, newMilestone, setNewMilestone)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {milestones.map((item, i) => (
              <Badge key={i} variant="secondary" className="gap-1">
                {item}
                <X 
                  className="h-3 w-3 cursor-pointer hover:text-destructive" 
                  onClick={() => removeFromList(milestones, setMilestones, i)}
                />
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sharing Toggle */}
      <Card>
        <CardContent className="pt-6">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={shareWithNextProvider}
              onChange={(e) => setShareWithNextProvider(e.target.checked)}
              className="mt-1"
            />
            <div>
              <span className="font-medium">Share with next provider</span>
              <p className="text-sm text-muted-foreground">
                Allow the receiving provider to view this transition summary during handoff
              </p>
            </div>
          </label>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        {onCancel && (
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button onClick={handleSubmit} disabled={isSubmitting || !fromPhase || !toPhase}>
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Transition Summary
        </Button>
      </div>
    </div>
  );
}
