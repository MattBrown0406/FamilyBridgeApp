import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
import AnimatedHomeHero from '@/components/home/AnimatedHomeHero';
import PublicCrisisHelp from '@/components/PublicCrisisHelp';
import familyBridgeLogo from '@/assets/familybridge-logo.png';
import { ArrowRight, Building2, Check, LogOut, Heart, Phone } from 'lucide-react';

const APP_STORE_URL = 'https://apps.apple.com/app/id6744403069';

const AppStoreBadge = ({ className = '' }: { className?: string }) => (
  <a
    href={APP_STORE_URL}
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Download FamilyBridge on the App Store"
    className={`inline-block shrink-0 ${className}`}
  >
    <svg xmlns="http://www.w3.org/2000/svg" width="135" height="40" viewBox="0 0 135 40" aria-hidden="true">
      <rect width="135" height="40" rx="8" fill="#000" />
      <text x="67.5" y="13" textAnchor="middle" fill="#fff" fontSize="8" fontFamily="-apple-system,BlinkMacSystemFont,'Helvetica Neue',sans-serif" letterSpacing="0.3">Download on the</text>
      <text x="67.5" y="27" textAnchor="middle" fill="#fff" fontSize="16" fontWeight="600" fontFamily="-apple-system,BlinkMacSystemFont,'Helvetica Neue',sans-serif">App Store</text>
      <path d="M18.5 10.5c.8-1 1.3-2.3 1.2-3.7-1.2.1-2.7.8-3.5 1.9-.8.9-1.4 2.3-1.2 3.6 1.3.1 2.7-.6 3.5-1.8zm1.2 2c-2-.1-3.6 1.1-4.6 1.1s-2.4-1-4-1c-2 0-3.9 1.2-4.9 3-2.1 3.6-.5 9 1.5 12 1 1.4 2.2 3 3.7 2.9 1.5-.1 2-.9 3.8-.9s2.2.9 3.8.9c1.6 0 2.6-1.4 3.6-2.9.7-1 1.3-2.1 1.7-3.3-2.5-1-3.8-3.4-3.6-5.8z" fill="#fff" />
    </svg>
  </a>
);

const GooglePlaySoon = ({ className = '' }: { className?: string }) => (
  <div className={`inline-flex items-center gap-2 px-4 h-[40px] rounded-lg bg-black/90 border border-white/10 shrink-0 ${className}`}>
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 3.5v17l9-8.5-9-8.5z" fill="#4CAF50" />
      <path d="M3 3.5l9 8.5 5.5-5.2L3 3.5z" fill="#2196F3" />
      <path d="M3 20.5l14.5-8.7-5.5-5.3L3 20.5z" fill="#F44336" />
      <path d="M12 12l5.5 5.2L3 20.5 12 12z" fill="#FFC107" />
    </svg>
    <div className="flex flex-col leading-none">
      <span className="text-[9px] text-white/60 font-medium tracking-wide uppercase">Coming Soon</span>
      <span className="text-[13px] text-white font-semibold leading-tight">Google Play</span>
    </div>
  </div>
);

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
        title="FamilyBridge — Family Recovery Support and Coordination"
        description="FamilyBridge helps families support a loved one in recovery through communication, coordinated actions, clear boundaries, and authorized professional collaboration."
        canonicalPath="/"
        structuredData={createOrganizationSchema()}
      />

      {/* NAV */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border/40">
        <nav className="container mx-auto px-4 py-2.5 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex shrink-0 items-center gap-2 text-left"
            aria-label="FamilyBridge home"
          >
            <img
              src={familyBridgeLogo}
              alt="FamilyBridge"
              className="h-7 sm:h-8 w-auto object-contain"
            />
            <span className="hidden sm:inline text-base sm:text-lg font-display font-semibold text-foreground">
              FamilyBridge
            </span>
          </button>
          <div className="flex items-center gap-1.5 sm:gap-3">
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex h-8 text-xs sm:text-sm text-muted-foreground" onClick={() => navigate('/demo')}>
              Demo
            </Button>
            <Button variant="ghost" size="sm" className="h-8 px-2 sm:px-3 text-xs sm:text-sm text-muted-foreground" asChild>
              <a href="tel:458-298-8003" aria-label="Call us at 458-298-8003">
                <Phone className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Call</span>
              </a>
            </Button>
            {/* App Store badge — desktop only in nav */}
            <a
              href={APP_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Download on the App Store"
              className="hidden lg:flex items-center gap-1.5 h-8 px-3 rounded-md bg-foreground text-background text-xs font-semibold hover:bg-foreground/90 transition-colors shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              App Store
            </a>
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
                <Button variant="ghost" size="sm" className="h-8 text-xs sm:text-sm text-muted-foreground" onClick={() => navigate('/join')}>
                  Join with code
                </Button>
                <Button variant="ghost" size="sm" className="h-8 text-xs sm:text-sm text-muted-foreground" onClick={() => navigate('/auth')}>
                  Sign In
                </Button>
                <Button size="sm" className="hidden sm:inline-flex h-8 px-3 text-xs sm:text-sm bg-primary text-primary-foreground" onClick={() => navigate('/family-purchase')}>
                  Get Started
                </Button>
              </>
            )}
          </div>
        </nav>
      </header>

      <AnimatedHomeHero
        tagline={tagline}
        onStart={() => navigate('/family-purchase')}
        onDemo={() => navigate('/demo')}
      />

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
                  Help families in your care with structured tools for communication, shared commitments, and documented follow-through.
                </p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
                  {['Authorized family activity review', 'Care transition and handoff management', 'Documented support follow-through', 'Custom branding and white-label'].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
                  <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90 group">
                    <Link to="/for-providers">
                      FamilyBridge for treatment providers
                      <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Link>
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
                Use shared information, clear actions, and compassionate communication to support recovery.
              </p>
              <Button size="lg" className="h-12 px-6 bg-card text-foreground hover:bg-card/90 shadow-xl group" onClick={() => navigate('/family-purchase')}>
                Create Your Family Group
                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <div className="flex flex-row flex-wrap items-center justify-center gap-3 mt-5">
                <AppStoreBadge />
                <GooglePlaySoon />
              </div>
            </div>
          </div>
        </div>
      </section>

      <BrandedFooter />
    </div>
  );
};

export default Index;
