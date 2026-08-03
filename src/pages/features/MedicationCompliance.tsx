import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Pill, Camera, Bell, Clock, BarChart3, ShieldCheck, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SEOHead } from '@/components/SEOHead';
import { BrandedFooter } from '@/components/BrandedFooter';
import PublicCrisisHelp from '@/components/PublicCrisisHelp';

const demoSchedule = [
  { time: '8:00 AM', med: 'Naltrexone 50mg', status: 'taken', takenAt: '8:12 AM' },
  { time: '8:00 AM', med: 'Sertraline 100mg', status: 'taken', takenAt: '8:12 AM' },
  { time: '12:00 PM', med: 'Gabapentin 300mg', status: 'missed', takenAt: null },
  { time: '6:00 PM', med: 'Gabapentin 300mg', status: 'upcoming', takenAt: null },
  { time: '10:00 PM', med: 'Trazodone 100mg', status: 'upcoming', takenAt: null },
];

const features = [
  { icon: Camera, title: 'AI Label Scanning', description: 'Take a photo of any medication label. AI extracts the medication name, dosage, frequency, prescriber, and pharmacy to create a draft medication entry for review.' },
  { icon: Clock, title: 'Smart Dose Scheduling', description: 'Automated reminders based on prescribed frequency. Tracks scheduled vs. actual take times and highlights missed-dose patterns over time.' },
  { icon: Bell, title: 'Family Alerts', description: 'When a scheduled dose is missed, authorized family members and providers can receive notifications for follow-up.' },
  { icon: BarChart3, title: 'Compliance Reporting', description: 'Weekly and monthly consistency trends that providers can review alongside other recovery-support signals.' },
  { icon: ShieldCheck, title: 'Refill Monitoring', description: 'Tracks medication refill schedules and alerts when a refill is due or overdue, helping catch potential gaps before they become missed doses.' },
  { icon: AlertTriangle, title: 'Pattern Detection', description: 'FIIS highlights consistency patterns, such as specific days or times medications are frequently missed, for human review.' },
];

const MedicationCompliance = () => {
  const navigate = useNavigate();

  return (
    <>
      <SEOHead title="Medication Consistency Support | FamilyBridge" description="Explore user-directed medication scheduling and consistency tools that support coordination without prescribing or replacing medical advice." canonicalPath="/features/medication-compliance" />
      <div className="min-h-screen bg-background">
        <div className="border-b bg-card/50">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
            <Button variant="ghost" size="sm" className="h-8 gap-1.5" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4" /> Home
            </Button>
            <h2 className="text-sm font-semibold text-foreground">Medication Compliance</h2>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mx-auto shadow-lg">
              <Pill className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Medication Compliance</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              AI-assisted medication support that tracks doses, alerts authorized supporters to missed medications, and gives providers a clearer consistency picture without replacing medical advice.
            </p>
          </div>

          {/* Demo schedule */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-foreground mb-2">Demo: Today's Medication Schedule</h2>
              <p className="text-sm text-muted-foreground mb-4">Example daily medication tracker</p>
              <div className="space-y-2">
                {demoSchedule.map((dose, i) => (
                  <div key={i} className={`p-3 rounded-lg border flex items-center gap-3 ${dose.status === 'missed' ? 'bg-destructive/5 border-destructive/20' : dose.status === 'taken' ? 'bg-primary/5 border-primary/20' : 'bg-card'}`}>
                    <span className="text-xs font-mono text-muted-foreground w-16">{dose.time}</span>
                    <span className="text-sm font-medium text-foreground flex-1">{dose.med}</span>
                    <Badge variant={dose.status === 'taken' ? 'default' : dose.status === 'missed' ? 'destructive' : 'secondary'} className="text-xs capitalize">
                      {dose.status === 'taken' ? `✓ ${dose.takenAt}` : dose.status}
                    </Badge>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border">
                <p className="text-xs text-muted-foreground"><strong>FIIS Note:</strong> Gabapentin noon dose has been missed 3 of the last 5 days. Pattern: midday doses are consistently lower than morning and evening. Consider reviewing the schedule with the prescriber.</p>
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
              <p className="text-sm text-muted-foreground">Explore medication tracking in the family demo environment.</p>
              <Button onClick={() => navigate('/demo/family')} className="gap-2">View Family Demo <ArrowLeft className="h-4 w-4 rotate-180" /></Button>
            </CardContent>
          </Card>
        </div>
        <BrandedFooter />
      </div>
    </>
  );
};

export default MedicationCompliance;
