import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import { ArrowRight, Building2, CheckCircle2, Loader2, Lock, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BrandedFooter } from '@/components/BrandedFooter';
import { SEOHead } from '@/components/SEOHead';
import { AppStoreBadge, SiteHeader } from '@/components/site/SiteChrome';
import { familybridge } from '@/integrations/familybridge/client';
import { PERIODS, PLANS, isPeriod, isPlan, usd, type Period, type PlanId } from '@/lib/practicePlans';

type Practice = { id: string; name: string };
type Status = {
  plan: PlanId | 'none';
  planUntil: string | null;
  billingPeriod: Period | null;
  source: 'apple' | 'square' | null;
  status: 'active' | 'canceling' | 'past_due' | 'canceled' | 'manual' | null;
  squareReady: boolean;
};

const CONTACT = 'matt@freedominterventions.com';
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

/** Calls the app backend's practice-billing function and surfaces its error message. */
async function billing<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await familybridge.functions.invoke('practice-billing', { body });
  if (error) {
    const ctx = (error as { context?: Response }).context;
    const msg = ctx ? ((await ctx.json().catch(() => null)) as { error?: string } | null)?.error : null;
    throw new Error(msg ?? error.message);
  }
  return data as T;
}

const Shell = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-background flex flex-col">
    <SEOHead title="Practice billing | FamilyBridge" description="Choose or manage your FamilyBridge practice plan." canonicalPath="/practice-billing" noIndex />
    <SiteHeader />
    <main className="flex-1 container mx-auto px-4 max-w-2xl py-12 sm:py-16">
      <p className="text-sm font-bold uppercase tracking-wider text-primary">Practice billing</p>
      {children}
    </main>
    <BrandedFooter />
  </div>
);

/**
 * Where a practice owner pays for a plan online (Square, auto-renewing) — the plans the App Store can't sell.
 * Signs in with their FamilyBridge app account so the payment attaches to the right practice.
 */
const PracticeBilling = () => {
  const [params] = useSearchParams();
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [practices, setPractices] = useState<Practice[] | null>(null);
  const [notOwner, setNotOwner] = useState(false);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const [plan, setPlan] = useState<PlanId>(isPlan(params.get('plan')) ? (params.get('plan') as PlanId) : 'practice');
  const [period, setPeriod] = useState<Period>(isPeriod(params.get('period')) ? (params.get('period') as Period) : 'annual');
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    familybridge.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = familybridge.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  // The practices this person owns (staff rows are readable by the signed-in person under the app's security rules).
  useEffect(() => {
    if (!session) return;
    (async () => {
      const { data } = await familybridge.from('org_staff').select('org_id, role, status, organizations(name)').eq('user_id', session.user.id);
      const rows = (data ?? []) as { org_id: string; role: string; status: string; organizations: { name: string } | { name: string }[] | null }[];
      const owned = rows
        .filter((r) => r.role === 'owner' && r.status === 'active')
        .map((r) => ({ id: r.org_id, name: (Array.isArray(r.organizations) ? r.organizations[0]?.name : r.organizations?.name) ?? 'Your practice' }));
      setNotOwner(rows.length > 0 && owned.length === 0);
      setPractices(owned);
      setOrgId((cur) => cur ?? owned[0]?.id ?? null);
    })();
  }, [session]);

  const loadStatus = useCallback(async () => {
    if (!orgId) return;
    setStatus(null);
    try {
      setStatus(await billing<Status>({ action: 'status', orgId }));
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    }
  }, [orgId]);
  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy('signin');
    setMsg(null);
    const { error } = await familybridge.auth.signInWithPassword({ email: email.trim(), password });
    if (error) setMsg(error.message === 'Invalid login credentials' ? 'That email and password don’t match a FamilyBridge account.' : error.message);
    setBusy(null);
  };

  const signOut = async () => {
    await familybridge.auth.signOut();
    setPractices(null);
    setOrgId(null);
    setStatus(null);
    setNotOwner(false);
  };

  const checkout = async () => {
    if (!orgId) return;
    setBusy('checkout');
    setMsg(null);
    try {
      const { url } = await billing<{ url: string }>({ action: 'checkout', orgId, plan, period, returnUrl: `${window.location.origin}/practice-billing/complete` });
      window.location.assign(url);
    } catch (e) {
      const code = e instanceof Error ? e.message : '';
      setMsg(
        code === 'apple_active'
          ? 'Your plan is billed through the App Store. To switch to online billing, cancel it on your iPhone first (Settings → your name → Subscriptions), then come back when it ends.'
          : code === 'already_on_plan'
            ? 'You’re already on this plan.'
            : code || 'That didn’t go through. Please try again.',
      );
      setBusy(null);
    }
  };

  const stopRenewing = async () => {
    if (!orgId) return;
    setBusy('cancel');
    setMsg(null);
    setNote(null);
    try {
      await billing({ action: 'cancel', orgId });
      setConfirmCancel(false);
      setNote('Automatic renewal is off. Your plan stays active until the end of the period you’ve paid for.');
      await loadStatus();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'That didn’t go through. Please try again.');
    } finally {
      setBusy(null);
    }
  };

  // ---- Not signed in ----
  if (session === undefined) {
    return (
      <Shell>
        <Loader2 className="mt-8 h-6 w-6 animate-spin text-primary" />
      </Shell>
    );
  }
  if (!session) {
    return (
      <Shell>
        <h1 className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">Sign in to choose your plan</h1>
        <p className="mt-3 text-muted-foreground">Use the email and password from your FamilyBridge app. Only the practice owner can buy or change the plan.</p>
        <form onSubmit={signIn} className="mt-8 rounded-2xl border border-border bg-card p-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="pb-email">Email</Label>
            <Input id="pb-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pb-password">Password</Label>
            <Input id="pb-password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {msg ? <p className="text-sm text-destructive">{msg}</p> : null}
          <Button type="submit" className="w-full" disabled={busy === 'signin'}>
            {busy === 'signin' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sign in'}
          </Button>
          <p className="text-sm text-muted-foreground">Forgot your password? Reset it from the sign-in screen in the FamilyBridge app.</p>
        </form>
        <div className="mt-8 rounded-2xl bg-secondary/60 p-6">
          <p className="font-semibold text-foreground">New to FamilyBridge?</p>
          <p className="mt-1 text-sm text-muted-foreground">Download the app, create your practice (start free with up to 3 families), then come back here to choose a plan.</p>
          <div className="mt-4"><AppStoreBadge /></div>
        </div>
      </Shell>
    );
  }

  const selected = PLANS.find((p) => p.id === plan)!;
  const per = PERIODS.find((p) => p.id === period)!;
  const price = selected.price[period];
  const active = !!status && status.plan !== 'none' && !!status.planUntil;
  const showPicker = !!status && !(active && status.source === 'apple') && status.squareReady;
  const renewingOnSquare = active && status?.source === 'square' && (status.status === 'active' || status.status === 'past_due');
  const statusLine = !status || !active
    ? null
    : status.status === 'canceling'
      ? `Won’t renew · ends ${fmtDate(status.planUntil!)}`
      : status.status === 'past_due'
        ? `Renewal payment failed — please update your card · paid through ${fmtDate(status.planUntil!)}`
        : status.status === 'active'
          ? `Renews automatically · paid through ${fmtDate(status.planUntil!)}`
          : `Paid through ${fmtDate(status.planUntil!)}`;

  return (
    <Shell>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">Your practice plan</h1>
        <button onClick={signOut} className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">Signed in as {session.user.email}</p>

      {practices === null ? (
        <Loader2 className="mt-8 h-6 w-6 animate-spin text-primary" />
      ) : practices.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-border bg-card p-6">
          <p className="font-semibold text-foreground">{notOwner ? 'Only your practice owner can manage the plan.' : 'There’s no practice on this account yet.'}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {notOwner ? 'Ask the owner of your practice to sign in here.' : 'Create your practice in the FamilyBridge app first, then come back to choose a plan.'}
          </p>
          {!notOwner ? <div className="mt-4"><AppStoreBadge /></div> : null}
        </div>
      ) : (
        <>
          {practices.length > 1 ? (
            <div className="mt-6 flex flex-wrap gap-2">
              {practices.map((p) => (
                <button key={p.id} onClick={() => setOrgId(p.id)} className={`rounded-full px-4 h-9 text-sm font-semibold border ${orgId === p.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-foreground'}`}>
                  {p.name}
                </button>
              ))}
            </div>
          ) : null}

          <div className="mt-6 rounded-2xl border border-border bg-card p-6">
            <p className="flex items-center gap-2 text-sm font-semibold text-muted-foreground"><Building2 className="h-4 w-4" /> {practices.find((p) => p.id === orgId)?.name}</p>
            {!status ? (
              <Loader2 className="mt-3 h-5 w-5 animate-spin text-primary" />
            ) : active ? (
              <>
                <p className="mt-2 text-xl font-bold text-foreground">{PLANS.find((p) => p.id === status.plan)?.name ?? status.plan}</p>
                <p className={`mt-1 text-sm ${status.status === 'past_due' ? 'text-destructive' : 'text-muted-foreground'}`}>{statusLine}</p>
                <p className="mt-1 text-sm text-muted-foreground">{status.source === 'apple' ? 'Billed through the App Store' : status.source === 'square' ? 'Billed online with Square' : 'Billed by FamilyBridge'}</p>
              </>
            ) : (
              <p className="mt-2 text-foreground">Free trial — up to 3 families.</p>
            )}
          </div>

          {status && active && status.source === 'apple' ? (
            <p className="mt-6 rounded-2xl bg-secondary/60 p-5 text-sm text-foreground">
              Your plan is billed through the App Store. To switch to online billing, cancel it on your iPhone first (Settings → your name → Subscriptions), then come back when it ends.
            </p>
          ) : status && !status.squareReady ? (
            <p className="mt-6 rounded-2xl bg-secondary/60 p-5 text-sm text-foreground">
              Online payment isn’t available right now. Email <a className="font-semibold text-primary" href={`mailto:${CONTACT}`}>{CONTACT}</a> and we’ll get you set up.
            </p>
          ) : status ? (
            <div className="mt-6 rounded-2xl border-2 border-primary bg-card p-6">
              <p className="text-lg font-bold text-foreground">{active ? 'Change your plan' : 'Choose a plan'}</p>
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                {PLANS.map((p) => (
                  <button key={p.id} onClick={() => setPlan(p.id)} className={`rounded-xl border p-3 text-left ${plan === p.id ? 'border-primary bg-primary/5' : 'border-border'}`}>
                    <span className="block font-semibold text-foreground">{p.name}</span>
                    <span className="block text-xs text-muted-foreground">{p.families}</span>
                  </button>
                ))}
              </div>
              <div role="radiogroup" aria-label="Billing period" className="mt-4 grid grid-cols-3 gap-1 rounded-2xl border border-border p-1">
                {PERIODS.map((p) => (
                  <button key={p.id} role="radio" aria-checked={period === p.id} onClick={() => setPeriod(p.id)} className={`flex flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-2 text-sm font-semibold ${period === p.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                    {p.label}
                    {p.save ? <span className="text-[11px] font-bold opacity-80">{p.save}</span> : null}
                  </button>
                ))}
              </div>
              <p className="mt-5 text-4xl font-extrabold text-foreground tabular-nums">
                {usd(price)}<span className="text-lg font-semibold text-muted-foreground">{per.unit}</span>
              </p>
              <p className="text-sm text-muted-foreground">{per.months > 1 ? `About ${usd(Math.round(price / per.months))}/month · ${per.billed}` : per.billed}</p>
              {msg ? <p className="mt-4 text-sm text-destructive">{msg}</p> : null}
              <Button className="mt-5 w-full h-12 text-base" onClick={checkout} disabled={!!busy}>
                {busy === 'checkout' ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Lock className="h-4 w-4" /> Continue to secure checkout <ArrowRight className="h-4 w-4" /></>}
              </Button>
              <p className="mt-3 text-xs text-muted-foreground">
                Payments are processed securely by Square. Your plan renews automatically at this price every {per.months === 1 ? 'month' : per.months === 3 ? '3 months' : 'year'} until you cancel here. See our <Link to="/terms" className="underline">Terms</Link>.
              </p>
            </div>
          ) : null}

          {renewingOnSquare ? (
            confirmCancel ? (
              <div className="mt-6 rounded-2xl border border-destructive/40 bg-destructive/5 p-5">
                <p className="text-sm text-foreground">Stop renewing? Your plan stays active through {fmtDate(status!.planUntil!)}, then your practice returns to the free trial (up to 3 families).</p>
                <div className="mt-3 flex gap-2">
                  <Button variant="destructive" size="sm" onClick={stopRenewing} disabled={!!busy}>{busy === 'cancel' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Stop renewing'}</Button>
                  <Button variant="outline" size="sm" onClick={() => setConfirmCancel(false)}>Keep my plan</Button>
                </div>
              </div>
            ) : (
              <button onClick={() => setConfirmCancel(true)} className="mt-6 text-sm font-medium text-muted-foreground underline hover:text-foreground">Stop automatic renewal</button>
            )
          ) : null}
          {note ? <p className="mt-6 text-sm text-foreground flex gap-2"><CheckCircle2 className="h-4 w-4 text-primary shrink-0" />{note}</p> : null}
          {msg && !showPicker ? <p className="mt-4 text-sm text-destructive">{msg}</p> : null}
        </>
      )}
    </Shell>
  );
};

export default PracticeBilling;
