import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Check, Crown, Bell, Sparkles, Shield, Phone, Calendar, MessageCircle, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import familyBridgeLogo from '@/assets/familybridge-logo.png';

const Subscription = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [email, setEmail] = useState(user?.email || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const features = [
    {
      icon: Shield,
      title: 'Professional Moderation',
      description: 'Multiple days of interventionist-moderated family support included',
    },
    {
      icon: Calendar,
      title: 'Drug & Alcohol Testing',
      description: 'Coordination and tracking for accountability (coming soon)',
    },
    {
      icon: Phone,
      title: 'Consultations',
      description: 'Phone & video sessions with your assigned moderator',
    },
    {
      icon: Sparkles,
      title: 'Priority Support',
      description: '24/7 crisis response and escalation support',
    },
    {
      icon: FileText,
      title: 'Advanced Tracking',
      description: 'Financial tracking and accountability tools',
    },
    {
      icon: MessageCircle,
      title: 'Extended Archives',
      description: 'Full message history and communication records',
    },
  ];

  const handleWaitlistSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedEmail = email.trim().toLowerCase();
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (trimmedEmail.length > 255) {
      toast.error('Email address is too long');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('premium_waitlist')
        .insert({ email: trimmedEmail });

      if (error) {
        if (error.code === '23505') {
          toast.info("You're already on the waitlist! We'll notify you when we launch.");
          setIsSubscribed(true);
        } else {
          throw error;
        }
      } else {
        supabase.functions.invoke('add-to-mailchimp', {
          body: { email: trimmedEmail }
        }).then(({ error: mailchimpError }) => {
          if (mailchimpError) {
            console.error('Mailchimp sync error:', mailchimpError);
          }
        });
        
        toast.success("You're on the list! We'll notify you when Premium launches.");
        setIsSubscribed(true);
      }
    } catch (error) {
      console.error('Waitlist signup error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 -left-40 w-60 h-60 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute -bottom-20 right-1/4 w-40 h-40 bg-primary/5 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <header className="relative container mx-auto px-4 py-4 border-b border-border/50 backdrop-blur-sm">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => navigate(-1)}>
            <img src={familyBridgeLogo} alt="FamilyBridge" className="h-7 w-auto object-contain transition-transform group-hover:scale-105" />
            <span className="text-lg font-display font-semibold text-foreground">FamilyBridge</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="hover:bg-primary/10">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </nav>
      </header>

      <main className="relative container mx-auto px-4 py-12 max-w-5xl">
        {/* Hero Section */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Sparkles className="h-4 w-4" />
            Premium Plan Coming Soon
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
            Elevate Your Family's
            <span className="block bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Recovery Journey
            </span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Professional support, advanced tools, and dedicated moderation to guide your family through recovery together.
          </p>
        </div>

        {/* Pricing Card */}
        <div className="flex justify-center mb-12">
          <Card className="relative overflow-hidden border-2 border-primary/30 shadow-2xl shadow-primary/10 w-full max-w-md animate-scale-in">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
            
            <CardContent className="relative p-8">
              <div className="flex items-center justify-center mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                  <div className="relative bg-gradient-to-br from-primary to-primary/80 p-4 rounded-full">
                    <Crown className="h-8 w-8 text-primary-foreground" />
                  </div>
                </div>
              </div>
              
              <h2 className="text-2xl font-display font-bold text-center mb-2">Premium Plan</h2>
              <p className="text-muted-foreground text-center text-sm mb-6">Everything you need for comprehensive family support</p>
              
              <div className="flex items-baseline justify-center gap-1 mb-6">
                <span className="text-5xl font-display font-bold">TBD</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              
              <Button 
                variant="hero" 
                className="w-full h-12 text-base font-semibold"
                disabled
              >
                Coming Soon
              </Button>
              
              <p className="text-xs text-muted-foreground text-center mt-4">
                Billed monthly • Cancel anytime
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Features Grid */}
        <div className="mb-12">
          <h3 className="text-xl font-display font-semibold text-center mb-8">Everything Included</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="group relative overflow-hidden border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="shrink-0 bg-primary/10 p-2.5 rounded-lg group-hover:bg-primary/20 transition-colors">
                      <feature.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-display font-semibold text-foreground mb-1">{feature.title}</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Waitlist Section */}
        <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent/5 animate-fade-in">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
          <CardContent className="p-8">
            <div className="max-w-lg mx-auto text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/10 rounded-full mb-4">
                <Bell className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-2xl font-display font-bold mb-2">Be the First to Know</h3>
              <p className="text-muted-foreground mb-6">
                Join our exclusive waitlist and get notified the moment Premium launches. Early subscribers get priority access.
              </p>
              
              {isSubscribed ? (
                <div className="flex items-center justify-center gap-3 text-primary bg-primary/10 rounded-xl p-4 animate-scale-in">
                  <div className="bg-primary/20 p-2 rounded-full">
                    <Check className="h-5 w-5" />
                  </div>
                  <span className="font-medium">You're on the waitlist! We'll be in touch soon.</span>
                </div>
              ) : (
                <form onSubmit={handleWaitlistSignup} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                  <Input
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 h-12 px-4 bg-background/80 border-border/50 focus:border-primary"
                    maxLength={255}
                    required
                  />
                  <Button 
                    type="submit" 
                    variant="default"
                    className="h-12 px-6 font-semibold whitespace-nowrap"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Joining...
                      </span>
                    ) : (
                      'Join Waitlist'
                    )}
                  </Button>
                </form>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Footer Info */}
        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>
            All payments are securely processed through Square.
            <br />
            Your subscription can be managed from your account settings.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Subscription;
