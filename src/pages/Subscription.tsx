import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Check, Crown, Bell } from 'lucide-react';
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
    'Multiple days of professional interventionist-moderated family support included',
    'Drug and alcohol testing coordination and tracking (coming soon)',
    'Family support phone & video consultations with your assigned moderator',
    'Priority crisis response and 24/7 escalation support',
    'Advanced financial tracking and accountability tools',
    'Extended message history and family communication archives',
    'Custom meeting reminders and recovery milestone tracking',
    'Access to exclusive family recovery resources and educational content',
  ];

  const handleWaitlistSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedEmail = email.trim().toLowerCase();
    
    // Basic email validation
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
        // Add to Mailchimp in background
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
    <div className="min-h-screen bg-background">
      <header className="container mx-auto px-4 py-4 border-b border-border">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate(-1)}>
            <img src={familyBridgeLogo} alt="FamilyBridge" className="h-7 w-auto object-contain" />
            <span className="text-lg font-display font-semibold text-foreground">FamilyBridge</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </nav>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="shadow-elevated">
          <CardHeader className="text-center">
            <Crown className="h-12 w-12 text-primary mx-auto mb-4" />
            <CardTitle className="text-2xl font-display">Premium Subscription</CardTitle>
            <CardDescription className="text-base">
              Unlock all features and support families on their recovery journey
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Features List */}
            <div className="bg-secondary/30 rounded-lg p-4">
              <h4 className="font-display font-semibold mb-3">What you get:</h4>
              <ul className="text-sm text-muted-foreground space-y-2">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Pricing Options */}
            <Card className="border-primary/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-display font-semibold">Monthly Plan</h3>
                    <p className="text-sm text-muted-foreground">Billed monthly, cancel anytime</p>
                  </div>
                  <div className="text-right">
                    <p className="font-display font-bold text-lg">$499</p>
                    <p className="text-xs text-muted-foreground">per month</p>
                  </div>
                </div>
                <Button 
                  variant="hero" 
                  className="w-full mt-4"
                  disabled
                >
                  Coming Soon
                </Button>
              </CardContent>
            </Card>

            {/* Waitlist Signup */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Bell className="h-5 w-5 text-primary" />
                  <h3 className="font-display font-semibold">Get Notified</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Join our waitlist to be the first to know when Premium launches.
                </p>
                
                {isSubscribed ? (
                  <div className="flex items-center gap-2 text-primary bg-primary/10 rounded-lg p-3">
                    <Check className="h-5 w-5" />
                    <span className="text-sm font-medium">You're on the waitlist!</span>
                  </div>
                ) : (
                  <form onSubmit={handleWaitlistSignup} className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="flex-1"
                      maxLength={255}
                      required
                    />
                    <Button 
                      type="submit" 
                      variant="default"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Joining...' : 'Notify Me'}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>

            {/* Info */}
            <div className="text-center pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">
                All payments are securely processed through Square. 
                Your subscription can be managed from your account settings.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Subscription;
