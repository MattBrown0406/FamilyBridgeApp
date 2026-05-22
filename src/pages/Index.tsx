import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';
import { useProviderAdmin } from '@/hooks/useProviderAdmin';
import { supabase } from '@/integrations/supabase/client';
import { BrandedFooter } from '@/components/BrandedFooter';
import { SEOHead, createOrganizationSchema } from '@/components/SEOHead';
import FeatureTiers from '@/components/home/FeatureTiers';
import GovernanceTrustBanner from '@/components/home/GovernanceTrustBanner';
import AdditionalTools from '@/components/home/AdditionalTools';
import PublicCrisisHelp from '@/components/PublicCrisisHelp';
import familyBridgeLogo from '@/assets/familybridge-logo.png';
import {
  ArrowRight, Building2, Check, LogOut, Heart, Phone,
} from 'lucide-react';

const trustSignals = [
  { value: 'Private', label: 'By Design' },
  { value: '24/7', label: 'Pattern Support' },
  { value: '365', label: 'Day Journey' },
];

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const { organization, isWhiteLabeled } = useOrganization();
  const { isProvider, isLoading: isProviderLoading } = useProviderAdmin();
  const navigate = useNavigate();
  const [dashboardPath, setDashboardPath] = useState('/dashboard');
  const [isResolvingDashboard, setIsResolvingDashboard] = useState(false);

  useEffect(() => {
    const resolveDashboardPath = async () => {
      if (!user || isProviderLoading) {
        setDashboardPath('/dashboard');
        return;
      }

      if (isProvider) {
        setDashboardPath('/moderator-dashboard');
        return;
      }

      setIsResolvingDashboard(true);
      try {
        const { count, error } = await supabase
          .from('family_members')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('role', 'moderator');

        if (error) throw error;
        setDashboardPath((count || 0) > 0 ? '/moderator-dashboard' : '/dashboard');
      } catch (error) {
        console.error('Error resolving dashboard route:', error);
        setDashboardPath('/dashboard');
      } finally {
        setIsResolvingDashboard(false);
      }
    };

    void resolveDashboardPath();
  }, [isProvider, isProviderLoading, user]);

  const handleDashboardClick = () => {
    navigate(dashboardPath);
  };

  const tagline = isWhiteLabeled && organization?.tagline
    ? organization.tagline
    : 'A private space for families affected by addiction to communicate, set boundaries, and support loved ones with more clarity and consistency.';

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="FamilyBridge — Recovery Support for Families Affected by Addiction"
        description="FamilyBridge helps families support loved ones in recovery with AI-assisted pattern spotting, transparent communication, financial coordination, and accountability tools."
        canonicalPath="/"
        structuredData={createOrganizationSchema()}
      />

      {/* NAV */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border/40">
        <nav className="container mx-auto px-4 py-2.5 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-left"
            aria-label="FamilyBridge home"
          >
            <img
              src={familyBridgeLogo}
              alt="FamilyBridge"
              className="h-7 sm:h-8 w-auto object-contain"
            />
            <span className="text-base sm:text-lg font-display font-semibold text-foreground">
              FamilyBridge
            </span>
          </button>
          <div className="flex items-center gap-1.5 sm:gap-3">
            <Button variant="ghost" size="sm" className="h-8 text-xs sm:text-sm text-muted-foreground" onClick={() => navigate('/demo')}>
              Demo
            </Button>
            {user ? (
              <>
                <Button size="sm" onClick={handleDashboardClick} disabled={loading || isProviderLoading || isResolvingDashboard} className="h-8 px-3 text-xs sm:text-sm bg-primary text-primary-foreground hover:bg-primary/90">
                  Dashboard
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => signOut()}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" className="h-8 text-xs sm:text-sm text-muted-foreground" onClick={() => navigate('/auth')}>
                  Sign In
                </Button>
                <Button size="sm" className="h-8 px-3 text-xs sm:text-sm bg-primary text-primary-foreground" onClick={() => navigate('/family-purchase')}>
                  Get Started
                </Button>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="container mx-auto px-4 pt-12 sm:pt-20 pb-10 sm:pb-16 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="mb-4 text-center">
              <p className="text-base sm:text-lg font-semibold text-primary tracking-wide uppercase">
                Powered by FIIS™, patent-pending decision support
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Family Insight & Intervention System
              </p>
            </div>
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-display font-bold text-foreground leading-[1.1] mb-5">
              See the full picture.
              <br />
              <span className="text-primary">Act with clarity.</span>
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto mb-8 leading-relaxed">
              {tagline}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" onClick={() => navigate('/family-purchase')} className="h-12 px-6 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 group">
                Start Your Journey
                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="outline" size="lg" onClick={() => navigate('/demo')} className="h-12 px-6">
                See the Demo
              </Button>
            </div>
          </div>
          <div className="flex justify-center gap-8 sm:gap-12 mt-12 sm:mt-16">
            {trustSignals.map((t) => (
              <div key={t.label} className="text-center">
                <div className="text-xl sm:text-2xl font-display font-bold text-foreground">{t.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{t.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TIERED FEATURE SHOWCASE */}
      <FeatureTiers />

      {/* AI GOVERNANCE TRUST BANNER */}
      <GovernanceTrustBanner />

      {/* ADDITIONAL TOOLS */}
      <AdditionalTools />

      {/* PROVIDER CTA */}
      <section className="py-12 sm:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto bg-card border border-border/50 rounded-2xl p-6 sm:p-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full" />
            <div className="flex flex-col md:flex-row items-start gap-6 relative z-10">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Building2 className="h-7 w-7 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl sm:text-2xl font-display font-bold text-foreground mb-2">
                  Are you a recovery provider?
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground mb-5 max-w-lg">
                  Help families in your care with professional-grade tools for communication, accountability, and outcome tracking.
                </p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
                  {['FIIS pattern insights dashboard', 'Care transition & handoff management', 'Provider outcome tracking', 'Custom branding & white-label'].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
                  <Button onClick={() => navigate('/provider-purchase')} className="bg-primary text-primary-foreground hover:bg-primary/90 group">
                    Learn More
                    <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/features/provider-outcomes')}>
                    Provider outcomes demo
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/features/intervention-outcomes')}>
                    Intervention outcomes demo
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/features/fiis-guidance')}>
                    FIIS guidance demo
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-4 sm:pb-8">
        <div className="container mx-auto px-4 max-w-3xl">
          <PublicCrisisHelp />
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-12 sm:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center bg-primary rounded-2xl p-8 sm:p-14 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-4 left-4 w-24 h-24 border border-primary-foreground/30 rounded-full" />
              <div className="absolute bottom-6 right-8 w-16 h-16 border border-primary-foreground/20 rounded-full" />
            </div>
            <div className="relative z-10">
              <Heart className="h-8 w-8 text-primary-foreground/80 mx-auto mb-4" />
              <h2 className="text-2xl sm:text-4xl font-display font-bold text-primary-foreground mb-3">
                Recovery starts with seeing clearly.
              </h2>
              <p className="text-sm sm:text-base text-primary-foreground/80 mb-8 max-w-md mx-auto">
                Join families and providers who are using better information, not guesswork, to support recovery.
              </p>
              <Button size="lg" className="h-12 px-6 bg-card text-foreground hover:bg-card/90 shadow-xl group" onClick={() => navigate('/family-purchase')}>
                Create Your Family Group
                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      <BrandedFooter />
    </div>
  );
};

export default Index;
