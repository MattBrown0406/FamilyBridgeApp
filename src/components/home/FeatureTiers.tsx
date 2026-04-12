import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Brain, Eye, Activity, FileText, Crosshair, Target, Zap, Mic,
  Users, Shield, BarChart3, ChevronRight, ClipboardCheck, AlertTriangle,
  MessageSquare, BookOpen
} from 'lucide-react';

interface Feature {
  label: string;
  icon: React.ElementType;
}

interface TierCard {
  title: string;
  question: string;
  answer: string;
  icon: React.ElementType;
  gradient: string;
  features: Feature[];
  link: string;
}

const tiers: {
  label: string;
  tagline: string;
  description: string;
  accentColor: string;
  cards: TierCard[];
}[] = [
  {
    label: 'Core Intelligence',
    tagline: 'See what others miss',
    description: 'Pattern spotting and decision support that turn raw signals into clearer family context.',
    accentColor: 'from-violet-500 to-indigo-600',
    cards: [
      {
        title: 'FIIS™ Pattern Detection',
        question: "What's really happening?",
        answer: 'Highlights behavioral shifts, emotional patterns, and concern signals across your family system so you can respond earlier and more calmly.',
        icon: Brain,
        gradient: 'from-violet-500 to-purple-600',
        features: [
          { label: 'Emotional pattern detection', icon: Eye },
          { label: 'Recovery trajectory tracking', icon: Activity },
          { label: 'Smart document analysis', icon: FileText },
        ],
        link: '/features/fiis-intelligence',
      },
      {
        title: 'Outcome Predictions',
        question: "What might happen next?",
        answer: 'Estimates likely friction points, treatment follow-through, and recovery strain, then suggests areas to review with human judgment.',
        icon: BarChart3,
        gradient: 'from-emerald-500 to-teal-600',
        features: [
          { label: 'Treatment completion probability', icon: BarChart3 },
          { label: 'Relapse risk forecasting', icon: Activity },
          { label: 'Actionable recommendations', icon: Zap },
        ],
        link: '/outcome-predictions?demo=true',
      },
    ],
  },
  {
    label: 'Action Systems',
    tagline: 'Act at the right moment',
    description: 'Tools that turn insight into coordinated action for families, providers, and interventionists.',
    accentColor: 'from-rose-500 to-orange-500',
    cards: [
      {
        title: 'Intervention Readiness',
        question: 'Is it time to intervene?',
        answer: 'Surfaces timing and readiness signals so families can plan carefully, not react only from emotion.',
        icon: Crosshair,
        gradient: 'from-rose-500 to-orange-500',
        features: [
          { label: 'Readiness scoring (0-100)', icon: Target },
          { label: 'Execution planning', icon: Zap },
          { label: 'Real-time conversation coaching', icon: Mic },
        ],
        link: '/intervention-readiness?demo=true',
      },
      {
        title: 'Accountability Engine',
        question: 'Is everyone doing their part?',
        answer: 'Tracks behavioral consistency for families and providers so commitments can be reviewed more clearly over time.',
        icon: Target,
        gradient: 'from-amber-500 to-orange-500',
        features: [
          { label: 'Family accountability scoring', icon: Users },
          { label: 'Provider performance tracking', icon: Shield },
          { label: 'Behavioral contracts', icon: FileText },
        ],
        link: '/accountability-engine?demo=true',
      },
    ],
  },
  {
    label: 'Platform Integrity',
    tagline: 'Trust the system',
    description: 'Systems that help the platform learn carefully, keep data cleaner, and ground recommendations in reviewable signals.',
    accentColor: 'from-blue-500 to-slate-600',
    cards: [
      {
        title: 'AI Learning Layer',
        question: 'What has the platform learned?',
        answer: 'Privacy-safe, de-identified pattern learning highlights what seems to help and what may not across cases.',
        icon: Brain,
        gradient: 'from-blue-500 to-indigo-600',
        features: [
          { label: 'Privacy-preserving insights', icon: Shield },
          { label: 'Cross-case pattern learning', icon: Eye },
          { label: 'Recommendation evolution', icon: Activity },
        ],
        link: '/ai-learning',
      },
      {
        title: 'Input Reconciliation',
        question: 'Is the data accurate?',
        answer: 'Detects vague, incomplete, or contradictory input — and prompts for the clarity needed to keep guidance accurate.',
        icon: ClipboardCheck,
        gradient: 'from-slate-500 to-gray-700',
        features: [
          { label: 'Contradiction detection', icon: AlertTriangle },
          { label: 'Depth prompting', icon: MessageSquare },
          { label: 'Data confidence scoring', icon: BarChart3 },
        ],
        link: '/input-reconciliation',
      },
    ],
  },
];

const FeatureTiers = () => {
  const navigate = useNavigate();

  return (
    <section className="py-14 sm:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10 sm:mb-16">
          <p className="text-xs sm:text-sm font-medium text-primary uppercase tracking-wider mb-2">
            The Full System
          </p>
          <h2 className="text-2xl sm:text-4xl font-display font-bold text-foreground mb-3">
            Six questions. Three layers. One intelligent platform.
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
            Every layer builds on the last, from seeing what is happening, to acting on it, to keeping the system itself trustworthy.
          </p>
        </div>

        <div className="space-y-12 sm:space-y-20 max-w-5xl mx-auto">
          {tiers.map((tier, tierIdx) => (
            <div key={tier.label}>
              {/* Tier header */}
              <div className="flex items-center gap-3 mb-5 sm:mb-7">
                <div className={`h-8 w-1 rounded-full bg-gradient-to-b ${tier.accentColor}`} />
                <div>
                  <h3 className="text-lg sm:text-xl font-display font-bold text-foreground">
                    {tier.label}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">{tier.tagline}</p>
                </div>
              </div>

              {/* Tier cards */}
              <div className="grid md:grid-cols-2 gap-4 sm:gap-5">
                {tier.cards.map((card) => {
                  const CardIcon = card.icon;
                  return (
                    <div
                      key={card.title}
                      className="group bg-card border border-border/50 rounded-xl p-5 sm:p-6 hover:border-primary/30 hover:shadow-lg transition-all duration-300 cursor-pointer"
                      onClick={() => navigate(card.link)}
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${card.gradient} flex items-center justify-center shrink-0`}>
                          <CardIcon className="h-4.5 w-4.5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-muted-foreground mb-0.5">{card.question}</p>
                          <h4 className="text-base sm:text-lg font-display font-bold text-foreground leading-tight">
                            {card.title}
                          </h4>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                        {card.answer}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {card.features.map((f) => {
                          const FIcon = f.icon;
                          return (
                            <span
                              key={f.label}
                              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-md border border-border/30"
                            >
                              <FIcon className="h-3 w-3 text-primary/70" />
                              {f.label}
                            </span>
                          );
                        })}
                      </div>
                      <div className="mt-4 flex items-center text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                        Explore <ChevronRight className="h-3 w-3 ml-0.5" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureTiers;
