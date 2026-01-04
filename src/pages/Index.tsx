import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';
import { useProviderAdmin } from '@/hooks/useProviderAdmin';
import { BrandedHeader } from '@/components/BrandedHeader';
import { BrandedFooter } from '@/components/BrandedFooter';
import { Shield, Users, DollarSign, MessageCircle, Eye, MapPin, ArrowRight, HelpCircle, Building2, Check, Play, Sparkles } from 'lucide-react';
import familyBridgeLogo from '@/assets/familybridge-logo.png';

const Index = () => {
  const { user, loading } = useAuth();
  const { organization, isWhiteLabeled } = useOrganization();
  const { isProvider } = useProviderAdmin();
  const navigate = useNavigate();

  const handleDashboardClick = () => {
    if (isProvider) {
      navigate('/provider-admin');
    } else {
      navigate('/dashboard');
    }
  };

  const features = [
    {
      icon: MessageCircle,
      title: 'Moderated Family Chat',
      description: 'A private space where family members communicate without fear. Our AI filters harmful language in real-time, keeping conversations constructive and healing-focused.',
    },
    {
      icon: MapPin,
      title: 'Meeting Check-Ins',
      description: 'Your loved one can check in at recovery meetings with verified location sharing. Build trust through accountability while respecting their journey.',
    },
    {
      icon: DollarSign,
      title: 'Transparent Financial Requests',
      description: 'No more money arguments. Requests are visible to all family members, with voting and payment confirmation—eliminating hidden transactions and building financial trust.',
    },
    {
      icon: Shield,
      title: 'Professional Moderation',
      description: 'Licensed counselors or case managers can oversee your family group, providing guidance during difficult conversations and intervening when needed.',
    },
    {
      icon: Users,
      title: 'Shared Values & Boundaries',
      description: 'Collaboratively define what matters most to your family. Set clear boundaries together and hold each other accountable with love, not judgment.',
    },
    {
      icon: Sparkles,
      title: 'Recovery-Focused Design',
      description: 'Built by families who understand addiction. Every feature supports the delicate balance between supporting recovery and preventing enabling behaviors.',
    },
  ];

  const appName = isWhiteLabeled && organization ? organization.name : 'FamilyBridge';
  const tagline = isWhiteLabeled && organization?.tagline 
    ? organization.tagline 
    : 'A safe space for families affected by addiction to communicate, set boundaries, and support their loved ones on the path to recovery.';

  return (
    <div className="min-h-screen gradient-hero">
      {/* Header */}
      <header className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
        <nav className="flex items-center justify-between">
          <BrandedHeader />
          <div className="flex items-center gap-1.5 sm:gap-3">
            <Button variant="ghost" size="sm" className="px-2 sm:px-3" onClick={() => navigate('/demo')}>
              Demo
            </Button>
            {user ? (
              <Button variant="hero" size="sm" onClick={handleDashboardClick}>
                Dashboard
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" className="px-2 sm:px-3" onClick={() => navigate('/auth')}>
                  Sign In
                </Button>
                <Button variant="hero" size="sm" className="px-2 sm:px-3" onClick={() => navigate('/family-purchase')}>
                  <span className="hidden sm:inline">Get Started</span>
                  <span className="sm:hidden">Start</span>
                </Button>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 text-center">
        <div className="max-w-3xl mx-auto animate-slide-up">
          <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-4 leading-tight">
            Healing Starts with{' '}
            <span className="text-primary">Connection</span>
          </h1>
          <p className="text-base md:text-lg text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            {tagline}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="hero" size="lg" onClick={() => navigate('/family-purchase')}>
              Start Your Journey
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate('/auth')}>
              Already a Member
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-2">
            Tools for Recovery
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Everything your family needs for healthy communication and accountability.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="bg-card rounded-xl p-5 shadow-card hover:shadow-elevated transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <feature.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-display font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Meeting Finder Link */}
      <section className="container mx-auto px-4 py-10 space-y-4">
        <div 
          className="max-w-3xl mx-auto bg-secondary/30 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 cursor-pointer hover:bg-secondary/50 transition-colors"
          onClick={() => navigate('/meetings')}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <MapPin className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-display font-semibold text-foreground">
                Find a Recovery Meeting
              </h3>
              <p className="text-sm text-muted-foreground">
                Search for AA, Al-Anon, and other 12-step meetings near you
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm">
            Find Meetings
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        {/* Enabling Exercise Link */}
        <div 
          className="max-w-3xl mx-auto bg-secondary/30 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 cursor-pointer hover:bg-secondary/50 transition-colors"
          onClick={() => navigate('/enabling-exercise')}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <HelpCircle className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-display font-semibold text-foreground">
                Am I Enabling?
              </h3>
              <p className="text-sm text-muted-foreground">
                Learn to identify crisis vs. chaos and understand healthy boundaries
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm">
            Take Exercise
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        {/* Demo Family Link */}
        <div 
          className="max-w-3xl mx-auto bg-secondary/30 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 cursor-pointer hover:bg-secondary/50 transition-colors"
          onClick={() => navigate('/demo')}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Play className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-display font-semibold text-foreground">
                Try the Demo
              </h3>
              <p className="text-sm text-muted-foreground">
                Explore a sample family group to see how FamilyBridge works
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm">
            View Demo
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </section>

      {/* Provider Subscription Section */}
      <section className="container mx-auto px-4 py-10">
        <div className="max-w-3xl mx-auto bg-card border border-border rounded-2xl p-6 md:p-8 shadow-card">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Building2 className="h-7 w-7 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-display font-bold text-foreground mb-2">
                Are You a Recovery Provider?
              </h3>
              <p className="text-muted-foreground mb-4">
                Help families in your care with professional tools for communication and accountability.
              </p>
              <ul className="grid sm:grid-cols-2 gap-2 mb-4">
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>Create and manage your organization</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>Onboard unlimited families</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>Custom branding for your organization</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>Access to all provider tools</span>
                </li>
              </ul>
              <Button variant="outline" onClick={() => navigate('/provider-purchase')}>
                Learn More
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto text-center bg-primary rounded-2xl p-8 md:p-12 shadow-elevated">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-primary-foreground mb-4">
            Your Family's Recovery Starts Here
          </h2>
          <p className="text-primary-foreground/90 mb-6 max-w-xl mx-auto">
            Join families rebuilding trust through transparent, moderated communication.
          </p>
          <Button 
            size="lg" 
            className="bg-card text-primary hover:bg-card/90 shadow-elevated"
            onClick={() => navigate('/family-purchase')}
          >
            Create Your Own Family Group
          </Button>
        </div>
      </section>

      <BrandedFooter />
    </div>
  );
};

export default Index;
