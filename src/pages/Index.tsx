import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';
import { useProviderAdmin } from '@/hooks/useProviderAdmin';
import { BrandedHeader } from '@/components/BrandedHeader';
import { BrandedFooter } from '@/components/BrandedFooter';
import { SEOHead, createOrganizationSchema } from '@/components/SEOHead';
import { Shield, Users, DollarSign, MessageCircle, Eye, MapPin, ArrowRight, HelpCircle, Building2, Check, Play, LogOut, Brain, Sparkles, TrendingUp, MessageSquareWarning, Heart, ChevronDown } from 'lucide-react';
import { RecoveryIcon } from '@/components/icons/RecoveryIcon';
import familyBridgeLogo from '@/assets/familybridge-logo.png';

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const { organization, isWhiteLabeled } = useOrganization();
  const { isProvider } = useProviderAdmin();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
  };

  const handleDashboardClick = () => {
    navigate('/moderator-dashboard');
  };

  const features = [
    {
      icon: Brain,
      title: 'AI Pattern Intelligence',
      description: 'Our AI analyzes family interactions to identify concerning patterns early—helping you intervene before a crisis, not after.',
      highlight: true,
      gradient: 'from-violet-500 to-purple-600',
    },
    {
      icon: MessageSquareWarning,
      title: 'AI-Powered Chat Moderation',
      description: 'Real-time AI filters harmful language and abuse, keeping conversations constructive. Toxic messages are caught before they cause damage.',
      highlight: true,
      gradient: 'from-rose-500 to-pink-600',
    },
    {
      icon: Sparkles,
      title: 'Smart Behavioral Insights',
      description: 'AI tracks check-ins, financial requests, and communication patterns to surface early warning signs and positive trends automatically.',
      highlight: true,
      gradient: 'from-amber-500 to-orange-600',
    },
    {
      icon: DollarSign,
      title: 'Transparent Financial Requests',
      description: 'No more money arguments. AI monitors request patterns for red flags while family voting ensures accountability.',
      gradient: 'from-emerald-500 to-teal-600',
    },
    {
      icon: MapPin,
      title: 'Verified Meeting Check-Ins',
      description: 'Location-verified recovery meeting attendance builds trust. AI tracks patterns to celebrate consistency or flag concerns.',
      gradient: 'from-blue-500 to-cyan-600',
    },
    {
      icon: Shield,
      title: 'Professional Oversight Ready',
      description: 'Professionals in private practice, treatment centers and recovery programs can access AI-generated insights to provide better guidance during difficult family conversations.',
      gradient: 'from-primary to-accent',
    },
  ];

  const stats = [
    { value: '24/7', label: 'AI Monitoring' },
    { value: '100%', label: 'Private & Secure' },
    { value: 'Real-time', label: 'Pattern Detection' },
  ];

  const appName = isWhiteLabeled && organization ? organization.name : 'FamilyBridge';
  const tagline = isWhiteLabeled && organization?.tagline 
    ? organization.tagline 
    : 'A safe space for families affected by addiction to communicate, set boundaries, and support their loved ones on the path to recovery.';

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <SEOHead 
        title="FamilyBridge - Recovery Support for Families"
        description="FamilyBridge helps families support loved ones in recovery with AI-powered pattern detection, transparent communication, financial coordination, and accountability tools."
        canonicalPath="/"
        structuredData={createOrganizationSchema()}
      />
      {/* Animated Background Elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/5 via-background to-accent/5" />
        <div className="absolute top-20 -left-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-40 -right-20 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '-3s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-primary/5 to-transparent rounded-full" />
      </div>

      {/* Header */}
      <header className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 relative z-10">
        <nav className="flex items-center justify-between backdrop-blur-sm bg-card/30 rounded-2xl px-4 py-2 border border-border/50 shadow-soft">
          <BrandedHeader showHomeButton={false} />
          <div className="flex items-center gap-1.5 sm:gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              className="px-2 sm:px-3 hover:bg-primary/10 text-muted-foreground hover:text-foreground transition-colors" 
              onClick={() => navigate('/demo')}
            >
              Demo
            </Button>
            {user ? (
              <>
                <Button 
                  size="sm" 
                  onClick={handleDashboardClick} 
                  className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
                >
                  Dashboard
                </Button>
                <Button variant="ghost" size="sm" className="px-2 sm:px-3 text-muted-foreground hover:text-foreground hover:bg-destructive/10 transition-colors" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline ml-1">Sign Out</span>
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="px-2 sm:px-3 text-muted-foreground hover:text-foreground transition-colors" 
                  onClick={() => navigate('/auth')}
                >
                  Sign In
                </Button>
                <Button 
                  size="sm" 
                  className="px-2 sm:px-3 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300" 
                  onClick={() => navigate('/family-purchase')}
                >
                  <span className="hidden sm:inline">Get Started</span>
                  <span className="sm:hidden">Start</span>
                </Button>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-8 sm:pt-12 pb-12 sm:pb-16 text-center relative">
        {/* Decorative elements */}
        <div className="absolute top-10 left-10 w-20 h-20 border-2 border-primary/20 rounded-full animate-pulse-soft hidden lg:block" />
        <div className="absolute top-40 right-20 w-12 h-12 bg-accent/20 rounded-lg rotate-45 animate-float hidden lg:block" style={{ animationDelay: '-2s' }} />
        <div className="absolute bottom-20 left-1/4 w-8 h-8 bg-primary/30 rounded-full animate-bounce-subtle hidden lg:block" />
        
        <div className="max-w-4xl mx-auto relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-primary/10 to-accent/10 backdrop-blur-sm border border-primary/20 text-primary px-5 py-2 rounded-full text-sm font-medium mb-4 sm:mb-6 animate-fade-in shadow-soft">
            <Heart className="h-4 w-4 animate-pulse-soft" />
            Supporting families through recovery
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-foreground mb-4 leading-tight animate-slide-up">
            Healing Starts with{' '}
            <span className="relative">
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-shimmer">
                Connection
              </span>
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 5.5C47.6667 2.16667 141.4 -2.1 199 5.5" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" className="animate-fade-in" style={{ animationDelay: '0.5s' }}/>
              </svg>
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed animate-fade-in" style={{ animationDelay: '0.2s' }}>
            {tagline}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <Button 
              size="lg" 
              onClick={() => navigate('/family-purchase')}
              className="group bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 transition-all duration-300 hover:-translate-y-1"
            >
              Start Your Journey
              <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              onClick={() => navigate('/auth')}
              className="backdrop-blur-sm bg-card/50 hover:bg-card border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              Already a Member
            </Button>
          </div>

          {/* Stats Row */}
          <div className="flex flex-wrap justify-center gap-6 md:gap-12 mt-8 sm:mt-10 animate-fade-in" style={{ animationDelay: '0.6s' }}>
            {stats.map((stat, index) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl md:text-3xl font-display font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 animate-bounce-subtle">
          <ChevronDown className="h-6 w-6 text-muted-foreground/50" />
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-10 sm:py-14 relative">
        <div className="text-center mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-500/10 to-purple-500/10 backdrop-blur-sm border border-violet-500/20 text-violet-600 dark:text-violet-400 px-5 py-2 rounded-full text-sm font-medium mb-3 sm:mb-4">
            <Brain className="h-4 w-4" />
            FIIS Powered by Advanced AI <span className="text-violet-500/70 dark:text-violet-400/70">(patent pending)</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-3">
            Intelligent Tools for{' '}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Recovery</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            AI-powered insights help families catch warning signs early and celebrate progress together.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group relative rounded-2xl p-6 bg-card/80 backdrop-blur-sm border border-border/50 shadow-card hover:shadow-elevated transition-all duration-500 hover:-translate-y-2 animate-fade-in overflow-hidden"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Gradient overlay on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
              
              {/* Icon */}
              <div className={`relative w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="h-7 w-7 text-white" />
              </div>
              
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-xl font-display font-semibold text-foreground">
                    {feature.title}
                  </h3>
                  {feature.highlight && (
                    <span className="text-xs bg-gradient-to-r from-violet-500/20 to-purple-500/20 text-violet-600 dark:text-violet-400 px-2.5 py-1 rounded-full font-medium border border-violet-500/20">
                      AI
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Links Section */}
      <section className="container mx-auto px-4 py-8 sm:py-10">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Demo */}
          <div 
            className="group relative bg-card/80 backdrop-blur-sm rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 cursor-pointer border border-border/50 shadow-card hover:shadow-elevated transition-all duration-300 hover:-translate-y-1 overflow-hidden"
            onClick={() => navigate('/demo')}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="flex items-center gap-5 relative z-10">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Play className="h-7 w-7 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-display font-semibold text-foreground mb-1">
                  Try the Demo
                </h3>
                <p className="text-muted-foreground">
                  Explore a sample family group to see how FamilyBridge works
                </p>
              </div>
            </div>
            <Button 
              size="sm" 
              className="relative z-10 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 transition-all duration-300 border-0"
            >
              View Demo
              <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </section>

      {/* Provider Section */}
      <section className="container mx-auto px-4 py-8 sm:py-12">
        <div className="max-w-4xl mx-auto relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-3xl blur-xl" />
          <div className="relative bg-card/90 backdrop-blur-sm border border-border/50 rounded-3xl p-8 md:p-12 shadow-elevated overflow-hidden">
            {/* Decorative corner elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-accent/10 to-transparent rounded-tr-full" />
            
            <div className="flex flex-col md:flex-row items-start md:items-center gap-8 relative z-10">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0 shadow-xl">
                <Building2 className="h-10 w-10 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-3">
                  Are You a Recovery Provider?
                </h3>
                <p className="text-lg text-muted-foreground mb-6">
                  Help families in your care with professional tools for communication and accountability.
                </p>
                <ul className="grid sm:grid-cols-2 gap-3 mb-8">
                  {[
                    'Create and manage your organization',
                    'Onboard unlimited families',
                    'Custom branding for your organization',
                    'Access to all provider tools',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-muted-foreground">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <Check className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  onClick={() => navigate('/provider-purchase')}
                  className="group bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground shadow-lg"
                >
                  Learn More
                  <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-10 sm:py-14">
        <div className="max-w-4xl mx-auto text-center relative">
          {/* Animated background */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] animate-shimmer rounded-3xl" />
          <div className="absolute inset-[2px] bg-gradient-to-br from-primary to-accent rounded-3xl" />
          
          <div className="relative z-10 p-10 md:p-16">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-medium text-primary-foreground mb-6">
              <Heart className="h-4 w-4" />
              Join thousands of families
            </div>
            <h2 className="text-3xl md:text-5xl font-display font-bold text-primary-foreground mb-6">
              Your Family's Recovery{' '}
              <span className="block">Starts Here</span>
            </h2>
            <p className="text-xl text-primary-foreground/90 mb-10 max-w-2xl mx-auto">
              Join families rebuilding trust through transparent, AI-moderated communication.
            </p>
            <Button 
              size="lg" 
              className="group bg-card text-primary hover:bg-card/90 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:-translate-y-1"
              onClick={() => navigate('/family-purchase')}
            >
              Create Your Family Group
              <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </section>

      <BrandedFooter />
    </div>
  );
};

export default Index;
