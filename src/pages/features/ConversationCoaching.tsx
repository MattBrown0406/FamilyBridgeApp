import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mic, MessageSquare, Shield, Zap, Brain, Eye, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SEOHead } from '@/components/SEOHead';
import { BrandedFooter } from '@/components/BrandedFooter';

const coachingDemo = [
  { role: 'them', text: '"You don\'t understand what I\'m going through. Nobody does."', time: '2:14 PM' },
  { role: 'fiis', text: 'De-escalation opportunity detected. Avoid defending yourself. Try: "You\'re right — I may not fully understand. Can you help me?"', time: '2:14 PM', type: 'coaching' },
  { role: 'you', text: '"You\'re right, I probably don\'t fully understand. I want to though. Can you help me see what you\'re dealing with?"', time: '2:15 PM' },
  { role: 'them', text: '"...I\'m just tired. Everything feels impossible right now."', time: '2:16 PM' },
  { role: 'fiis', text: 'Resistance dropping. They shifted from defensive to vulnerable. Do NOT push for solutions yet. Validate the feeling. Stay in the moment.', time: '2:16 PM', type: 'coaching' },
];

const features = [
  { icon: Zap, title: 'Real-Time Guidance', description: 'FIIS analyzes the conversation as it happens and surfaces coaching prompts within seconds — helping you navigate difficult moments without saying the wrong thing.' },
  { icon: Brain, title: 'De-Escalation Scripts', description: 'Proven language patterns drawn from CRAFT, motivational interviewing, and clinical intervention frameworks. Not generic advice — specific words for specific moments.' },
  { icon: Eye, title: 'Tone Detection', description: 'AI reads emotional tone in text messages and flags shifts: defensive → vulnerable, angry → exhausted, resistant → curious. Each shift is a coaching opportunity.' },
  { icon: Shield, title: '"Warm Exit" Strategies', description: 'When a conversation is heading toward damage, FIIS provides exit strategies that preserve the relationship while protecting your boundaries.' },
  { icon: AlertTriangle, title: 'Enabling Detection', description: 'Real-time alerts when your language patterns shift toward enabling: over-explaining, apologizing for boundaries, or offering to rescue.' },
  { icon: MessageSquare, title: 'Screenshot Coaching', description: 'Upload a screenshot of a text conversation. FIIS analyzes the exchange and provides coaching on what to say next — with context-aware suggestions.' },
];

const ConversationCoaching = () => {
  const navigate = useNavigate();

  return (
    <>
      <SEOHead title="Conversation Coaching | FamilyBridge" description="Real-time AI-powered de-escalation guidance during difficult conversations with a resistant loved one." />
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
              Real-time FIIS coaching during live conversations with a resistant loved one. Know exactly what to say — and what not to say — when every word matters.
            </p>
          </div>

          {/* Demo conversation */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-foreground mb-2">Demo: Live Coaching Session</h2>
              <p className="text-sm text-muted-foreground mb-4">FIIS provides real-time guidance during a text conversation</p>
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
