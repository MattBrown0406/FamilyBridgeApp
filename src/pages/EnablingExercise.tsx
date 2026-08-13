import { useEffect, useState } from 'react';
import { SEOHead } from '@/components/SEOHead';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, AlertTriangle, HelpCircle, CheckCircle, XCircle, RotateCcw } from 'lucide-react';
import familyBridgeLogo from '@/assets/familybridge-logo.png';
import { ENABLING_QUESTIONS, getEnablingResult } from '@/lib/enablingExercise';
import { saveEnablingCheck } from '@/hooks/useEnablingChecks';
import { useAuth } from '@/hooks/useAuth';

const questions = ENABLING_QUESTIONS;

const EnablingExercise = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const familyId = searchParams.get('familyId');
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [savedToFamily, setSavedToFamily] = useState(false);

  const progress = ((currentStep) / questions.length) * 100;
  const currentQuestion = questions[currentStep];
  const familyHome = familyId ? `/family/${familyId}` : '/';
  const familyMeetingsHref = familyId
    ? `/family/${familyId}?tab=checkin&fellowship=Al-Anon`
    : '/meetings?fellowship=Al-Anon';

  useEffect(() => {
    if (!showResults || !familyId || !user?.id) return;
    let cancelled = false;
    const persist = async () => {
      try {
        await saveEnablingCheck({
          familyId,
          userId: user.id,
          triggerType: 'full_exercise',
          answers,
        });
        if (!cancelled) setSavedToFamily(true);
      } catch (error) {
        console.error('Failed to save enabling exercise to family:', error);
      }
    };
    void persist();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showResults]);

  const handleAnswer = (value: string) => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: value }));
  };

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      setShowResults(true);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
    setAnswers({});
    setShowResults(false);
    setSavedToFamily(false);
  };

  const getResultMessage = () => {
    const result = getEnablingResult(answers, questions);
    if (result.type === 'warning') {
      return { ...result, icon: AlertTriangle, color: 'text-destructive' };
    }
    if (result.type === 'caution') {
      return { ...result, icon: HelpCircle, color: 'text-warning' };
    }
    return { ...result, icon: CheckCircle, color: 'text-primary' };
  };

  if (showResults) {
    const result = getResultMessage();
    const ResultIcon = result.icon;

    return (
      <div className="min-h-screen bg-background">
        <header className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 border-b border-border">
          <nav className="flex items-center justify-between">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate(familyHome)}>
              <img src={familyBridgeLogo} alt="FamilyBridge" className="h-6 sm:h-7 w-auto object-contain" />
              <span className="text-base sm:text-lg font-display font-semibold text-foreground">FamilyBridge</span>
            </div>
          </nav>
        </header>

        <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-3xl">
          <Card className="shadow-elevated">
            <CardHeader className="text-center px-4 sm:px-6">
              <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full ${result.type === 'warning' ? 'bg-destructive/10' : result.type === 'caution' ? 'bg-warning/10' : 'bg-primary/10'} flex items-center justify-center mx-auto mb-3 sm:mb-4`}>
                <ResultIcon className={`h-6 w-6 sm:h-8 sm:w-8 ${result.color}`} />
              </div>
              <CardTitle className="text-xl sm:text-2xl font-display">{result.title}</CardTitle>
              <CardDescription className="text-sm sm:text-base mt-2">
                {result.message}
              </CardDescription>
              {familyId && (
                <p className="mt-2 text-xs text-muted-foreground">
                  {savedToFamily
                    ? 'Saved to your family so this is not a dead-end quiz.'
                    : 'Saving to your family…'}
                </p>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-display font-semibold text-lg">Your Answers Review</h3>
                {questions.map(question => {
                  const answer = answers[question.id];
                  const option = question.options.find(o => o.value === answer);
                  if (!option) return null;

                  return (
                    <div key={question.id} className="border border-border rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        {option.isEnabling ? (
                          <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                        ) : (
                          <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        )}
                        <div>
                          <p className="font-medium text-foreground">{question.question}</p>
                          <p className="text-sm text-muted-foreground mt-1">{option.label}</p>
                          <p className="text-sm text-muted-foreground mt-2 italic">{option.explanation}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="bg-secondary/30 rounded-lg p-4">
                <h4 className="font-display font-semibold mb-2">Remember</h4>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Enabling is not the same as loving - sometimes love means allowing struggle</li>
                  <li>• You cannot control another person's recovery, only your own choices</li>
                  <li>• Taking care of yourself is not selfish, it's necessary</li>
                  <li>• It's okay to say no, even to people you love</li>
                  <li>• Consider joining Al-Anon, Nar-Anon, or a CRAFT-informed family group</li>
                </ul>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                If anyone is in immediate danger, call <a className="font-semibold underline" href="tel:911">911</a>.
                For suicide or mental health crisis, call or text <a className="font-semibold underline" href="tel:988">988</a>.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                <Button variant="outline" onClick={handleReset}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Start Over
                </Button>
                {(result.type === 'warning' || result.type === 'caution') && (
                  <Button variant="outline" onClick={() => navigate(familyMeetingsHref)}>
                    Find a family meeting
                  </Button>
                )}
                <Button variant="hero" onClick={() => navigate(familyHome)}>
                  {familyId ? 'Back to family home' : 'Return Home'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Family Enabling Patterns Exercise | FamilyBridge"
        description="Use a guided FamilyBridge exercise to reflect on enabling patterns, boundaries, and healthier ways to support a loved one affected by addiction."
        canonicalPath="/enabling-exercise"
      />
      <header className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 border-b border-border">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate(familyHome)}>
            <img src={familyBridgeLogo} alt="FamilyBridge" className="h-6 sm:h-7 w-auto object-contain" />
            <span className="text-base sm:text-lg font-display font-semibold text-foreground">FamilyBridge</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate(familyHome)} className="px-2 sm:px-3">
            <ArrowLeft className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Back</span>
          </Button>
        </nav>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-3xl">
        {currentStep === 0 && Object.keys(answers).length === 0 && (
          <Card className="shadow-elevated mb-6">
            <CardHeader>
              <CardTitle className="text-2xl font-display flex items-center gap-2">
                <HelpCircle className="h-6 w-6 text-primary" />
                <h1>Am I Enabling?</h1>
              </CardTitle>
              <CardDescription className="text-base">
                This exercise will help you understand the difference between a genuine crisis that requires help 
                and chaos that is often self-inflicted and avoidable. By answering honestly, you can identify 
                whether your actions support recovery or unintentionally enable addiction.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-secondary/30 rounded-lg p-4 mb-4">
                <h4 className="font-display font-semibold mb-2">Crisis vs. Chaos</h4>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-foreground mb-1">A Crisis is:</p>
                    <ul className="text-muted-foreground space-y-1">
                      <li>• Immediate danger to life or safety</li>
                      <li>• Medical emergency</li>
                      <li>• Genuine unforeseen circumstance</li>
                      <li>• A turning point requiring intervention</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium text-foreground mb-1">Chaos is:</p>
                    <ul className="text-muted-foreground space-y-1">
                      <li>• Repeated patterns of poor choices</li>
                      <li>• Predictable consequences of behavior</li>
                      <li>• Self-inflicted problems</li>
                      <li>• Drama that could have been avoided</li>
                    </ul>
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Think of a specific situation you're facing right now, then answer the following questions honestly.
                {familyId ? ' Results will be saved to your family.' : ''}
              </p>
            </CardContent>
          </Card>
        )}

        <Card className="shadow-elevated">
          <CardHeader>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                Question {currentStep + 1} of {questions.length}
              </span>
              <span className="text-sm text-muted-foreground">
                {Math.round(progress)}% Complete
              </span>
            </div>
            <Progress value={progress} className="h-2" />
            <CardTitle className="text-xl font-display mt-4">
              {currentQuestion.question}
            </CardTitle>
            <CardDescription>
              {currentQuestion.context}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup
              value={answers[currentQuestion.id] || ''}
              onValueChange={handleAnswer}
              className="space-y-3"
            >
              {currentQuestion.options.map(option => (
                <div
                  key={option.value}
                  className={`flex items-start space-x-3 border rounded-lg p-4 cursor-pointer transition-colors ${
                    answers[currentQuestion.id] === option.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => handleAnswer(option.value)}
                >
                  <RadioGroupItem value={option.value} id={option.value} className="mt-0.5" />
                  <Label htmlFor={option.value} className="cursor-pointer font-normal">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>

            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 0}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <Button
                variant="hero"
                onClick={handleNext}
                disabled={!answers[currentQuestion.id]}
              >
                {currentStep === questions.length - 1 ? 'See Results' : 'Next'}
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default EnablingExercise;
