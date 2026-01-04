import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Check, Crown, ExternalLink } from 'lucide-react';
import familyBridgeLogo from '@/assets/familybridge-logo.png';

const Subscription = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

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
                  <li key={index} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Pricing Options */}
            <Card className="cursor-pointer hover:border-primary/50 transition-all">
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
