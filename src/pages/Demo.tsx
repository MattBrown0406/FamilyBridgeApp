import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Briefcase, Home, RotateCcw } from 'lucide-react';
import { BrandedFooter } from '@/components/BrandedFooter';
import PublicCrisisHelp from '@/components/PublicCrisisHelp';
import { SEOHead } from '@/components/SEOHead';
import { AppStoreBadge, NewBadge, SiteHeader } from '@/components/site/SiteChrome';

/**
 * The live demo: the real FamilyBridge app, built for the web in demo-only mode (public/app-demo, made by the app's
 * scripts/export-site-demo.sh), shown in a phone frame with a guided tour beside it. The app holds a made-up family in
 * this browser only: no account, no server. The tour steers it through a small set of messages the app's demo build
 * listens for (its DemoSiteBridge), and the app reports back where the visitor is.
 */

type Audience = 'family' | 'pro';
type Step = {
  id: string;
  title: string;
  /** The screen inside the app. */
  path: string;
  /** What this screen is for, in a sentence or two. */
  what: string;
  /** Something to tap. */
  tryIt: string;
  isNew?: boolean;
  /** Family tour only: look as the person in recovery instead of his mom. */
  who?: 'recovery';
};

const TOURS: Record<Audience, { label: string; icon: React.ElementType; intro: string; steps: Step[] }> = {
  family: {
    label: 'For families',
    icon: Home,
    intro: 'Meet the Carters. You are Dana, whose son Jordan is about three months into recovery. Her husband Mike and Jordan’s sister Sam are in the family too.',
    steps: [
      { id: 'today', title: 'Today', path: '/', what: 'What Dana sees each morning: how Jordan’s recovery is going, what needs her attention, and one thing to try saying.', tryIt: 'Scroll down to the family’s to-do cards, then tap one.' },
      { id: 'together', title: 'Together', path: '/plan', what: 'How closely the family agrees, the family’s signed pact, and this week’s five-minute lesson.', tryIt: 'Tap the Alignment card to see where the family agrees and where it’s split, never who said what.' },
      { id: 'ask', title: 'Before you say yes', path: '/tools/ask', what: 'When Jordan asks one of them for money or a ride, the family’s agreed answer and the words to use.', tryIt: 'Pick “Money” and read what the family already decided.' },
      { id: 'money', title: 'Money & requests', path: '/tools/finances', what: 'Requests, family votes, receipts and a monthly limit, so nobody has to be the bad guy.', tryIt: 'Open the bus pass request. Dana has already said yes, and it needs two. Tap Decline to see a vote change.' },
      { id: 'finder', title: 'Find a meeting', path: '/tools/meeting-finder', isNew: true, what: 'Search meetings near you or online. Where a fellowship doesn’t share its list, one tap opens its own finder.', tryIt: 'Tap “For someone in recovery”, then “Use my location”, and scroll down. The demo shows sample meetings.' },
      { id: 'location', title: 'Location check-ins', path: '/tools/location', isNew: true, what: 'Share where you are once, by choice. A helper can ask only someone who has turned asking on, and nothing is tracked in the background.', tryIt: 'Tap “Check in here”. In this demo it records a sample place, not yours.' },
      { id: 'documents', title: 'Documents & releases', path: '/tools/documents', isNew: true, what: 'The discharge plan, the insurance card and signed releases of information in one private place.', tryIt: 'Scroll to the release Jordan signed so Harbor Recovery can talk with his parents.' },
      { id: 'changed', title: 'What changed lately', path: '/tools/insights', isNew: true, what: 'A plain summary of what is different in the last two weeks, with a gentle way to bring each change up. It’s arithmetic on what the family logged, not AI.', tryIt: 'Read the card at the top: Jordan has been going to more meetings. Then scroll through Family Insights below it.' },
      { id: 'rightnow', title: 'What’s happening right now?', path: '/tools/right-now', what: 'A 60-second plan for the hardest moments: safety first, what to say, what not to do.', tryIt: 'Pick “Jordan is asking for money”.' },
      { id: 'naloxone', title: 'Overdose Ready', path: '/tools/naloxone', what: 'Where the family’s naloxone is, when it expires and who has practiced.', tryIt: 'Open a kit to see who holds it.' },
      { id: 'chat', title: 'Family chat', path: '/chat', what: 'One place to talk, with a respect filter that stops insults and threats before they’re sent.', tryIt: 'Type a message to the family.' },
      { id: 'sos', title: 'SOS', path: '/tools/crisis', what: '911, 988 and overdose steps first, then a way to reach a person. The phone numbers here are real: tapping one starts a real call. An SOS session in the demo is a sample, with nobody on the other end.', tryIt: 'Scroll through the crisis lines and overdose steps.' },
      { id: 'jordan', title: 'See it as Jordan', path: '/', who: 'recovery', what: 'Jordan has his own view: his check-ins, meetings and wins. He never sees letters, Family Insights, what changed lately, or where his parents are.', tryIt: 'Open Tools and notice what is not there.' },
    ],
  },
  pro: {
    label: 'For professionals',
    icon: Briefcase,
    intro: 'Meet Harbor Recovery, a made-up practice. You are Rachel, the family recovery coach who runs it, with a caseload of families who chose what she can see.',
    steps: [
      { id: 'caseload', title: 'Caseload', path: '/pro', what: 'Every family you work with, sorted by who needs you: needs attention, watch, on track.', tryIt: 'Tap the first family in the list.' },
      { id: 'file', title: 'A family’s file', path: '/pro/family/demo-family-carter', what: 'The Carters’ overview: the signals this week, and only the areas the family chose to share.', tryIt: 'Tap the tabs at the top: Plan, Tests, Journey.' },
      { id: 'pdocs', title: 'Documents & releases', path: '/pro/family/demo-family-carter?tab=documents', isNew: true, what: 'The documents a family shared with your practice, and the releases of information that name you.', tryIt: 'Read the release Jordan signed: who Harbor Recovery may talk with, about what, and until when.' },
      { id: 'messages', title: 'Messages & tasks', path: '/pro/family/demo-family-carter?tab=messages', what: 'Message a family, set tasks and log sessions. Your private notes are never shown to them.', tryIt: 'Send the Carters a message.' },
      { id: 'inbox', title: 'Inbox', path: '/pro/inbox', what: 'Message threads across your families, with whoever has waited longest for your reply at the top.', tryIt: 'Open the thread at the top.' },
      { id: 'practice', title: 'Your practice', path: '/pro/practice', what: 'Staff, your connect code, your logo and colors in your families’ app, and an outcomes report to share.', tryIt: 'Open the outcomes report.' },
    ],
  },
};

const MODE_KEY = 'familybridge:mode';
const DEMO_KEYS = ['familybridge:v1', 'familybridge:proDemo:v1'];
const modeFor = (a: Audience) => (a === 'pro' ? 'proDemo' : 'demo');
const MESSAGE = 'familybridge-demo';

// The sample family this page was built with. A visitor who tried an earlier demo still has that one's family in
// their browser, without whatever the tour now points at: when this changes, they start from the new one.
const DEMO_DATA_KEY = 'familybridge:demoSite';
const DEMO_DATA = '6.3-3';

/** The app reads which demo to open from this browser's storage, so it starts where the tour is. */
function presetMode(audience: Audience) {
  try {
    if (window.localStorage.getItem(DEMO_DATA_KEY) !== DEMO_DATA) {
      for (const key of DEMO_KEYS) window.localStorage.removeItem(key);
      window.localStorage.setItem(DEMO_DATA_KEY, DEMO_DATA);
    }
    window.localStorage.setItem(MODE_KEY, modeFor(audience));
  } catch {
    /* storage blocked: the app shows its own "explore the demo" screen instead */
  }
}

const Demo = () => {
  const [params, setParams] = useSearchParams();
  const audience: Audience = params.get('as') === 'pro' ? 'pro' : 'family';
  const tour = TOURS[audience];
  const [stepId, setStepId] = useState(tour.steps[0].id);
  const step = tour.steps.find((s) => s.id === stepId) ?? tour.steps[0];
  const index = tour.steps.indexOf(step);
  // A new frame is made only on first load and on "start over": moving between steps talks to the app instead.
  const [frameKey, setFrameKey] = useState(0);
  const frame = useRef<HTMLIFrameElement>(null);
  const ready = useRef(false);
  // What the tour last asked the app for, sent (again) once the app says it is up.
  const wanted = useRef<{ audience: Audience; step: Step }>({ audience, step });
  wanted.current = { audience, step };
  // Whose eyes the tour last asked for (the family demo only), until the app says it is so. After that the visitor's
  // own "view as" switch inside the app is left alone.
  const viewerAsked = useRef<'helper' | 'recovery' | null>(audience === 'family' ? step.who ?? 'helper' : null);

  // Decided once per frame, before it loads: the demo to open and the screen to open it on.
  const firstSrc = useMemo(() => {
    presetMode(wanted.current.audience);
    return `/app-demo/index.html?go=${encodeURIComponent(wanted.current.step.path)}`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frameKey]);

  const post = useCallback((message: Record<string, unknown>) => {
    frame.current?.contentWindow?.postMessage({ type: MESSAGE, ...message }, window.location.origin);
  }, []);

  const send = useCallback(() => {
    const { audience: a, step: s } = wanted.current;
    post({ action: 'start', role: a, path: s.path });
  }, [post]);

  // The app reports where the visitor is. That is when it is ready to be steered, and when to switch whose eyes the
  // family demo is seen through (only possible once the family demo is the one running).
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== frame.current?.contentWindow) return;
      const data = e.data as { type?: string; event?: string; mode?: string; viewer?: string } | null;
      if (data?.type !== MESSAGE || data.event !== 'state') return;
      // Still reading what this browser has saved: it can't be steered yet.
      if (data.mode === 'loading') return;
      if (!ready.current) {
        ready.current = true;
        // Whatever the tour is on by now, which may not be where the frame was first sent.
        send();
      }
      if (viewerAsked.current && wanted.current.audience === 'family' && data.mode === 'demo') {
        if (data.viewer === viewerAsked.current) viewerAsked.current = null;
        else post({ action: 'as', who: viewerAsked.current });
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [post, send]);

  const go = (next: Step, a: Audience = audience) => {
    wanted.current = { audience: a, step: next };
    setStepId(next.id);
    viewerAsked.current = a === 'family' ? next.who ?? 'helper' : null;
    if (ready.current) {
      post({ action: 'start', role: a, path: next.path });
      if (a === 'family') post({ action: 'as', who: next.who ?? 'helper' });
    }
  };

  // The audience lives in the address (?as=pro), so it can change without a tap on this page's own switch: a link to
  // /demo from the header, or the browser's back button. Whichever way it changed, the app follows.
  const steered = useRef(audience);
  useEffect(() => {
    if (steered.current === audience) return;
    steered.current = audience;
    go(TOURS[audience].steps[0], audience);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audience]);

  const switchTo = (a: Audience) => {
    if (a === audience) return;
    setParams(
      (now) => {
        const next = new URLSearchParams(now);
        if (a === 'pro') next.set('as', 'pro');
        else next.delete('as');
        return next;
      },
      { replace: true },
    );
  };

  const startOver = () => {
    try {
      for (const key of DEMO_KEYS) window.localStorage.removeItem(key);
    } catch {
      /* storage blocked */
    }
    ready.current = false;
    wanted.current = { audience, step: tour.steps[0] };
    viewerAsked.current = audience === 'family' ? 'helper' : null;
    setStepId(tour.steps[0].id);
    setFrameKey((k) => k + 1);
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Try FamilyBridge: a Live Demo for Families and Professionals"
        description="Use the real FamilyBridge app in your browser with a sample family: the family pact, money requests, meeting finder, location check-ins and the professional caseload."
        canonicalPath="/demo"
      />
      <SiteHeader right={<a href="/#download" className="hidden sm:inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90">Get the app</a>} />

      <main className="container mx-auto px-4 max-w-6xl py-10 sm:py-14">
        <div className="max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-wider text-primary">Live demo</p>
          <h1 className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground [text-wrap:balance]">Try FamilyBridge right here.</h1>
          <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
            This is the real app, running in your browser with a made-up family. Tap anything. Nothing you do is saved anywhere but this browser, and no message reaches a real person. Only the crisis phone numbers are real.
          </p>
        </div>

        <div className="mt-8 inline-flex rounded-xl border border-border bg-card p-1" role="group" aria-label="Choose a tour">
          {(Object.keys(TOURS) as Audience[]).map((a) => {
            const Icon = TOURS[a].icon;
            return (
              <button
                key={a}
                aria-pressed={a === audience}
                onClick={() => switchTo(a)}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${a === audience ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <Icon className="h-4 w-4" /> {TOURS[a].label}
              </button>
            );
          })}
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-12 items-start">
          {/* The tour */}
          <div className="order-2 lg:order-1 min-w-0">
            <p className="text-muted-foreground leading-relaxed">{tour.intro}</p>

            <ol className="mt-6 flex gap-2 overflow-x-auto pb-2 lg:grid lg:grid-cols-2 lg:overflow-visible lg:pb-0" aria-label={`${tour.label} tour`}>
              {tour.steps.map((s, i) => (
                <li key={s.id} className="shrink-0 lg:shrink">
                  <button
                    onClick={() => go(s)}
                    aria-current={s.id === step.id ? 'step' : undefined}
                    className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition-colors ${s.id === step.id ? 'border-primary bg-primary/10 text-foreground' : 'border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground'}`}
                  >
                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${s.id === step.id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>{i + 1}</span>
                    <span className="whitespace-nowrap lg:whitespace-normal">{s.title}</span>
                    {s.isNew ? <NewBadge /> : null}
                  </button>
                </li>
              ))}
            </ol>

            <div className="mt-6 rounded-2xl border border-border bg-card p-6">
              <div aria-live="polite">
                <p className="text-sm font-bold text-primary">Step {index + 1} of {tour.steps.length}</p>
                <h2 className="mt-1 flex flex-wrap items-center gap-2 text-xl font-bold text-foreground">{step.title}{step.isNew ? <NewBadge /> : null}</h2>
                <p className="mt-2 text-muted-foreground leading-relaxed">{step.what}</p>
                <p className="mt-4 rounded-xl bg-secondary px-4 py-3 text-sm text-foreground"><span className="font-semibold">Try this:</span> {step.tryIt}</p>
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button onClick={() => go(tour.steps[index - 1])} disabled={index === 0} className="inline-flex h-10 items-center gap-2 rounded-lg border border-border px-4 text-sm font-semibold text-foreground hover:bg-muted disabled:opacity-40 disabled:hover:bg-transparent">
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
                {index < tour.steps.length - 1 ? (
                  <button onClick={() => go(tour.steps[index + 1])} className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                    Next: {tour.steps[index + 1].title} <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button onClick={() => switchTo(audience === 'family' ? 'pro' : 'family')} className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                    Now see it {audience === 'family' ? 'as a professional' : 'as a family'} <ArrowRight className="h-4 w-4" />
                  </button>
                )}
                <button onClick={startOver} className="inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-muted-foreground hover:text-foreground">
                  <RotateCcw className="h-4 w-4" /> Start over
                </button>
              </div>
            </div>

            <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
              <li>You don’t have to follow the steps. Tap around the app itself and the tour keeps its place.</li>
              <li>The AI Coach and purchases are switched off in the demo, and an SOS session is a sample with nobody on the other end. Meeting search shows sample meetings, and the sample documents have no file behind them.</li>
              <li>The Carters and Harbor Recovery are fictional. “Start over” puts everything back.</li>
            </ul>

            <div className="mt-8 rounded-2xl bg-[#134A51] p-6 text-white">
              <p className="text-lg font-bold">Ready to use it with your own family?</p>
              <p className="mt-1 text-white/80">Every planning, accountability and safety tool is free.</p>
              <div className="mt-4 flex flex-wrap items-center gap-4">
                <AppStoreBadge dark={false} />
                <Link to={audience === 'pro' ? '/for-providers' : '/#features'} className="font-semibold text-white underline-offset-4 hover:underline">
                  {audience === 'pro' ? 'FamilyBridge for professionals' : 'See every feature'}
                </Link>
              </div>
            </div>
          </div>

          {/* The app */}
          <div className="order-1 lg:order-2 lg:sticky lg:top-20">
            {/* On a phone the full tour sits below the app: this keeps the current step, and the way on, in view above it. */}
            <div className="lg:hidden mb-4 rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center justify-between gap-2">
                <button onClick={() => go(tour.steps[index - 1])} disabled={index === 0} aria-label="Previous step" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border text-foreground disabled:opacity-40">
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <p className="min-w-0 text-center text-sm font-bold text-foreground">
                  <span className="text-primary">{index + 1} of {tour.steps.length}</span> · {step.title}
                </p>
                <button onClick={() => go(tour.steps[index + 1])} disabled={index === tour.steps.length - 1} aria-label="Next step" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-40">
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{step.what}</p>
            </div>
            <div className="mx-auto w-full max-w-[420px] rounded-[2.6rem] bg-[#0E2F34] p-2.5 shadow-[0_30px_60px_-20px_rgba(19,74,81,0.45)]">
              <iframe
                key={frameKey}
                ref={frame}
                src={firstSrc}
                title={`FamilyBridge live demo: ${tour.label.toLowerCase()}`}
                className="block h-[min(780px,calc(100vh-7.5rem))] min-h-[560px] w-full rounded-[2rem] bg-[#F5F1EC]"
              />
            </div>
            <p className="mt-3 text-center text-xs text-muted-foreground">A sample family, held only in this browser.</p>
          </div>
        </div>
      </main>

      <div className="container mx-auto px-4 py-8 max-w-3xl"><PublicCrisisHelp /></div>
      <BrandedFooter />
    </div>
  );
};

export default Demo;
