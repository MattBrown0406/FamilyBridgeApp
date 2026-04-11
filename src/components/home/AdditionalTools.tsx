import { useNavigate } from 'react-router-dom';
import { Pill, Vote, GitBranch, MessageSquare, Activity, FileText } from 'lucide-react';

const tools = [
  { icon: Pill, label: 'Medication Compliance', desc: 'AI label scanning & dose tracking', link: '/features/medication-compliance' },
  { icon: Vote, label: 'Financial Coordination', desc: 'Family voting & receipt tracking', link: '/features/financial-coordination' },
  { icon: GitBranch, label: 'Care Transitions', desc: 'Seamless provider handoffs', link: '/features/care-transitions' },
  { icon: MessageSquare, label: 'Conversation Coaching', desc: 'Real-time de-escalation', link: '/features/conversation-coaching' },
  { icon: Activity, label: 'Recovery Trajectory', desc: 'Long-term progress mapping', link: '/features/recovery-trajectory' },
  { icon: FileText, label: 'Document Analysis', desc: 'AI-powered clinical review', link: '/features/document-analysis' },
];

const AdditionalTools = () => {
  const navigate = useNavigate();

  return (
    <section className="py-10 sm:py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-3xl font-display font-bold text-foreground mb-2">
            And everything else you need
          </h2>
          <p className="text-sm text-muted-foreground">Purpose-built tools across the full recovery journey.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-4xl mx-auto">
          {tools.map((tool) => {
            const ToolIcon = tool.icon;
            return (
              <div
                key={tool.label}
                className="group p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-md transition-all duration-200 cursor-pointer"
                onClick={() => navigate(tool.link)}
              >
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/15 transition-colors">
                  <ToolIcon className="h-4 w-4 text-primary" />
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-0.5">{tool.label}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{tool.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default AdditionalTools;
