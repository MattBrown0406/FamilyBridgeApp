import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { MessageSquareWarning, CheckCircle2, AlertTriangle, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FIISFeedbackDialogProps {
  analysisId?: string;
  familyId: string;
  originalRiskLevel: number;
  originalLikelihood: string;
  originalWhatSeeing: string;
  onFeedbackSubmitted?: () => void;
}

const feedbackTypes = [
  { value: "false_positive", label: "False Positive", description: "FIIS raised alarm when it shouldn't have", icon: AlertTriangle },
  { value: "false_negative", label: "False Negative", description: "FIIS missed something important", icon: X },
  { value: "wrong_severity", label: "Wrong Severity", description: "Right concern, wrong risk level", icon: AlertTriangle },
  { value: "misinterpretation", label: "Misinterpretation", description: "FIIS misunderstood the situation", icon: MessageSquareWarning },
  { value: "missing_context", label: "Missing Context", description: "FIIS lacked context that would change analysis", icon: MessageSquareWarning },
  { value: "pattern_correction", label: "Pattern Correction", description: "Specific pattern was misidentified", icon: AlertTriangle },
  { value: "reinforcement", label: "Correct Analysis", description: "FIIS was accurate (positive feedback)", icon: CheckCircle2 },
];

const riskLevelLabels: Record<number, string> = {
  0: "Stable",
  1: "Early Drift",
  2: "Pattern Formation",
  3: "System Strain",
  4: "Critical Risk",
};

const likelihoodLabels: Record<string, string> = {
  very_likely: "Very Likely",
  likely: "Likely",
  uncertain: "Uncertain",
  at_risk: "At Risk",
  critical_risk: "Critical Risk",
};

export function FIISFeedbackDialog({
  analysisId,
  familyId,
  originalRiskLevel,
  originalLikelihood,
  originalWhatSeeing,
  onFeedbackSubmitted,
}: FIISFeedbackDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackType, setFeedbackType] = useState<string>("");
  const [correctedRiskLevel, setCorrectedRiskLevel] = useState<number>(originalRiskLevel);
  const [correctedLikelihood, setCorrectedLikelihood] = useState<string>(originalLikelihood);
  const [correctionReasoning, setCorrectionReasoning] = useState("");
  const [missedPatterns, setMissedPatterns] = useState("");
  const [falsePatterns, setFalsePatterns] = useState("");
  const [clinicalContext, setClinicalContext] = useState("");
  const [recommendedKeywords, setRecommendedKeywords] = useState("");
  const [accuracyRating, setAccuracyRating] = useState<number[]>([3]);

  const handleSubmit = async () => {
    if (!feedbackType || !correctionReasoning.trim()) {
      toast.error("Please select a feedback type and provide reasoning");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("fiis_analysis_feedback").insert({
        analysis_id: analysisId || null,
        family_id: familyId,
        moderator_id: user.id,
        original_risk_level: originalRiskLevel,
        original_likelihood: originalLikelihood,
        original_what_seeing: originalWhatSeeing,
        corrected_risk_level: correctedRiskLevel,
        corrected_likelihood: correctedLikelihood,
        correction_reasoning: correctionReasoning.trim(),
        feedback_type: feedbackType,
        missed_patterns: missedPatterns.trim() ? missedPatterns.split(",").map(p => p.trim()) : null,
        false_patterns: falsePatterns.trim() ? falsePatterns.split(",").map(p => p.trim()) : null,
        clinical_context: clinicalContext.trim() || null,
        recommended_keywords: recommendedKeywords.trim() ? recommendedKeywords.split(",").map(k => k.trim().toLowerCase()) : null,
        accuracy_rating: accuracyRating[0],
      });

      if (error) throw error;

      toast.success("Feedback submitted! FIIS will learn from your correction.");
      setOpen(false);
      onFeedbackSubmitted?.();
      
      // Reset form
      setFeedbackType("");
      setCorrectedRiskLevel(originalRiskLevel);
      setCorrectedLikelihood(originalLikelihood);
      setCorrectionReasoning("");
      setMissedPatterns("");
      setFalsePatterns("");
      setClinicalContext("");
      setRecommendedKeywords("");
      setAccuracyRating([3]);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("Failed to submit feedback");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <MessageSquareWarning className="h-4 w-4" />
          Provide Feedback
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Train FIIS - Provide Feedback</DialogTitle>
          <DialogDescription>
            Help FIIS improve by correcting this analysis. Your feedback will be used to enhance future pattern detection.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Original Analysis Summary */}
          <div className="p-4 bg-muted/50 rounded-lg space-y-2">
            <h4 className="font-medium text-sm">Original FIIS Analysis</h4>
            <div className="flex gap-2 flex-wrap">
              <Badge variant="outline">Risk Level: {riskLevelLabels[originalRiskLevel]}</Badge>
              <Badge variant="outline">Likelihood: {likelihoodLabels[originalLikelihood] || originalLikelihood}</Badge>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-3">{originalWhatSeeing}</p>
          </div>

          {/* Feedback Type */}
          <div className="space-y-2">
            <Label>What type of correction is this?</Label>
            <Select value={feedbackType} onValueChange={setFeedbackType}>
              <SelectTrigger>
                <SelectValue placeholder="Select feedback type..." />
              </SelectTrigger>
              <SelectContent>
                {feedbackTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <type.icon className="h-4 w-4" />
                      <div>
                        <div className="font-medium">{type.label}</div>
                        <div className="text-xs text-muted-foreground">{type.description}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Corrected Risk Level */}
          {feedbackType && feedbackType !== "reinforcement" && (
            <div className="space-y-3">
              <Label>Corrected Risk Level: {riskLevelLabels[correctedRiskLevel]}</Label>
              <Slider
                value={[correctedRiskLevel]}
                onValueChange={(v) => setCorrectedRiskLevel(v[0])}
                min={0}
                max={4}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Stable</span>
                <span>Early Drift</span>
                <span>Pattern</span>
                <span>Strain</span>
                <span>Critical</span>
              </div>
            </div>
          )}

          {/* Corrected Likelihood */}
          {feedbackType && feedbackType !== "reinforcement" && (
            <div className="space-y-2">
              <Label>Corrected One-Year Likelihood</Label>
              <Select value={correctedLikelihood} onValueChange={setCorrectedLikelihood}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="very_likely">Very Likely</SelectItem>
                  <SelectItem value="likely">Likely</SelectItem>
                  <SelectItem value="uncertain">Uncertain</SelectItem>
                  <SelectItem value="at_risk">At Risk</SelectItem>
                  <SelectItem value="critical_risk">Critical Risk</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Correction Reasoning */}
          <div className="space-y-2">
            <Label>Explain your correction *</Label>
            <Textarea
              value={correctionReasoning}
              onChange={(e) => setCorrectionReasoning(e.target.value)}
              placeholder="Why is the original analysis incorrect? What should FIIS have understood differently?"
              rows={3}
            />
          </div>

          {/* Missed Patterns */}
          {(feedbackType === "false_negative" || feedbackType === "pattern_correction") && (
            <div className="space-y-2">
              <Label>Patterns FIIS Missed</Label>
              <Textarea
                value={missedPatterns}
                onChange={(e) => setMissedPatterns(e.target.value)}
                placeholder="Enter patterns that should have been detected (comma-separated)"
                rows={2}
              />
              <p className="text-xs text-muted-foreground">e.g., isolation behavior, boundary testing, HALT state</p>
            </div>
          )}

          {/* False Patterns */}
          {(feedbackType === "false_positive" || feedbackType === "pattern_correction") && (
            <div className="space-y-2">
              <Label>Incorrectly Identified Patterns</Label>
              <Textarea
                value={falsePatterns}
                onChange={(e) => setFalsePatterns(e.target.value)}
                placeholder="Enter patterns that were wrongly flagged (comma-separated)"
                rows={2}
              />
            </div>
          )}

          {/* Clinical Context */}
          <div className="space-y-2">
            <Label>Additional Clinical Context</Label>
            <Textarea
              value={clinicalContext}
              onChange={(e) => setClinicalContext(e.target.value)}
              placeholder="Any context FIIS should consider for similar situations in the future"
              rows={2}
            />
          </div>

          {/* Recommended Keywords */}
          <div className="space-y-2">
            <Label>Keywords to Watch For</Label>
            <Textarea
              value={recommendedKeywords}
              onChange={(e) => setRecommendedKeywords(e.target.value)}
              placeholder="Words/phrases that should trigger similar analysis (comma-separated)"
              rows={2}
            />
            <p className="text-xs text-muted-foreground">These will be added to FIIS's detection vocabulary</p>
          </div>

          {/* Accuracy Rating */}
          <div className="space-y-3">
            <Label>Overall Accuracy Rating: {accuracyRating[0]}/5</Label>
            <Slider
              value={accuracyRating}
              onValueChange={setAccuracyRating}
              min={1}
              max={5}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Very Poor</span>
              <span>Poor</span>
              <span>Okay</span>
              <span>Good</span>
              <span>Excellent</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Feedback"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}