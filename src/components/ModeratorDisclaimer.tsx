import { Shield, AlertCircle } from 'lucide-react';

interface ModeratorDisclaimerProps {
  moderatorName?: string;
}

export function ModeratorDisclaimer({ moderatorName }: ModeratorDisclaimerProps) {
  return (
    <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200/50 dark:border-blue-800/50 space-y-3">
      <div className="flex items-start gap-3">
        <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div className="space-y-2">
          <h4 className="font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">
            Certified Interventionist Moderator
            <AlertCircle className="h-4 w-4" />
          </h4>
          <p className="text-sm text-blue-800 dark:text-blue-200">
            {moderatorName ? `${moderatorName} has` : 'A certified professional interventionist has'} joined 
            this family group as your moderator.
          </p>
          <div className="text-sm text-blue-700 dark:text-blue-300 space-y-2">
            <p>
              <strong>Important Notice:</strong> While a formal HIPAA authorization is not typically required for
              a family-initiated group, your moderator is expected to handle what you share with care and discretion.
            </p>
            <p>
              Your moderator is expected to follow professional standards, including:
            </p>
            <ul className="list-disc ml-5 space-y-1 text-sm">
              <li>Handling family communications with care and discretion</li>
              <li>Respecting privacy expectations and applicable consent requirements</li>
              <li>Maintaining professional boundaries and ethical standards</li>
              <li>Supporting the family within the scope of the FamilyBridge service</li>
            </ul>
            <p className="mt-2 italic">
              If you have any questions about confidentiality, please reach out to your moderator directly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}