import { Link } from 'react-router-dom';
import { Pill, Vote, GitBranch, MessageSquare, Activity, FileText } from 'lucide-react';

const tools = [
  { icon: Pill, label: 'Medication Consistency', desc: 'User-directed schedules and reminders', link: '/features/medication-compliance' },
  { icon: Vote, label: 'Financial Coordination', desc: 'Family voting & receipt tracking', link: '/features/financial-coordination' },
  { icon: GitBranch, label: 'Care Transitions', desc: 'Authorized provider handoffs', link: '/features/care-transitions' },
  { icon: MessageSquare, label: 'Conversation Coaching', desc: 'Calmer, non-shaming prompts', link: '/features/conversation-coaching' },
  { icon: Activity, label: 'Recovery Trajectory', desc: 'Documented progress and concerns', link: '/features/recovery-trajectory' },
  { icon: FileText, label: 'Document Analysis', desc: 'AI-assisted document review', link: '/features/document-analysis' },
];

const AdditionalTools = () => {
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
              <Link
                key={tool.label}
                to={tool.link}
                className="group block p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all duration-200"
                aria-label={`Learn about FamilyBridge ${tool.label}`}
              >
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/15 transition-colors">
                  <ToolIcon className="h-4 w-4 text-primary" />
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-0.5">{tool.label}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{tool.desc}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default AdditionalTools;
