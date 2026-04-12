import { useNavigate } from 'react-router-dom';
import { ArrowLeft, GitBranch, ArrowRightLeft, ShieldCheck, FileText, BarChart3, Users, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SEOHead } from '@/components/SEOHead';
import { BrandedFooter } from '@/components/BrandedFooter';
import PublicCrisisHelp from '@/components/PublicCrisisHelp';

const transitionDemo = [
  { step: 'Transition Summary Created', by: 'Hope Harbor Interventions', date: '3 days ago', status: 'complete' },
  { step: 'Patient Consent Recorded', by: 'Tyler B. (Patient)', date: '3 days ago', status: 'complete' },
  { step: 'Receiving Provider Accepted', by: 'Mountain View Recovery', date: '2 days ago', status: 'complete' },
  { step: 'Care Plan Transferred', by: 'System', date: '2 days ago', status: 'complete' },
  { step: 'Family Notified', by: 'System', date: '2 days ago', status: 'complete' },
  { step: 'Post-Transition Check-in', by: 'Mountain View Recovery', date: 'Due in 5 days', status: 'pending' },
];

const features = [
  { icon: ArrowRightLeft, title: 'Provider-to-Provider Handoff', description: 'Structured transition summaries that travel with the patient between treatment providers, supporting continuity of care without information gaps.' },
  { icon: ShieldCheck, title: 'Patient Consent Management', description: 'Consent recording with digital signatures and auditable access controls. Patients control exactly which data is shared with each receiving provider.' },
  { icon: FileText, title: 'Transition Summaries', description: 'Comprehensive care summaries including treatment history, medication lists, boundary agreements, family dynamics, and FIIS risk reviews.' },
  { icon: BarChart3, title: 'Outcome Tracking', description: 'Post-transition outcome scoring measures success rates across providers, identifying which handoff patterns lead to better long-term outcomes.' },
  { icon: Users, title: 'Family Continuity', description: 'Families maintain their group, communication history, and boundaries across provider transitions — no starting over from scratch.' },
  { icon: Clock, title: 'Readiness Scoring', description: 'AI-assisted transition readiness indicators help providers assess when a patient may be ready for step-down care without premature discharge.' },
];

const CareTransitions = () => {
  const navigate = useNavigate();

  return (
    <>
      <SEOHead title="Care Transitions | FamilyBridge" description="Seamless provider-to-provider handoffs with transition summaries, consent management, and outcome tracking." />
      <div className="min-h-screen bg-background">
        <div className="border-b bg-card/50">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
            <Button variant="ghost" size="sm" className="h-8 gap-1.5" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4" /> Home
            </Button>
            <h2 className="text-sm font-semibold text-foreground">Care Transitions</h2>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mx-auto shadow-lg">
              <GitBranch className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Care Transitions</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Seamless handoffs between treatment providers with structured transition summaries, patient consent management, and outcome tracking to support safer transitions.
            </p>
          </div>

          {/* Demo transition */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-foreground mb-2">Demo: Active Care Transition</h2>
              <p className="text-sm text-muted-foreground mb-4">Hope Harbor Interventions → Mountain View Recovery</p>
              <div className="space-y-2">
                {transitionDemo.map((step, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${step.status === 'complete' ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      {step.status === 'complete' ? '✓' : i + 1}
                    </div>
                    <div className="flex-1">
                      <span className="text-sm font-medium text-foreground">{step.step}</span>
                      <span className="text-xs text-muted-foreground ml-2">— {step.by}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{step.date}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div>
            <h2 className="text-xl font-bold text-foreground mb-4">Key Capabilities</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {features.map((f) => (
                <Card key={f.title}>
                  <CardContent className="p-4 flex gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <f.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">{f.title}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">{f.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <PublicCrisisHelp />

          <Card className="border-primary/20">
            <CardContent className="p-6 text-center space-y-4">
              <h2 className="text-xl font-bold text-foreground">See It in Action</h2>
              <p className="text-sm text-muted-foreground">Explore care transitions in the provider demo environment.</p>
              <Button onClick={() => navigate('/demo/provider')} className="gap-2">View Provider Demo <ArrowLeft className="h-4 w-4 rotate-180" /></Button>
            </CardContent>
          </Card>
        </div>
        <BrandedFooter />
      </div>
    </>
  );
};

export default CareTransitions;
