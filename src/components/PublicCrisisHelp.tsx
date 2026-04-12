import { AlertTriangle } from 'lucide-react';

interface PublicCrisisHelpProps {
  className?: string;
}

const PublicCrisisHelp = ({ className = '' }: PublicCrisisHelpProps) => {
  return (
    <div className={`rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 ${className}`.trim()}>
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-foreground">Need immediate crisis help?</p>
          <p className="text-sm text-muted-foreground mt-1">
            FamilyBridge is not an emergency, medical, or crisis response service. If someone may be in immediate danger, call 911 now. In the U.S. and Canada, call or text 988 for the Suicide & Crisis Lifeline.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PublicCrisisHelp;
