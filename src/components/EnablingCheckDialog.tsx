import { useState } from 'react';
import { AlertTriangle, ArrowRight, CheckCircle, HelpCircle, LifeBuoy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  BOUNDARY_IN_FLOW_QUESTION_IDS,
  FINANCIAL_IN_FLOW_QUESTION_IDS,
  getEnablingResult,
  questionsByIds,
  type EnablingTriggerType,
} from '@/lib/enablingExercise';
import { saveEnablingCheck } from '@/hooks/useEnablingChecks';

interface EnablingCheckDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  familyId: string;
  userId: string;
  triggerType: EnablingTriggerType;
  onComplete: (resultType: 'warning' | 'caution' | 'okay') => void;
  onOpenFullExercise?: () => void;
  onFindFamilyMeeting?: () => void;
}

const questionIdsFor = (trigger: EnablingTriggerType) => {
  if (trigger === 'boundary') return BOUNDARY_IN_FLOW_QUESTION_IDS;
  if (trigger === 'financial_request') return FINANCIAL_IN_FLOW_QUESTION_IDS;
  return FINANCIAL_IN_FLOW_QUESTION_IDS;
};

export const EnablingCheckDialog = ({
  open,
  onOpenChange,
  familyId,
  userId,
  triggerType,
  onComplete,
  onOpenFullExercise,
  onFindFamilyMeeting,
}: EnablingCheckDialogProps) => {
  const questions = questionsByIds(questionIdsFor(triggerType));
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResult, setShowResult] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [resultType, setResultType] = useState<'warning' | 'caution' | 'okay'>('okay');

  const current = questions[step];
  const progress = questions.length ? ((step) / questions.length) * 100 : 0;
  const result = getEnablingResult(answers, questions, 'in_flow');

  const reset = () => {
    setStep(0);
    setAnswers({});
    setShowResult(false);
    setSaveError(null);
    setResultType('okay');
  };

  const persistAndShow = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const saved = await saveEnablingCheck({
        familyId,
        userId,
        triggerType,
        answers,
      });
      setResultType(saved.result.type);
      setShowResult(true);
    } catch (error) {
      console.error('Failed to save enabling check:', error);
      setSaveError('Could not save this check to the family yet. You can still continue.');
      setResultType(result.type);
      setShowResult(true);
    } finally {
      setSaving(false);
    }
  };

  const handleNext = () => {
    if (step < questions.length - 1) {
      setStep((prev) => prev + 1);
      return;
    }
    void persistAndShow();
  };

  const handleContinue = () => {
    onComplete(resultType);
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        {showResult ? (
          <>
            <DialogHeader>
              <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
                {result.type === 'warning' ? (
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                ) : result.type === 'caution' ? (
                  <HelpCircle className="h-5 w-5 text-amber-600" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-primary" />
                )}
              </div>
              <DialogTitle className="text-center">{result.title}</DialogTitle>
              <DialogDescription className="text-center leading-relaxed">
                {result.message}
              </DialogDescription>
            </DialogHeader>
            {saveError && <p className="text-xs text-destructive">{saveError}</p>}
            <p className="text-xs text-muted-foreground text-center">
              Saved to the family as a pause, not a grade. Continue anyway is always allowed.
            </p>
            <div className="flex flex-col gap-2">
              {(result.type === 'warning' || result.type === 'caution') && onFindFamilyMeeting && (
                <Button variant="outline" onClick={onFindFamilyMeeting}>
                  <LifeBuoy className="mr-2 h-4 w-4" />
                  Find Al-Anon, Nar-Anon, or CRAFT
                </Button>
              )}
              {onOpenFullExercise && (
                <Button variant="ghost" size="sm" onClick={onOpenFullExercise}>
                  Take the full 8-question exercise
                </Button>
              )}
              <Button onClick={handleContinue}>
                Continue anyway <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              If anyone is in immediate danger, call <a className="font-semibold underline" href="tel:911">911</a>.
              For suicide or mental health crisis, call or text <a className="font-semibold underline" href="tel:988">988</a>.
            </p>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>A pause for the family</DialogTitle>
              <DialogDescription>
                Three questions from the enabling exercise, asked before this family yes or no.
                This is education, not shame — you can continue anyway. Crisis help stays first: 911 and 988.
              </DialogDescription>
            </DialogHeader>
            {current && (
              <div className="space-y-4">
                <div>
                  <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Question {step + 1} of {questions.length}</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
                <div>
                  <p className="font-medium">{current.question}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{current.context}</p>
                </div>
                <RadioGroup
                  value={answers[current.id] || ''}
                  onValueChange={(value) => setAnswers((prev) => ({ ...prev, [current.id]: value }))}
                  className="space-y-2"
                >
                  {current.options.map((option) => (
                    <div
                      key={option.value}
                      className={`flex items-start space-x-3 rounded-lg border p-3 cursor-pointer ${
                        answers[current.id] === option.value ? 'border-primary bg-primary/5' : 'border-border'
                      }`}
                      onClick={() => setAnswers((prev) => ({ ...prev, [current.id]: option.value }))}
                    >
                      <RadioGroupItem value={option.value} id={`inflow-${option.value}`} className="mt-0.5" />
                      <Label htmlFor={`inflow-${option.value}`} className="cursor-pointer font-normal text-sm">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
                <div className="flex justify-between">
                  <Button variant="outline" disabled={step === 0} onClick={() => setStep((prev) => prev - 1)}>
                    Back
                  </Button>
                  <Button disabled={!answers[current.id] || saving} onClick={handleNext}>
                    {step === questions.length - 1 ? (saving ? 'Saving…' : 'See result') : 'Next'}
                  </Button>
                </div>
                {onOpenFullExercise && (
                  <Button variant="link" className="h-auto p-0 text-xs" onClick={onOpenFullExercise}>
                    Prefer the full 8-question exercise instead
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
