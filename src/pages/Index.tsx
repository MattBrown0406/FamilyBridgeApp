import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';
import { useProviderAdmin } from '@/hooks/useProviderAdmin';
import { BrandedHeader } from '@/components/BrandedHeader';
import { BrandedFooter } from '@/components/BrandedFooter';
import { SEOHead, createOrganizationSchema } from '@/components/SEOHead';
import { Shield, Users, DollarSign, MessageCircle, Eye, MapPin, ArrowRight, HelpCircle, Building2, Check, Play, LogOut, Brain, Sparkles, TrendingUp, MessageSquareWarning, Heart, ChevronDown, FileText, Pill, GitBranch, Activity, Vote, Clock } from 'lucide-react';
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
      title: 'FIIS Recovery Intelligence',
      description: 'AI analyzes emotional patterns and behavioral signals to surface recovery insights before crises.',
      highlight: true,
      gradient: 'from-violet-500 to-purple-600',
      badge: 'Patent Pending',
      forProvider: true,
    },
    {
      icon: Activity,
      title: 'Recovery Trajectory Tracking',
      description: 'Visual progress tracking toward the 1-year sobriety milestone with phase progression.',
      highlight: true,
      gradient: 'from-emerald-500 to-teal-600',
    },
    {
      icon: FileText,
      title: 'Smart Document Analysis',
      description: 'FIIS automatically extracts boundaries and commitments from intervention letters.',
      highlight: true,
      gradient: 'from-rose-500 to-pink-600',
      forProvider: true,
    },
    {
      icon: Pill,
      title: 'Medication Compliance',
      description: 'AI label scanning, dose tracking, and family alerts for missed medications.',
      highlight: true,
      gradient: 'from-amber-500 to-orange-600',
    },
    {
      icon: MapPin,
      title: 'Meeting Check-Ins',
      description: 'GPS-verified recovery meeting attendance with automatic family notifications.',
      gradient: 'from-blue-500 to-cyan-600',
      forFamily: true,
    },
    {
      icon: Vote,
      title: 'Financial Coordination',
      description: 'Family voting on financial requests with receipt uploads and pledge tracking.',
      gradient: 'from-indigo-500 to-violet-600',
      forFamily: true,
    },
    {
      icon: GitBranch,
      title: 'Care Transitions',
      description: 'Seamless handoffs between providers with outcome tracking and success scoring.',
      gradient: 'from-cyan-500 to-blue-600',
      forProvider: true,
    },
    {
      icon: MessageSquareWarning,
      title: 'Secure Communication',
      description: 'Real-time AI moderation with emotional tone analysis across conversations.',
      gradient: 'from-primary to-accent',
    },
  ];

  const stats = [
    { value: '365', label: 'Day Recovery Goal' },
    { value: '24/7', label: 'FIIS Monitoring' },
    { value: 'HIPAA', label: 'Compliant' },
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
        <div className="absolute top-20 -left-20 w-48 sm:w-96 h-48 sm:h-96 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-40 -right-20 w-40 sm:w-80 h-40 sm:h-80 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '-3s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] sm:w-[800px] h-[400px] sm:h-[800px] bg-gradient-radial from-primary/5 to-transparent rounded-full" />
      </div>

      {/* Header */}
      <header className="container mx-auto px-2 sm:px-4 py-2 sm:py-4 relative z-10">
        <nav className="flex items-center justify-between backdrop-blur-sm bg-card/30 rounded-xl sm:rounded-2xl px-2 sm:px-4 py-1.5 sm:py-2 border border-border/50 shadow-soft">
          <BrandedHeader showHomeButton={false} />
          <div className="flex items-center gap-1 sm:gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              className="px-1.5 sm:px-3 h-8 text-xs sm:text-sm hover:bg-primary/10 text-muted-foreground hover:text-foreground transition-colors" 
              onClick={() => navigate('/demo')}
            >
              Demo
            </Button>
            {user ? (
              <>
                <Button 
                  size="sm" 
                  onClick={handleDashboardClick} 
                  className="h-8 px-2 sm:px-3 text-xs sm:text-sm bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
                >
                  <span className="hidden xs:inline">Dashboard</span>
                  <span className="xs:hidden">Go</span>
                </Button>
                <Button variant="ghost" size="sm" className="px-1.5 sm:px-3 h-8 text-muted-foreground hover:text-foreground hover:bg-destructive/10 transition-colors" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline ml-1">Sign Out</span>
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="px-1.5 sm:px-3 h-8 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors" 
                  onClick={() => navigate('/auth')}
                >
                  <span className="hidden xs:inline">Sign In</span>
                  <span className="xs:hidden">Login</span>
                </Button>
                <Button 
                  size="sm" 
                  className="h-8 px-2 sm:px-3 text-xs sm:text-sm bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300" 
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
      <section className="container mx-auto px-2 sm:px-4 pt-4 sm:pt-12 pb-8 sm:pb-16 text-center relative">
        {/* Decorative elements - hidden on mobile */}
        <div className="absolute top-10 left-10 w-20 h-20 border-2 border-primary/20 rounded-full animate-pulse-soft hidden lg:block" />
        <div className="absolute top-40 right-20 w-12 h-12 bg-accent/20 rounded-lg rotate-45 animate-float hidden lg:block" style={{ animationDelay: '-2s' }} />
        <div className="absolute bottom-20 left-1/4 w-8 h-8 bg-primary/30 rounded-full animate-bounce-subtle hidden lg:block" />
        
        <div className="max-w-4xl mx-auto relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-primary/10 to-accent/10 backdrop-blur-sm border border-primary/20 text-primary px-3 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium mb-3 sm:mb-6 animate-fade-in shadow-soft">
            <Heart className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-pulse-soft" />
            <span className="hidden xs:inline">Supporting families through recovery</span>
            <span className="xs:hidden">Family Recovery Support</span>
          </div>
          
          <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-display font-bold text-foreground mb-2 sm:mb-4 leading-tight animate-slide-up px-1">
            Healing Starts with{' '}
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-shimmer">
                Connection
              </span>
              <svg className="absolute -bottom-1 sm:-bottom-2 left-0 w-full" viewBox="0 0 200 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 5.5C47.6667 2.16667 141.4 -2.1 199 5.5" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" className="animate-fade-in" style={{ animationDelay: '0.5s' }}/>
              </svg>
            </span>
          </h1>
          
          <p className="text-sm sm:text-lg md:text-xl text-muted-foreground mb-4 sm:mb-8 max-w-2xl mx-auto leading-relaxed animate-fade-in px-1" style={{ animationDelay: '0.2s' }}>
            {tagline}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 justify-center px-2 sm:px-0 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <Button 
              size="default" 
              onClick={() => navigate('/family-purchase')}
              className="group h-10 sm:h-12 px-4 sm:px-6 text-sm sm:text-base bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 transition-all duration-300 hover:-translate-y-1"
            >
              Start Your Journey
              <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              variant="outline" 
              size="default" 
              onClick={() => navigate('/auth')}
              className="h-10 sm:h-12 px-4 sm:px-6 text-sm sm:text-base backdrop-blur-sm bg-card/50 hover:bg-card border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              Already a Member
            </Button>
          </div>

          {/* Stats Row */}
          <div className="flex justify-center gap-6 sm:gap-6 md:gap-12 mt-5 sm:mt-10 animate-fade-in" style={{ animationDelay: '0.6s' }}>
            {stats.map((stat, index) => (
              <div key={stat.label} className="text-center">
                <div className="text-xl sm:text-2xl md:text-3xl font-display font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator - hidden on mobile */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 animate-bounce-subtle hidden sm:block">
          <ChevronDown className="h-6 w-6 text-muted-foreground/50" />
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-2 sm:px-4 py-6 sm:py-14 relative">
        <div className="text-center mb-5 sm:mb-10">
          <div className="inline-flex flex-col items-center bg-gradient-to-r from-violet-500/10 to-purple-500/10 backdrop-blur-sm border border-violet-500/20 text-violet-600 dark:text-violet-400 px-4 sm:px-6 py-2 sm:py-3 rounded-2xl text-xs sm:text-sm font-medium mb-2 sm:mb-4">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Brain className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Family Intervention Intelligence System</span>
              <span className="xs:hidden">FIIS Technology</span>
            </div>
            <span className="text-[10px] sm:text-xs text-violet-500/70 dark:text-violet-400/70 mt-0.5">Patent Pending</span>
          </div>
          <h2 className="text-xl xs:text-2xl sm:text-3xl md:text-5xl font-display font-bold text-foreground mb-2 sm:mb-3 px-1">
            Intelligent Tools for{' '}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Recovery</span>
          </h2>
          <p className="text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
            AI-powered clinical insights for families and providers across the recovery journey.
          </p>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group relative rounded-lg sm:rounded-xl p-3 sm:p-4 bg-card/80 backdrop-blur-sm border border-border/50 shadow-card hover:shadow-elevated transition-all duration-300 hover:-translate-y-1 animate-fade-in overflow-hidden"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Gradient overlay on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
              
              {/* Header with icon and badges */}
              <div className="flex items-start gap-2 sm:gap-3 mb-2 sm:mb-3 relative">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br ${feature.gradient} flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300 flex-shrink-0`}>
                  <feature.icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm sm:text-base font-display font-semibold text-foreground leading-tight">
                    {feature.title}
                  </h3>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {feature.badge && (
                      <span className="text-[9px] sm:text-[10px] bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-full font-medium border border-amber-500/20">
                        {feature.badge}
                      </span>
                    )}
                    {feature.highlight && !feature.badge && (
                      <span className="text-[9px] sm:text-[10px] bg-gradient-to-r from-violet-500/20 to-purple-500/20 text-violet-600 dark:text-violet-400 px-1.5 py-0.5 rounded-full font-medium border border-violet-500/20">
                        AI
                      </span>
                    )}
                    {feature.forFamily && (
                      <span className="text-[9px] sm:text-[10px] bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-full font-medium border border-emerald-500/20">
                        Family
                      </span>
                    )}
                    {feature.forProvider && (
                      <span className="text-[9px] sm:text-[10px] bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded-full font-medium border border-blue-500/20">
                        Provider
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed relative">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Links Section */}
      <section className="container mx-auto px-2 sm:px-4 py-4 sm:py-10">
        <div className="max-w-4xl mx-auto space-y-3 sm:space-y-4">
          {/* Demo */}
          <div 
            className="group relative bg-card/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-6 flex flex-row items-center justify-between gap-3 cursor-pointer border border-border/50 shadow-card hover:shadow-elevated transition-all duration-300 hover:-translate-y-1 overflow-hidden"
            onClick={() => navigate('/demo')}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="flex items-center gap-3 sm:gap-5 relative z-10 flex-1 min-w-0">
              <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                <Play className="h-4 w-4 sm:h-7 sm:w-7 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base sm:text-xl font-display font-semibold text-foreground mb-0 sm:mb-1 truncate">
                  Try the Demo
                </h3>
                <p className="text-xs sm:text-base text-muted-foreground line-clamp-1 sm:line-clamp-none">
                  Explore a sample family group
                </p>
              </div>
            </div>
            <Button 
              size="sm" 
              className="relative z-10 h-8 sm:h-9 px-2 sm:px-4 text-xs sm:text-sm bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 transition-all duration-300 border-0 flex-shrink-0"
            >
              <span className="hidden xs:inline">View Demo</span>
              <span className="xs:hidden">Demo</span>
              <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </section>

      {/* Provider Section */}
      <section className="container mx-auto px-2 sm:px-4 py-4 sm:py-12">
        <div className="max-w-4xl mx-auto relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-xl sm:rounded-3xl blur-xl" />
          <div className="relative bg-card/90 backdrop-blur-sm border border-border/50 rounded-xl sm:rounded-3xl p-4 sm:p-8 md:p-12 shadow-elevated overflow-hidden">
            {/* Decorative corner elements - smaller on mobile */}
            <div className="absolute top-0 right-0 w-16 sm:w-32 h-16 sm:h-32 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full" />
            <div className="absolute bottom-0 left-0 w-12 sm:w-24 h-12 sm:h-24 bg-gradient-to-tr from-accent/10 to-transparent rounded-tr-full" />
            
            <div className="flex flex-col md:flex-row items-start md:items-center gap-3 sm:gap-8 relative z-10">
              <div className="w-12 h-12 sm:w-20 sm:h-20 rounded-lg sm:rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0 shadow-xl">
                <Building2 className="h-6 w-6 sm:h-10 sm:w-10 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg xs:text-xl sm:text-2xl md:text-3xl font-display font-bold text-foreground mb-1.5 sm:mb-3">
                  Are You a Recovery Provider?
                </h3>
                <p className="text-xs sm:text-lg text-muted-foreground mb-3 sm:mb-6">
                  Help families in your care with professional tools for communication and accountability.
                </p>
                <ul className="grid grid-cols-1 xs:grid-cols-2 gap-1.5 sm:gap-3 mb-4 sm:mb-8">
                  {[
                    'FIIS clinical insights dashboard',
                    'Care transition & handoff management',
                    'Provider outcome success scoring',
                    'Custom branding & white-label',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-1.5 sm:gap-3 text-xs sm:text-base text-muted-foreground">
                      <div className="w-4 h-4 sm:w-6 sm:h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <Check className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 text-primary" />
                      </div>
                      <span className="line-clamp-1">{item}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  onClick={() => navigate('/provider-purchase')}
                  className="group h-9 sm:h-11 text-sm sm:text-base bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground shadow-lg w-full sm:w-auto"
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
      <section className="container mx-auto px-2 sm:px-4 py-6 sm:py-14">
        <div className="max-w-4xl mx-auto text-center relative">
          {/* Animated background */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] animate-shimmer rounded-xl sm:rounded-3xl" />
          <div className="absolute inset-[2px] bg-gradient-to-br from-primary to-accent rounded-xl sm:rounded-3xl" />
          
          <div className="relative z-10 p-5 sm:p-10 md:p-16">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-white/20 backdrop-blur-sm px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium text-primary-foreground mb-3 sm:mb-6">
              <Heart className="h-3 w-3 sm:h-4 sm:w-4" />
              Join thousands of families
            </div>
            <h2 className="text-xl xs:text-2xl sm:text-3xl md:text-5xl font-display font-bold text-primary-foreground mb-3 sm:mb-6 px-1">
              Your Family's Recovery{' '}
              <span className="block">Starts Here</span>
            </h2>
            <p className="text-sm sm:text-xl text-primary-foreground/90 mb-5 sm:mb-10 max-w-2xl mx-auto px-1">
              Join families rebuilding trust through transparent, AI-moderated communication.
            </p>
            <Button 
              size="default" 
              className="group h-10 sm:h-12 px-4 sm:px-6 text-sm sm:text-base bg-card text-primary hover:bg-card/90 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:-translate-y-1 w-full sm:w-auto"
              onClick={() => navigate('/family-purchase')}
            >
              Create Your Family Group
              <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </section>

      <BrandedFooter />
    </div>
  );
};

export default Index;
