import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { BrandedFooter } from '@/components/BrandedFooter';
import { SEOHead } from '@/components/SEOHead';
import { AppStoreBadge, SiteHeader } from '@/components/site/SiteChrome';
import { familybridge } from '@/integrations/familybridge/client';
import { PLANS } from '@/lib/practicePlans';

type Result = {
  ok: boolean;
  plan?: string;
  period?: 'monthly' | 'quarterly' | 'annual';
  until?: string;
  renews?: boolean;
  pending?: boolean;
  error?: string;
};

const RENEWS = { monthly: 'every month', quarterly: 'every 3 months', annual: 'every year' } as const;

/** Square sends the practice owner here after paying. Activates the plan (idempotent; the webhook does the same). */
const PracticeBillingComplete = () => {
  const [params] = useSearchParams();
  const checkoutId = params.get('checkout');
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    if (!checkoutId) {
      setResult({ ok: false, error: 'This link is missing its checkout details.' });
      return;
    }
    let cancelled = false;
    (async () => {
      // Square can take a few seconds to mark the payment complete.
      for (let attempt = 0; attempt < 6 && !cancelled; attempt++) {
        const { data, error } = await familybridge.functions.invoke('practice-billing', { body: { action: 'finalize', checkoutId } });
        const r: Result = error ? { ok: false, error: 'We couldn’t confirm your payment yet.' } : (data as Result);
        if (r.ok || !r.pending || attempt === 5) {
          if (!cancelled) setResult(r);
          return;
        }
        await new Promise((res) => setTimeout(res, 2500));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [checkoutId]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead title="Practice billing | FamilyBridge" description="Confirming your FamilyBridge practice plan." canonicalPath="/practice-billing/complete" noIndex />
      <SiteHeader />
      <main className="flex-1 container mx-auto px-4 max-w-xl py-16 text-center">
        {!result ? (
          <>
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
            <p className="mt-4 text-foreground">Confirming your payment…</p>
          </>
        ) : result.ok ? (
          <>
            <CheckCircle2 className="mx-auto h-14 w-14 text-primary" />
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground">You’re all set</h1>
            <p className="mt-3 text-lg text-foreground">
              {PLANS.find((p) => p.id === result.plan)?.name ?? result.plan} is active through{' '}
              {new Date(result.until!).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.
            </p>
            <p className="mt-2 text-muted-foreground">
              {result.renews ? `It renews automatically ${RENEWS[result.period ?? 'monthly']}. Manage it anytime in Practice billing.` : 'We couldn’t set up automatic renewal, so we’ll be in touch before your plan ends.'}
            </p>
            <p className="mt-6 text-foreground">Open the FamilyBridge app — your practice has its new plan now.</p>
            <div className="mt-4 flex justify-center"><AppStoreBadge /></div>
          </>
        ) : (
          <>
            <AlertCircle className="mx-auto h-14 w-14 text-destructive" />
            <p className="mt-4 text-foreground">
              {result.pending ? 'Your payment is still processing. Your plan will switch on automatically in a few minutes.' : result.error}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Questions? Email <a className="font-semibold text-primary" href="mailto:matt@freedominterventions.com">matt@freedominterventions.com</a>.
            </p>
          </>
        )}
        <Link to="/practice-billing" className="mt-8 inline-block text-sm font-semibold text-primary hover:underline">Back to Practice billing</Link>
      </main>
      <BrandedFooter />
    </div>
  );
};

export default PracticeBillingComplete;
