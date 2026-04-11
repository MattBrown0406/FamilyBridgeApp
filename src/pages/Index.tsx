import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlatform } from '@/hooks/usePlatform';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';
import { useProviderAdmin } from '@/hooks/useProviderAdmin';
import { BrandedHeader } from '@/components/BrandedHeader';
import { BrandedFooter } from '@/components/BrandedFooter';
import { SEOHead, createOrganizationSchema } from '@/components/SEOHead';
import {
  Shield, Users, ArrowRight, Building2, Check, LogOut, Brain,
  Heart, FileText, Pill, GitBranch, Activity, Vote, Mic, Crosshair,
  Target, BarChart3, Zap, ChevronRight, Eye, MessageSquare
} from 'lucide-react';
import familyBridgeLogo from '@/assets/familybridge-logo.png';

// ─── Journey steps: question-driven narrative ───
const journeySteps = [
  {
    question: "What's really happening?",
    answer: 'FIIS detects behavioral shifts, emotional patterns, and risk signals across your entire family system — before a crisis hits.',
    icon: Brain,
    color: 'from-violet-500 to-purple-600',
    features: [
      { label: 'Emotional pattern detection', icon: Eye },
      { label: 'Recovery trajectory tracking', icon: Activity },
      { label: 'Smart document analysis', icon: FileText },
    ],
    link: '/features/fiis-intelligence',
  },
  {
    question: 'Is it time to intervene?',
    answer: 'The Readiness Engine identifies when resistance is weakening and intervention timing is optimal — so you act at the right moment, not the emotional one.',
    icon: Crosshair,
    color: 'from-rose-500 to-orange-500',
    features: [
      { label: 'Readiness scoring (0-100)', icon: Target },
      { label: 'Execution planning', icon: Zap },
      { label: 'Real-time conversation coaching', icon: Mic },
    ],
    link: '/intervention-readiness',
  },
  {
    question: 'Is everyone doing their part?',
    answer: 'The Accountability Engine scores behavioral consistency for families and providers — ensuring commitments are kept, not just made.',
    icon: Target,
    color: 'from-amber-500 to-orange-500',
    features: [
      { label: 'Family accountability scoring', icon: Users },
      { label: 'Provider performance tracking', icon: Shield },
      { label: 'Behavioral contracts', icon: FileText },
    ],
    link: '/accountability-engine',
  },
  {
    question: "What's going to happen next?",
    answer: 'The Outcome Prediction Engine forecasts treatment completion, relapse risk, and system failures — and tells you exactly what to change.',
    icon: BarChart3,
    color: 'from-emerald-500 to-teal-600',
    features: [
      { label: 'Treatment completion probability', icon: BarChart3 },
      { label: 'Relapse risk forecasting', icon: Activity },
      { label: 'Actionable recommendations', icon: Zap },
    ],
    link: '/outcome-predictions',
  },
];

const trustSignals = [
  { value: 'HIPAA', label: 'Compliant' },
  { value: '24/7', label: 'AI Monitoring' },
  { value: '365', label: 'Day Journey' },
];

const additionalTools = [
  { icon: Pill, label: 'Medication Compliance', desc: 'AI label scanning & dose tracking', link: '/features/medication-compliance' },
  { icon: Vote, label: 'Financial Coordination', desc: 'Family voting & receipt tracking', link: '/features/financial-coordination' },
  { icon: GitBranch, label: 'Care Transitions', desc: 'Seamless provider handoffs', link: '/features/care-transitions' },
  { icon: MessageSquare, label: 'Conversation Coaching', desc: 'Real-time de-escalation', link: '/features/conversation-coaching' },
];

const Index = () => {
  const { user, signOut } = useAuth();
  const { organization, isWhiteLabeled } = useOrganization();
  const { isProvider } = useProviderAdmin();
  const navigate = useNavigate();
  const { isNative, isIOS } = usePlatform();
  const paymentsWebOnly = isNative && isIOS;

  const [activeStep, setActiveStep] = useState(0);

  const tagline = isWhiteLabeled && organization?.tagline
    ? organization.tagline
    : 'A safe space for families affected by addiction to communicate, set boundaries, and support their loved ones on the path to recovery.';

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="FamilyBridge — Recovery Support for Families Affected by Addiction"
        description="FamilyBridge helps families support loved ones in recovery with AI-powered pattern detection, transparent communication, financial coordination, and accountability tools."
        canonicalPath="/"
        structuredData={createOrganizationSchema()}
      />

      {/* ━━━ NAV ━━━ */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border/40">
        <nav className="container mx-auto px-4 py-2.5 flex items-center justify-between">
          <BrandedHeader showHomeButton={false} />
          <div className="flex items-center gap-1.5 sm:gap-3">
            <Button variant="ghost" size="sm" className="h-8 text-xs sm:text-sm text-muted-foreground" onClick={() => navigate('/demo')}>
              Demo
            </Button>
            {user ? (
              <>
                <Button size="sm" onClick={() => navigate('/moderator-dashboard')} className="h-8 px-3 text-xs sm:text-sm bg-primary text-primary-foreground hover:bg-primary/90">
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
                <Button size="sm" className="h-8 px-3 text-xs sm:text-sm bg-primary text-primary-foreground" onClick={() => navigate(paymentsWebOnly ? '/auth' : '/family-purchase')}>
                  Get Started
                </Button>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* ━━━ HERO ━━━ */}
      <section className="relative overflow-hidden">
        {/* Subtle gradient orb */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="container mx-auto px-4 pt-12 sm:pt-20 pb-10 sm:pb-16 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-sm sm:text-base font-medium text-primary mb-4 tracking-wide uppercase">
              Recovery Intelligence Platform
            </p>
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-display font-bold text-foreground leading-[1.1] mb-5">
              See the full picture.{' '}
              <span className="text-primary">Act with clarity.</span>
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto mb-8 leading-relaxed">
              {tagline}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                size="lg"
                onClick={() => navigate(paymentsWebOnly ? '/auth' : '/family-purchase')}
                className="h-12 px-6 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 group"
              >
                Start Your Journey
                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate('/demo')}
                className="h-12 px-6"
              >
                See the Demo
              </Button>
            </div>
          </div>

          {/* Trust strip */}
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

      {/* ━━━ THE JOURNEY — Interactive Question-Driven Feature Tour ━━━ */}
      <section
        id="journey"
        ref={registerRef('journey')}
        className={`py-12 sm:py-20 transition-all duration-700 ${isVisible('journey') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      >
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 sm:mb-12">
            <p className="text-xs sm:text-sm font-medium text-primary uppercase tracking-wider mb-2">The Questions That Matter</p>
            <h2 className="text-2xl sm:text-4xl font-display font-bold text-foreground">
              Four questions. One intelligent system.
            </h2>
          </div>

          <div className="max-w-5xl mx-auto">
            {/* Step selector — horizontal on desktop, stacked on mobile */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-6 sm:mb-8">
              {journeySteps.map((step, i) => (
                <button
                  key={i}
                  onClick={() => setActiveStep(i)}
                  className={`relative text-left p-3 sm:p-4 rounded-xl border transition-all duration-300 ${
                    activeStep === i
                      ? 'bg-card border-primary/40 shadow-md ring-1 ring-primary/20'
                      : 'bg-card/50 border-border/50 hover:border-border hover:bg-card/80'
                  }`}
                >
                  {/* Active indicator line */}
                  {activeStep === i && (
                    <div className={`absolute top-0 left-3 right-3 h-0.5 rounded-full bg-gradient-to-r ${step.color}`} />
                  )}
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`text-xs font-bold ${activeStep === i ? 'text-primary' : 'text-muted-foreground'}`}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <p className={`text-xs sm:text-sm font-semibold leading-tight ${activeStep === i ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {step.question}
                  </p>
                </button>
              ))}
            </div>

            {/* Active step detail */}
            {journeySteps.map((step, i) => (
              activeStep === i && (
                <div
                  key={i}
                  className="bg-card border border-border/50 rounded-2xl p-5 sm:p-8 shadow-sm animate-fade-in"
                >
                  <div className="flex flex-col md:flex-row gap-6 md:gap-10">
                    {/* Left: narrative */}
                    <div className="flex-1">
                      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br ${step.color} mb-4`}>
                        <step.icon className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="text-xl sm:text-2xl font-display font-bold text-foreground mb-3">
                        {step.question}
                      </h3>
                      <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-5">
                        {step.answer}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="group"
                        onClick={() => navigate(step.link)}
                      >
                        Explore
                        <ChevronRight className="h-3.5 w-3.5 ml-1 group-hover:translate-x-0.5 transition-transform" />
                      </Button>
                    </div>

                    {/* Right: feature pills */}
                    <div className="md:w-64 flex flex-col gap-2.5">
                      {step.features.map((f) => (
                        <div
                          key={f.label}
                          className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border/30"
                        >
                          <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                            <f.icon className="h-4 w-4 text-primary" />
                          </div>
                          <span className="text-sm font-medium text-foreground">{f.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ MORE TOOLS — compact grid ━━━ */}
      <section
        id="tools"
        ref={registerRef('tools')}
        className={`py-10 sm:py-16 bg-muted/30 transition-all duration-700 ${isVisible('tools') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      >
        <div className="container mx-auto px-4">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-3xl font-display font-bold text-foreground mb-2">
              And everything else you need
            </h2>
            <p className="text-sm text-muted-foreground">Purpose-built tools across the full recovery journey.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto">
            {additionalTools.map((tool) => (
              <div
                key={tool.label}
                className="group p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-md transition-all duration-200 cursor-pointer"
                onClick={() => navigate(tool.link)}
              >
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/15 transition-colors">
                  <tool.icon className="h-4.5 w-4.5 text-primary" />
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-0.5">{tool.label}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{tool.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ PROVIDER CTA ━━━ */}
      <section
        id="provider"
        ref={registerRef('provider')}
        className={`py-12 sm:py-20 transition-all duration-700 ${isVisible('provider') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      >
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto bg-card border border-border/50 rounded-2xl p-6 sm:p-10 relative overflow-hidden">
            {/* Corner accent */}
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
                  {[
                    'FIIS clinical insights dashboard',
                    'Care transition & handoff management',
                    'Provider outcome success scoring',
                    'Custom branding & white-label',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => navigate(paymentsWebOnly ? '/auth' : '/provider-purchase')}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 group"
                >
                  Learn More
                  <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━ FINAL CTA ━━━ */}
      <section
        id="cta"
        ref={registerRef('cta')}
        className={`py-12 sm:py-20 transition-all duration-700 ${isVisible('cta') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      >
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center bg-primary rounded-2xl p-8 sm:p-14 relative overflow-hidden">
            {/* Subtle pattern */}
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
                Join families and providers who are using intelligence — not guesswork — to support recovery.
              </p>
              <Button
                size="lg"
                className="h-12 px-6 bg-card text-foreground hover:bg-card/90 shadow-xl group"
                onClick={() => navigate(paymentsWebOnly ? '/auth' : '/family-purchase')}
              >
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
