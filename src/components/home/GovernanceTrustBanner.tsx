import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Eye, RotateCcw } from 'lucide-react';

const pillars = [
  { icon: Shield, label: 'Volatility-Aware', desc: 'Adapts only when signals stabilize' },
  { icon: Lock, label: 'Privacy-Safe', desc: 'HIPAA-compliant, de-identified learning' },
  { icon: Eye, label: 'Fully Transparent', desc: 'Every AI change is explainable' },
  { icon: RotateCcw, label: 'Auditable & Reversible', desc: 'Full history with rollback capability' },
];

const GovernanceTrustBanner = () => {
  const navigate = useNavigate();

  return (
    <section className="py-10 sm:py-14">
      <div className="container mx-auto px-4">
        <div
          className="max-w-5xl mx-auto bg-muted/40 border border-border/50 rounded-2xl p-6 sm:p-8 cursor-pointer hover:border-primary/20 transition-colors"
          onClick={() => navigate('/ai-governance')}
        >
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-semibold px-3 py-1.5 rounded-full mb-3">
              <Shield className="h-3.5 w-3.5" />
              AI Governance Built In
            </div>
            <h3 className="text-lg sm:text-xl font-display font-bold text-foreground mb-1.5">
              Intelligence you can trust
            </h3>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto">
              Every AI adaptation is proportional to evidence strength, transparent to administrators, and reversible at any time.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {pillars.map((p) => {
              const Icon = p.icon;
              return (
                <div key={p.label} className="text-center">
                  <div className="w-9 h-9 rounded-lg bg-card border border-border/50 flex items-center justify-center mx-auto mb-2">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">{p.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{p.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default GovernanceTrustBanner;
