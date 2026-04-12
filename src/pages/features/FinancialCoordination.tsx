import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Vote, DollarSign, Receipt, Users, ShieldCheck, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SEOHead } from '@/components/SEOHead';
import { BrandedFooter } from '@/components/BrandedFooter';
import PublicCrisisHelp from '@/components/PublicCrisisHelp';

const demoRequest = {
  requester: 'Tyler B.',
  amount: '$200',
  reason: 'Car repair — brake pads',
  status: 'Pending Family Vote',
  votes: [
    { name: 'Linda (Mom)', vote: 'approve', pledge: '$100', note: 'Verified — his brakes were grinding last week.' },
    { name: 'Robert (Dad)', vote: 'deny', pledge: null, note: 'He should earn money from his part-time job for this.' },
    { name: 'Sarah (Sister)', vote: 'approve', pledge: '$50', note: null },
    { name: 'Kevin (Brother)', vote: 'pending', pledge: null, note: null },
  ],
};

const features = [
  { icon: Vote, title: 'Family Voting', description: 'Financial requests go to all family members for approval or denial with reasoning. Transparency eliminates secret enabling and one-person rescues.' },
  { icon: DollarSign, title: 'Pledge Tracking', description: 'Approving family members can pledge specific amounts. The system tracks who pledged, who paid, and whether the total was met, reducing ambiguity.' },
  { icon: Receipt, title: 'Receipt Verification', description: 'The requester uploads a receipt after spending. Moderators can verify the money was used for the stated purpose before closing the request.' },
  { icon: ShieldCheck, title: 'FIIS Enabling Detection', description: 'AI reviews financial request patterns and flags possible enabling concerns, such as repeated requests, escalating amounts, or vague reasons.' },
  { icon: Users, title: 'Moderator Oversight', description: 'Family moderators and assigned providers can review, close, or flag financial requests. All actions are logged and visible to the family group.' },
  { icon: BarChart3, title: 'Financial History', description: 'Complete request history with approval rates, total disbursed, and trend analysis, giving families a clearer picture of financial support patterns.' },
];

const FinancialCoordination = () => {
  const navigate = useNavigate();

  return (
    <>
      <SEOHead title="Financial Coordination | FamilyBridge" description="Family voting on financial requests with pledge tracking, receipt verification, and AI-assisted enabling review." />
      <div className="min-h-screen bg-background">
        <div className="border-b bg-card/50">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
            <Button variant="ghost" size="sm" className="h-8 gap-1.5" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4" /> Home
            </Button>
            <h2 className="text-sm font-semibold text-foreground">Financial Coordination</h2>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mx-auto shadow-lg">
              <Vote className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Financial Coordination</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Transparent financial request management that reduces secret enabling and keeps decisions visible to the family group.
            </p>
          </div>

          {/* Demo request */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-foreground mb-2">Demo: Active Financial Request</h2>
              <div className="flex items-center gap-3 mb-4">
                <Badge className="bg-warning/15 text-warning-foreground border-warning/30">{demoRequest.status}</Badge>
                <span className="text-lg font-bold text-foreground">{demoRequest.amount}</span>
                <span className="text-sm text-muted-foreground">— {demoRequest.reason}</span>
              </div>
              <div className="space-y-2">
                {demoRequest.votes.map((v, i) => (
                  <div key={i} className={`p-3 rounded-lg border flex items-center gap-3 ${v.vote === 'approve' ? 'bg-primary/5 border-primary/20' : v.vote === 'deny' ? 'bg-destructive/5 border-destructive/20' : 'bg-muted/30'}`}>
                    <span className="text-sm font-medium text-foreground w-32">{v.name}</span>
                    <Badge variant={v.vote === 'approve' ? 'default' : v.vote === 'deny' ? 'destructive' : 'secondary'} className="text-xs capitalize">{v.vote}</Badge>
                    {v.pledge && <span className="text-xs text-primary font-medium">Pledged {v.pledge}</span>}
                    {v.note && <span className="text-xs text-muted-foreground italic ml-auto">"{v.note}"</span>}
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
              <p className="text-sm text-muted-foreground">Explore financial coordination tools in the family demo.</p>
              <Button onClick={() => navigate('/demo/family')} className="gap-2">View Family Demo <ArrowLeft className="h-4 w-4 rotate-180" /></Button>
            </CardContent>
          </Card>
        </div>
        <BrandedFooter />
      </div>
    </>
  );
};

export default FinancialCoordination;
