import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mic, MessageSquare, Shield, Zap, Brain, Eye, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SEOHead } from '@/components/SEOHead';
import { BrandedFooter } from '@/components/BrandedFooter';
import PublicCrisisHelp from '@/components/PublicCrisisHelp';

const coachingDemo = [
  { role: 'them', text: '"You don\'t understand what I\'m going through. Nobody does."', time: '2:14 PM' },
  { role: 'fiis', text: 'Possible de-escalation opening. Avoid defending yourself. You could try: "You\'re right, I may not fully understand. Can you help me?"', time: '2:14 PM', type: 'coaching' },
  { role: 'you', text: '"You\'re right, I probably don\'t fully understand. I want to though. Can you help me see what you\'re dealing with?"', time: '2:15 PM' },
  { role: 'them', text: '"...I\'m just tired. Everything feels impossible right now."', time: '2:16 PM' },
  { role: 'fiis', text: 'The tone appears to be softening. Do not push for solutions yet. Validate the feeling and stay in the moment.', time: '2:16 PM', type: 'coaching' },
];

const features = [
  { icon: Zap, title: 'Real-Time Guidance', description: 'FIIS reviews the conversation as it happens and surfaces coaching prompts quickly, helping you navigate difficult moments more carefully.' },
  { icon: Brain, title: 'De-Escalation Scripts', description: 'Language patterns informed by CRAFT, motivational interviewing, and family guidance frameworks. Practical suggestions, not one-size-fits-all scripts.' },
  { icon: Eye, title: 'Tone Review', description: 'AI reviews emotional tone in text messages and highlights shifts like defensive to vulnerable, angry to exhausted, or resistant to curious.' },
  { icon: Shield, title: '"Warm Exit" Strategies', description: 'When a conversation is heading toward damage, FIIS provides exit strategies that preserve the relationship while protecting your boundaries.' },
  { icon: AlertTriangle, title: 'Enabling Review', description: 'Highlights moments when language patterns may be sliding toward enabling, such as over-explaining, apologizing for boundaries, or offering to rescue.' },
  { icon: MessageSquare, title: 'Screenshot Coaching', description: 'Upload a screenshot of a text conversation. FIIS reviews the exchange and offers context-aware suggestions for what to say next.' },
];

const ConversationCoaching = () => {
  const navigate = useNavigate();

  return (
    <>
      <SEOHead title="Conversation Coaching | FamilyBridge" description="AI-assisted de-escalation guidance during difficult conversations with a loved one." />
      <div className="min-h-screen bg-background">
        <div className="border-b bg-card/50">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
            <Button variant="ghost" size="sm" className="h-8 gap-1.5" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4" /> Home
            </Button>
            <h2 className="text-sm font-semibold text-foreground">Conversation Coaching</h2>
            <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30 text-xs">Patent Pending</Badge>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-pink-600 flex items-center justify-center mx-auto shadow-lg">
              <Mic className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Conversation Coaching</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              FIIS offers in-the-moment coaching during live conversations with a loved one. Get grounded suggestions for what to say next, while remembering that judgment and safety decisions still belong to humans.
            </p>
          </div>

          {/* Demo conversation */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-foreground mb-2">Demo: Live Coaching Session</h2>
              <p className="text-sm text-muted-foreground mb-4">FIIS offers in-the-moment guidance during a text conversation</p>
              <div className="space-y-3 max-w-lg mx-auto">
                {coachingDemo.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'you' ? 'justify-end' : msg.role === 'fiis' ? 'justify-center' : 'justify-start'}`}>
                    {msg.type === 'coaching' ? (
                      <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 max-w-sm">
                        <div className="flex items-center gap-1 mb-1">
                          <Brain className="h-3 w-3 text-primary" />
                          <span className="text-xs font-semibold text-primary">FIIS Coaching</span>
                        </div>
                        <p className="text-xs text-foreground/80 leading-relaxed">{msg.text}</p>
                      </div>
                    ) : (
                      <div className={`rounded-lg p-3 max-w-xs ${msg.role === 'you' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                        <p className="text-sm">{msg.text}</p>
                        <span className="text-xs opacity-70 mt-1 block">{msg.time}</span>
                      </div>
                    )}
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
              <p className="text-sm text-muted-foreground">Try conversation coaching in the family demo environment.</p>
              <Button onClick={() => navigate('/demo/family')} className="gap-2">View Family Demo <ArrowLeft className="h-4 w-4 rotate-180" /></Button>
            </CardContent>
          </Card>
        </div>
        <BrandedFooter />
      </div>
    </>
  );
};

export default ConversationCoaching;
