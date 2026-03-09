import { useState } from 'react';
import { SEOHead } from '@/components/SEOHead';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, AlertTriangle, HelpCircle, CheckCircle, XCircle, RotateCcw } from 'lucide-react';
import familyBridgeLogo from '@/assets/familybridge-logo.png';

interface Question {
  id: number;
  question: string;
  context: string;
  options: {
    value: string;
    label: string;
    isEnabling: boolean;
    explanation: string;
  }[];
}

const questions: Question[] = [
  {
    id: 1,
    question: "Is this a true emergency or crisis?",
    context: "A true emergency involves immediate danger to life, safety, or health. Chaos is often repeated patterns of self-inflicted problems.",
    options: [
      {
        value: "emergency",
        label: "Yes - there is immediate danger to life or safety",
        isEnabling: false,
        explanation: "This is a genuine emergency. It's appropriate to help ensure immediate safety."
      },
      {
        value: "chaos",
        label: "No - this is a repeated pattern or self-created problem",
        isEnabling: true,
        explanation: "This may be chaos rather than crisis. Helping resolve self-inflicted chaos can enable the pattern to continue."
      },
      {
        value: "unsure",
        label: "I'm not sure",
        isEnabling: false,
        explanation: "When unsure, it's okay to pause and assess. Consider: Has this exact situation happened before? Could it have been prevented?"
      }
    ]
  },
  {
    id: 2,
    question: "Did I create this problem or is it their responsibility?",
    context: "Taking ownership of consequences is essential for recovery. When we solve problems for others, we rob them of growth opportunities.",
    options: [
      {
        value: "theirs",
        label: "This is entirely their problem from their choices",
        isEnabling: true,
        explanation: "If this is their problem from their choices, allowing them to solve it supports their growth and accountability."
      },
      {
        value: "shared",
        label: "We both contributed to this situation",
        isEnabling: false,
        explanation: "Shared problems may need collaborative solutions. Focus on your part while letting them handle theirs."
      },
      {
        value: "mine",
        label: "I contributed significantly to this situation",
        isEnabling: false,
        explanation: "If you contributed, it's appropriate to help resolve what you created."
      }
    ]
  },
  {
    id: 3,
    question: "Am I helping because of fear, guilt, or genuine love?",
    context: "Fear and guilt often drive enabling behavior. Genuine love sometimes means allowing consequences.",
    options: [
      {
        value: "fear",
        label: "I'm afraid of what will happen if I don't help",
        isEnabling: true,
        explanation: "Acting from fear often enables. Fear of their reaction, of them being uncomfortable, or of being the 'bad guy' can trap you in enabling patterns."
      },
      {
        value: "guilt",
        label: "I feel guilty or obligated to fix this",
        isEnabling: true,
        explanation: "Guilt-driven help often enables. You are not responsible for another adult's choices or their consequences."
      },
      {
        value: "love",
        label: "I genuinely believe this help supports their recovery",
        isEnabling: false,
        explanation: "Help that supports recovery is valuable. Consider: Does this move them toward independence or dependence?"
      }
    ]
  },
  {
    id: 4,
    question: "Have I done this before? What was the result?",
    context: "Repeating the same help with the same results is a sign of enabling. If helping hasn't helped, it may be hurting.",
    options: [
      {
        value: "repeated",
        label: "Yes, and the same problems keep happening",
        isEnabling: true,
        explanation: "Doing the same thing and expecting different results isn't working. Breaking this pattern, while painful, may be necessary for change."
      },
      {
        value: "improved",
        label: "Yes, and things improved afterwards",
        isEnabling: false,
        explanation: "If past help led to genuine improvement, similar help may be appropriate. Look for sustained positive change."
      },
      {
        value: "first_time",
        label: "No, this is the first time",
        isEnabling: false,
        explanation: "First-time situations deserve assessment. Consider setting clear expectations about future occurrences."
      }
    ]
  },
  {
    id: 5,
    question: "Am I preventing them from experiencing natural consequences?",
    context: "Natural consequences are powerful teachers. Shielding someone from consequences prevents learning and growth.",
    options: [
      {
        value: "preventing",
        label: "Yes, I would be saving them from consequences",
        isEnabling: true,
        explanation: "Preventing consequences enables continued behavior. As painful as it is, experiencing consequences often motivates change."
      },
      {
        value: "softening",
        label: "I'm softening the blow but not eliminating consequences",
        isEnabling: false,
        explanation: "There's a balance between support and rescue. Ensure they still feel the weight of their choices."
      },
      {
        value: "no",
        label: "No, they will still face the consequences regardless",
        isEnabling: false,
        explanation: "If consequences remain intact, your help may be appropriate support rather than enabling."
      }
    ]
  },
  {
    id: 6,
    question: "Is this help being requested or am I volunteering?",
    context: "Unsolicited help can undermine autonomy and create dependence. Being asked shows they're taking initiative.",
    options: [
      {
        value: "volunteering",
        label: "I'm jumping in without being asked",
        isEnabling: true,
        explanation: "Unsolicited rescuing sends the message that you don't believe they can handle their own life. Step back and wait to be asked."
      },
      {
        value: "hinted",
        label: "They're hinting but haven't directly asked",
        isEnabling: true,
        explanation: "Responding to hints can enable passive communication. Encourage direct requests and honest conversation."
      },
      {
        value: "asked",
        label: "They directly asked for specific help",
        isEnabling: false,
        explanation: "Direct requests show initiative. You can still evaluate whether the help is appropriate."
      }
    ]
  },
  {
    id: 7,
    question: "Will this help move them toward independence or dependence?",
    context: "The goal of healthy help is to become unnecessary. Each act of support should build capability, not reliance.",
    options: [
      {
        value: "dependence",
        label: "They will likely need this help again",
        isEnabling: true,
        explanation: "Help that needs repeating creates dependence. Consider helping them build skills instead of providing solutions."
      },
      {
        value: "independence",
        label: "This will help them help themselves in the future",
        isEnabling: false,
        explanation: "Teaching skills and building capability is healthy support. The goal is their growing independence."
      },
      {
        value: "neutral",
        label: "It's a one-time situation that won't affect their capability",
        isEnabling: false,
        explanation: "Some situations are genuinely isolated. Trust your assessment but remain aware of patterns."
      }
    ]
  },
  {
    id: 8,
    question: "Am I sacrificing my own wellbeing to provide this help?",
    context: "You cannot pour from an empty cup. Sacrificing your health, finances, or relationships to help often signals enabling.",
    options: [
      {
        value: "sacrificing",
        label: "Yes, this will harm my finances, health, or relationships",
        isEnabling: true,
        explanation: "Self-sacrifice to rescue others is unsustainable and often enables. You deserve to protect your own wellbeing."
      },
      {
        value: "stretching",
        label: "It's a stretch but manageable",
        isEnabling: false,
        explanation: "Be honest about what 'manageable' means. Small stretches can add up to burnout over time."
      },
      {
        value: "comfortable",
        label: "No, I can comfortably provide this help",
        isEnabling: false,
        explanation: "Help given from a place of abundance is healthier for everyone involved."
      }
    ]
  }
];

const EnablingExercise = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);

  const progress = ((currentStep) / questions.length) * 100;
  const currentQuestion = questions[currentStep];

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
  };

  const getEnablingCount = () => {
    return Object.entries(answers).filter(([id, value]) => {
      const question = questions.find(q => q.id === parseInt(id));
      const option = question?.options.find(o => o.value === value);
      return option?.isEnabling;
    }).length;
  };

  const getResultMessage = () => {
    const enablingCount = getEnablingCount();
    const total = Object.keys(answers).length;
    const percentage = (enablingCount / total) * 100;

    if (percentage >= 60) {
      return {
        type: 'warning',
        title: 'This May Be Enabling',
        message: "Based on your answers, this situation shows several signs of enabling behavior. While it's natural to want to help, stepping back may actually be the most loving thing you can do. Consider consulting with a counselor or attending an Al-Anon meeting for support.",
        icon: AlertTriangle,
        color: 'text-destructive'
      };
    } else if (percentage >= 30) {
      return {
        type: 'caution',
        title: 'Proceed with Caution',
        message: "Your answers show a mix of enabling and healthy helping patterns. Before acting, clearly define boundaries and expectations. Consider if there are ways to support without rescuing.",
        icon: HelpCircle,
        color: 'text-warning'
      };
    } else {
      return {
        type: 'okay',
        title: 'This Appears to Be Healthy Helping',
        message: "Based on your answers, this situation appears to be genuine support rather than enabling. Remember to maintain boundaries and continue evaluating as situations evolve.",
        icon: CheckCircle,
        color: 'text-primary'
      };
    }
  };

  if (showResults) {
    const result = getResultMessage();
    const ResultIcon = result.icon;

    return (
      <div className="min-h-screen bg-background">
        <header className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 border-b border-border">
          <nav className="flex items-center justify-between">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
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
                  <li>• Consider joining Al-Anon or a similar support group for families</li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                <Button variant="outline" onClick={handleReset}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Start Over
                </Button>
                <Button variant="hero" onClick={() => navigate('/')}>
                  Return Home
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
        title="Enabling Exercise — Am I Enabling? — FamilyBridge"
        description="Are you enabling addiction? Take this interactive exercise to identify enabling behaviors and learn healthier alternatives for supporting your loved one."
        canonicalPath="/enabling-exercise"
      />
      <header className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 border-b border-border">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <img src={familyBridgeLogo} alt="FamilyBridge" className="h-6 sm:h-7 w-auto object-contain" />
            <span className="text-base sm:text-lg font-display font-semibold text-foreground">FamilyBridge</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="px-2 sm:px-3">
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
                Am I Enabling?
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
