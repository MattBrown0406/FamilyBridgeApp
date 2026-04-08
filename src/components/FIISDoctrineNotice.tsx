import { AlertTriangle, Shield } from 'lucide-react';
import { FIIS_BOUNDARY_DOCTRINE, FIIS_ESCALATION_LEVELS, FIIS_GUARDRAIL_COPY } from '@/lib/fiisDoctrine';

interface FIISDoctrineNoticeProps {
  compact?: boolean;
  className?: string;
}

export function FIISDoctrineNotice({ compact = false, className = '' }: FIISDoctrineNoticeProps) {
  return (
    <div className={`rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30 ${className}`.trim()}>
      <div className="flex items-start gap-2">
        <Shield className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-300" />
        <div className="space-y-2 text-sm text-amber-900 dark:text-amber-200">
          <p>
            <strong>FIIS guardrails:</strong> {FIIS_GUARDRAIL_COPY}
          </p>

          {!compact && (
            <>
              <div>
                <p className="font-medium">Boundary doctrine</p>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-xs">
                  {FIIS_BOUNDARY_DOCTRINE.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="flex items-center gap-1 font-medium">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Escalation ladder
                </p>
                <ul className="mt-1 space-y-1 text-xs">
                  {FIIS_ESCALATION_LEVELS.map((item) => (
                    <li key={item.level}>
                      <strong>Level {item.level} — {item.label}:</strong> {item.description}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
