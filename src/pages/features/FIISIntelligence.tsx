import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Brain, Shield, TrendingUp, AlertTriangle, Eye, Zap, BarChart3, Users, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SEOHead } from '@/components/SEOHead';
import { BrandedFooter } from '@/components/BrandedFooter';

const features = [
  { icon: Eye, title: 'Real-Time Pattern Detection', description: 'FIIS continuously monitors communication patterns, emotional tone shifts, and behavioral signals across all family interactions — surfacing insights that humans often miss in the moment.' },
  { icon: AlertTriangle, title: '5-Level Risk Framework', description: 'A weighted risk accumulation model (Low → Guarded → Elevated → High → Critical) that scales AI coaching tone from gentle guidance to directive, action-oriented emergency protocols.' },
  { icon: BarChart3, title: 'Recovery Trajectory Analysis', description: 'Tracks compliance trends, risk trajectories, and transition readiness indicators across six recovery phases, from Early Recovery through Building Resilience.' },
  { icon: Users, title: 'Family System Coaching', description: 'Identifies enabling patterns, codependency dynamics, and family role behaviors — then provides actionable coaching to strengthen the entire family system.' },
  { icon: Shield, title: 'Crisis Detection & Response', description: 'Automated crisis protocols including suicide risk assessment, psychiatric emergency detection, overdose guidance (Narcan/988), and involuntary commitment criteria.' },
  { icon: Zap, title: 'Relapse Prediction', description: 'Identifies behavioral patterns 2–4 weeks before a crisis through communication analysis, meeting attendance drops, and boundary enforcement patterns.' },
];

const knowledgeBases = [
  'DSM-5 Diagnostic Criteria', 'CRAFT Method', 'Bowen Family Systems Theory',
  'Stages of Change Model', 'Trauma-Informed Care (ACE)', 'AA/NA/SMART Recovery Literature',
  'DBT / EMDR / CBT Modalities', 'IDDT Integrated Treatment Model',
];

const FIISIntelligence = () => {
  const navigate = useNavigate();

  return (
    <>
      <SEOHead title="FIIS Recovery Intelligence | FamilyBridge" description="AI-powered behavioral pattern detection and family systems coaching engine for addiction recovery." />
      <div className="min-h-screen bg-background">
        <div className="border-b bg-card/50">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
            <Button variant="ghost" size="sm" className="h-8 gap-1.5" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4" /> Home
            </Button>
            <h2 className="text-sm font-semibold text-foreground">FIIS Recovery Intelligence</h2>
            <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30 text-xs">Patent Pending</Badge>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">
          {/* Hero */}
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mx-auto shadow-lg">
              <Brain className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Family Intervention Intelligence System</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              FIIS operates as a behavioral pattern intelligence and family systems coaching engine — not a medical provider. It detects what humans miss, coaches in real time, and keeps families grounded through the hardest moments of recovery.
            </p>
          </div>

          {/* How it works */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" /> How FIIS Works
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 text-center">
                  <div className="text-2xl font-bold text-primary mb-1">1</div>
                  <h3 className="font-semibold text-foreground mb-1">Observe</h3>
                  <p className="text-xs text-muted-foreground">Monitors messages, check-ins, emotional tone, meeting attendance, and financial patterns across the family system.</p>
                </div>
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 text-center">
                  <div className="text-2xl font-bold text-primary mb-1">2</div>
                  <h3 className="font-semibold text-foreground mb-1">Analyze</h3>
                  <p className="text-xs text-muted-foreground">Cross-references behavioral signals against clinical knowledge bases to identify risk patterns, enabling behaviors, and recovery trajectory shifts.</p>
                </div>
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 text-center">
                  <div className="text-2xl font-bold text-primary mb-1">3</div>
                  <h3 className="font-semibold text-foreground mb-1">Coach</h3>
                  <p className="text-xs text-muted-foreground">Delivers real-time, actionable guidance to families and providers — scaling tone from gentle to directive based on risk level.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Feature grid */}
          <div>
            <h2 className="text-xl font-bold text-foreground mb-4">Core Capabilities</h2>
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

          {/* Knowledge base */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">Clinical Knowledge Base</h2>
              <p className="text-sm text-muted-foreground mb-4">FIIS is trained on established clinical frameworks and recovery literature:</p>
              <div className="flex flex-wrap gap-2">
                {knowledgeBases.map((kb) => (
                  <Badge key={kb} variant="secondary" className="text-xs">{kb}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Demo preview */}
          <Card className="border-primary/20">
            <CardContent className="p-6 text-center space-y-4">
              <h2 className="text-xl font-bold text-foreground">See FIIS in Action</h2>
              <p className="text-sm text-muted-foreground">Explore demo family scenarios showing real-time FIIS analysis, risk detection, and coaching in practice.</p>
              <Button onClick={() => navigate('/demo')} className="gap-2">
                View Demo Scenarios <ArrowLeft className="h-4 w-4 rotate-180" />
              </Button>
            </CardContent>
          </Card>
        </div>
        <BrandedFooter />
      </div>
    </>
  );
};

export default FIISIntelligence;
