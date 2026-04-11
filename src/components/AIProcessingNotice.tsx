import { AlertTriangle } from 'lucide-react';

interface AIProcessingNoticeProps {
  subject: string;
  className?: string;
}

export function AIProcessingNotice({ subject, className = '' }: AIProcessingNoticeProps) {
  return (
    <div className={`rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100 ${className}`.trim()}>
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-300" />
        <p>
          <strong>AI processing notice:</strong> Anything you submit here, including {subject}, may be sent to FamilyBridge&apos;s AI service providers to generate suggestions or extract insights. Share only what you want processed, remove unrelated identifiers when you can, and review the output before acting. This is support content, not medical, legal, or crisis advice.
        </p>
      </div>
    </div>
  );
}
