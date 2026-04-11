import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Activity, Target, Calendar, TrendingUp, Shield, Award, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { SEOHead } from '@/components/SEOHead';
import { BrandedFooter } from '@/components/BrandedFooter';

const phases = [
  { name: 'Early Recovery', range: '0–30 days', progress: 100, status: 'Complete' },
  { name: 'Stabilization', range: '31–90 days', progress: 100, status: 'Complete' },
  { name: 'Building Foundation', range: '91–180 days', progress: 65, status: 'Active' },
  { name: 'Strengthening', range: '181–270 days', progress: 0, status: 'Upcoming' },
  { name: 'Building Resilience', range: '271–365 days', progress: 0, status: 'Upcoming' },
  { name: 'Sustained Recovery', range: '365+ days', progress: 0, status: 'Goal' },
];

const features = [
  { icon: Target, title: '365-Day Sobriety Milestone', description: 'The primary objective is achieving one full year of continuous sobriety. Every feature, metric, and coaching interaction is calibrated toward this benchmark.' },
  { icon: Calendar, title: 'Phase-Based Progression', description: 'Recovery is tracked across six distinct phases, each with specific risk profiles, coaching adjustments, and milestone markers.' },
  { icon: TrendingUp, title: 'Visual Progress Tracking', description: 'Real-time charts showing sobriety counter, meeting attendance trends, boundary compliance rates, and emotional pattern trajectories.' },
  { icon: Shield, title: 'Phase-Sensitive Risk Detection', description: 'Risk scoring adjusts based on recovery phase. What is normal at Day 15 may be a warning sign at Day 150. The system adapts its sensitivity accordingly.' },
  { icon: Award, title: 'Milestone Celebrations', description: 'Automated celebrations at key milestones (30, 60, 90, 180, 365 days) with family notifications and visual rewards that reinforce positive momentum.' },
];

const RecoveryTrajectory = () => {
  const navigate = useNavigate();

  return (
    <>
      <SEOHead title="Recovery Trajectory Tracking | FamilyBridge" description="Visual progress tracking toward the 1-year sobriety milestone with AI-powered phase progression and risk detection." />
      <div className="min-h-screen bg-background">
        <div className="border-b bg-card/50">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
            <Button variant="ghost" size="sm" className="h-8 gap-1.5" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4" /> Home
            </Button>
            <h2 className="text-sm font-semibold text-foreground">Recovery Trajectory Tracking</h2>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto shadow-lg">
              <Activity className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Recovery Trajectory Tracking</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Visual, data-driven progress tracking from Day 1 through the 365-day sobriety milestone — with phase-aware coaching that adapts as recovery evolves.
            </p>
          </div>

          {/* Demo phase tracker */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-foreground mb-2">Demo: Recovery Phase Progression</h2>
              <p className="text-sm text-muted-foreground mb-4">Example showing a client at Day 127 of recovery</p>
              <div className="flex items-center gap-2 mb-6">
                <div className="text-3xl font-bold text-primary">127</div>
                <div className="text-sm text-muted-foreground">days sober</div>
                <Badge className="ml-2 bg-primary/15 text-primary border-primary/30">Building Foundation</Badge>
              </div>
              <div className="space-y-3">
                {phases.map((phase) => (
                  <div key={phase.name} className="flex items-center gap-3">
                    <div className="w-36 text-xs font-medium text-foreground flex-shrink-0">{phase.name}</div>
                    <div className="flex-1">
                      <Progress value={phase.progress} className="h-2" />
                    </div>
                    <div className="w-16 text-right">
                      <Badge variant={phase.status === 'Active' ? 'default' : 'secondary'} className="text-xs">
                        {phase.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Features */}
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

          <Card className="border-primary/20">
            <CardContent className="p-6 text-center space-y-4">
              <h2 className="text-xl font-bold text-foreground">See It in Action</h2>
              <p className="text-sm text-muted-foreground">Explore demo families with active recovery trajectories across different phases.</p>
              <Button onClick={() => navigate('/demo')} className="gap-2">View Demo <ArrowLeft className="h-4 w-4 rotate-180" /></Button>
            </CardContent>
          </Card>
        </div>
        <BrandedFooter />
      </div>
    </>
  );
};

export default RecoveryTrajectory;
