import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  CalendarCheck,
  ClipboardList,
  Pill,
  Heart,
  MessagesSquare,
  Sparkles,
  Sunrise,
  Target,
  Wallet,
} from 'lucide-react';
import { AppStoreBadge } from '@/components/site/SiteChrome';
import todayShot from '@/assets/app/today.webp';
import chatShot from '@/assets/app/chat.webp';
import planShot from '@/assets/app/plan.webp';
import caseloadShot from '@/assets/app/caseload.webp';
import insightsShot from '@/assets/app/insights.webp';
import journeyShot from '@/assets/app/journey.webp';

type Audience = 'family' | 'pro';
type Moment = {
  icon: React.ElementType;
  tone: 'teal' | 'amber' | 'rose';
  title: string;
  detail: string;
};

const SCREENS: Record<Audience, { src: string; alt: string }[]> = {
  family: [
    {
      src: todayShot,
      alt: 'Today: days in recovery, a next step and the family unity score',
    },
    { src: chatShot, alt: 'Family chat with a respect filter' },
    {
      src: planShot,
      alt: 'The family plan: boundaries, goals and a relapse plan',
    },
  ],
  pro: [
    {
      src: caseloadShot,
      alt: 'The professional caseload, sorted by who needs attention',
    },
    { src: insightsShot, alt: 'Family Insights for a family on the caseload' },
    { src: journeyShot, alt: 'A family’s recovery journey over time' },
  ],
};

const MOMENTS: Record<Audience, Moment[]> = {
  family: [
    {
      icon: Heart,
      tone: 'rose',
      title: 'Jordan checked in',
      detail: 'Feeling hopeful today',
    },
    {
      icon: Wallet,
      tone: 'teal',
      title: 'Grocery request approved',
      detail: '$40 · Mom and Dad voted yes',
    },
    {
      icon: CalendarCheck,
      tone: 'teal',
      title: 'Meeting logged',
      detail: 'NA · Tuesday night',
    },
    {
      icon: Target,
      tone: 'amber',
      title: 'Boundary held',
      detail: 'No cash — 21 days strong',
    },
    {
      icon: Pill,
      tone: 'teal',
      title: 'Morning dose taken',
      detail: 'Jordan · 7 days in a row',
    },
    {
      icon: Sparkles,
      tone: 'amber',
      title: 'Family Insights',
      detail: 'A window may be opening',
    },
  ],
  pro: [
    {
      icon: AlertCircle,
      tone: 'rose',
      title: 'The Nguyen Family',
      detail: 'Needs attention · missed IOP group',
    },
    {
      icon: MessagesSquare,
      tone: 'teal',
      title: 'Brooks family replied',
      detail: '“We held the boundary this week.”',
    },
    {
      icon: CalendarCheck,
      tone: 'teal',
      title: 'Session booked',
      detail: 'Carter family · Monday 7:00 PM',
    },
    {
      icon: BadgeCheck,
      tone: 'amber',
      title: 'Handoff approved',
      detail: 'Parents shared their plan with IOP',
    },
    {
      icon: ClipboardList,
      tone: 'teal',
      title: 'Task completed',
      detail: 'Family meeting agenda shared',
    },
    {
      icon: Sparkles,
      tone: 'amber',
      title: 'AI Assistant',
      detail: 'Session prep ready for tomorrow',
    },
  ],
};

const COPY: Record<Audience, { title: string; body: string; foot: string }> = {
  family: {
    title: 'Recovery is a family journey.',
    body: 'FamilyBridge keeps everyone on the same page — money, meetings, appointments, medications and boundaries — with coaching that helps you say the right thing, and real help when it matters most.',
    foot: 'Free for every family. In English and Spanish.',
  },
  pro: {
    title: 'See how every family is really doing.',
    body: 'A live, consent-based view of each family’s check-ins, meetings, medications and money — with one place to coach them from the first call through aftercare. On iPhone and iPad.',
    foot: 'Plans from $149 a month · Your branding included · iPhone and iPad',
  },
};

const SCREEN_MS = 3800;
const MOMENT_MS = 2600;
const AUDIENCE_MS = SCREEN_MS * 4;

const toneClass: Record<Moment['tone'], string> = {
  teal: 'bg-primary/10 text-primary',
  amber: 'bg-accent/20 text-[#9A5A1C]',
  rose: 'bg-rose-500/10 text-rose-600',
};

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return reduced;
}

/** True while the element is on screen and the tab is visible — animation pauses otherwise. */
function useActive(ref: React.RefObject<HTMLElement>) {
  const [onScreen, setOnScreen] = useState(true);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting), { threshold: 0.15 });
    io.observe(el);
    const onVis = () => setVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', onVis);
    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [ref]);
  return onScreen && visible;
}

function useTicker(ms: number, running: boolean, onTick: () => void) {
  const cb = useRef(onTick);
  cb.current = onTick;
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => cb.current(), ms);
    return () => window.clearInterval(id);
  }, [ms, running]);
}

type Live = { key: number; moment: Moment };

export const HeroDynamic = () => {
  const root = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();
  const active = useActive(root);
  const [audience, setAudience] = useState<Audience>('family');
  const [chosen, setChosen] = useState(false);
  const [screen, setScreen] = useState(0);
  const [live, setLive] = useState<Live[]>(() => [{ key: 0, moment: MOMENTS.family[0] }]);
  const counter = useRef(1);
  const nextMoment = useRef(1);
  const running = active && !reduced;

  const switchTo = (next: Audience, byUser: boolean) => {
    if (byUser) setChosen(true);
    if (next === audience) return;
    setAudience(next);
    setScreen(0);
    nextMoment.current = 1;
    setLive([{ key: counter.current++, moment: MOMENTS[next][0] }]);
  };

  // The header's “Get the app” jumps to #download, which lives in the family view.
  useEffect(() => {
    const onHash = () => window.location.hash === '#download' && switchTo('family', true);
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  });

  useTicker(SCREEN_MS, running, () => setScreen((s) => (s + 1) % SCREENS[audience].length));
  useTicker(MOMENT_MS, running, () => {
    const list = MOMENTS[audience];
    const moment = list[nextMoment.current++ % list.length];
    const key = counter.current++;
    setLive((prev) => [{ key, moment }, ...prev].slice(0, 4));
  });
  useTicker(AUDIENCE_MS, running && !chosen, () => switchTo(audience === 'family' ? 'pro' : 'family', false));

  const copy = COPY[audience];
  const screens = SCREENS[audience];

  return (
    <section ref={root} className="fb-hero relative overflow-hidden" aria-label="FamilyBridge">
      <div className="absolute inset-0 bg-gradient-to-b from-secondary/70 to-background" aria-hidden="true" />
      <BridgeArc animate={!reduced} paused={!active} />

      <div className="container relative mx-auto px-4 max-w-6xl pt-10 pb-16 sm:pt-16 sm:pb-24 grid gap-12 lg:grid-cols-[1.1fr_0.9fr] items-center">
        <div className="max-w-xl">
          <div className="flex flex-wrap items-center gap-3">
            <p className="inline-flex items-center gap-2 rounded-full bg-accent/15 px-3 py-1 text-sm font-semibold text-[#9A5A1C]">
              <Sunrise className="h-4 w-4" /> Built by a certified interventionist
            </p>

            <div
              role="tablist"
              aria-label="Who is FamilyBridge for?"
              className="inline-flex rounded-full border border-border bg-card/80 p-1 shadow-sm backdrop-blur"
            >
              {(['family', 'pro'] as const).map((a) => (
                <button
                  key={a}
                  role="tab"
                  aria-selected={audience === a}
                  onClick={() => switchTo(a, true)}
                  className={`relative h-9 rounded-full px-4 text-sm font-semibold transition-colors ${audience === a ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  {a === 'family' ? 'For families' : 'For professionals'}
                  {audience === a && running && !chosen ? (
                    <span className="fb-progress" style={{ animationDuration: `${AUDIENCE_MS}ms` }} aria-hidden="true" />
                  ) : null}
                </button>
              ))}
            </div>
          </div>

          <div key={audience} className="fb-swap">
            <h1 className="mt-5 text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground [text-wrap:balance] min-h-[2.2em]">
              {copy.title}
            </h1>
            <p className="mt-5 text-lg sm:text-xl leading-relaxed text-muted-foreground">{copy.body}</p>
            <div id="download" className="mt-8 flex flex-wrap items-center gap-3 scroll-mt-24">
              {audience === 'family' ? (
                <>
                  <AppStoreBadge />
                  <a
                    href="#features"
                    className="inline-flex h-12 items-center gap-2 rounded-xl border border-border bg-card px-5 font-semibold text-foreground hover:bg-muted"
                  >
                    See how it works <ArrowRight className="h-4 w-4" />
                  </a>
                </>
              ) : (
                <>
                  <Link
                    to="/for-providers#plans"
                    className="inline-flex h-12 items-center gap-2 rounded-xl bg-primary px-5 font-semibold text-primary-foreground hover:bg-primary/90"
                  >
                    See plans <ArrowRight className="h-4 w-4" />
                  </Link>
                  <AppStoreBadge />
                </>
              )}
            </div>
            <p className="mt-4 text-sm text-muted-foreground">{copy.foot}</p>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[260px] sm:max-w-[320px] lg:max-w-[350px]">
          <Sun animate={!reduced} />

          <div
            className="fb-float relative rounded-[2.2rem] bg-[#0E2F34] p-2 shadow-[0_30px_60px_-20px_rgba(19,74,81,0.45)]"
            style={{ animationPlayState: running ? 'running' : 'paused' }}
          >
            <div className="relative overflow-hidden rounded-[1.7rem] aspect-[390/844] bg-[#F6F1E9]">
              {screens.map((s, i) => (
                <img
                  key={s.src}
                  src={s.src}
                  alt={i === screen ? s.alt : ''}
                  aria-hidden={i !== screen}
                  loading={i === 0 ? 'eager' : 'lazy'}
                  className={`absolute inset-0 h-full w-full object-cover object-top transition-all duration-700 ease-out ${i === screen ? 'opacity-100 scale-100' : 'opacity-0 scale-[1.03]'}`}
                />
              ))}
            </div>
          </div>

          <div className="mt-4 flex justify-center gap-1.5" aria-hidden="true">
            {screens.map((s, i) => (
              <span
                key={s.src}
                className={`h-1.5 rounded-full transition-all duration-500 ${i === screen ? 'w-6 bg-primary' : 'w-1.5 bg-primary/25'}`}
              />
            ))}
          </div>

          <MomentStack live={live} />
        </div>
      </div>
    </section>
  );
};

/** Little moments from a family's day, arriving like notifications. Decorative. */
const MomentStack = ({ live }: { live: Live[] }) => (
  <div className="pointer-events-none absolute -left-3 sm:-left-24 lg:-left-40 bottom-14 w-[15rem] sm:w-72 h-56" aria-hidden="true">
    {live.map(({ key, moment }, i) => {
      const Icon = moment.icon;
      return (
        <div
          key={key}
          className="absolute inset-x-0 bottom-0 transition-all duration-500 ease-out"
          style={{
            transform: `translateY(${-i * 64}px) scale(${1 - i * 0.05})`,
            opacity: i === 0 ? 1 : i === 1 ? 0.85 : i === 2 ? 0.45 : 0,
            zIndex: 10 - i,
          }}
        >
          <div
            className={`fb-moment flex items-center gap-3 rounded-2xl border border-border bg-card/95 px-3.5 py-3 shadow-xl backdrop-blur ${i > 1 ? 'hidden sm:flex' : ''}`}
          >
            <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${toneClass[moment.tone]}`}>
              <Icon className="h-[18px] w-[18px]" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-foreground">{moment.title}</span>
              <span className="block truncate text-xs text-muted-foreground">{moment.detail}</span>
            </span>
            {i === 0 ? <span className="ml-auto text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">now</span> : null}
          </div>
        </div>
      );
    })}
  </div>
);

/** The logo's sunrise: a warm glow that rises in, with slowly turning rays. */
const Sun = ({ animate }: { animate: boolean }) => (
  <div
    className={`pointer-events-none absolute left-1/2 top-[38%] -z-0 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 ${animate ? 'fb-sunrise' : ''}`}
    aria-hidden="true"
  >
    <div className="absolute inset-[22%] rounded-full bg-[radial-gradient(circle,hsl(var(--accent)/0.55),hsl(var(--accent)/0.18)_45%,transparent_70%)]" />
    <svg viewBox="-100 -100 200 200" className={`absolute inset-0 h-full w-full text-accent/40 ${animate ? 'fb-rays' : ''}`}>
      {Array.from({ length: 16 }, (_, i) => (
        <rect key={i} x="-1.6" y="-96" width="3.2" height="26" rx="1.6" fill="currentColor" transform={`rotate(${i * 22.5})`} />
      ))}
    </svg>
  </div>
);

/**
 * The bridge from the logo, drawn across the hero. Two lights start at either end and meet in the
 * middle — a family finding its way back to each other.
 */
const BridgeArc = ({ animate, paused }: { animate: boolean; paused: boolean }) => {
  const svg = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const el = svg.current;
    if (!el || !animate) return;
    if (paused) el.pauseAnimations();
    else el.unpauseAnimations();
  }, [animate, paused]);

  const d = 'M -40 520 Q 600 -40 1240 520';
  return (
    <svg
      ref={svg}
      viewBox="0 0 1200 520"
      preserveAspectRatio="xMidYMax slice"
      className="pointer-events-none absolute inset-x-0 bottom-0 h-[78%] w-full"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="fb-light">
          <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity="1" />
          <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path
        id="fb-arc"
        d={d}
        fill="none"
        stroke="hsl(var(--primary))"
        strokeOpacity="0.14"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
        className={animate ? 'fb-draw' : ''}
        pathLength={1}
      />
      <path
        d="M -40 520 Q 600 20 1240 520"
        fill="none"
        stroke="hsl(var(--primary))"
        strokeOpacity="0.07"
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
      />
      {animate ? (
        <>
          {[
            { from: '0', color: 'hsl(var(--primary))' },
            { from: '1', color: 'hsl(var(--accent))' },
          ].map((p) => (
            <g key={p.from}>
              <circle r="14" fill="url(#fb-light)" opacity="0.7">
                <animateMotion
                  dur="7s"
                  begin="1.6s"
                  repeatCount="indefinite"
                  keyPoints={`${p.from};0.5;0.5`}
                  keyTimes="0;0.62;1"
                  calcMode="linear"
                >
                  <mpath href="#fb-arc" />
                </animateMotion>
              </circle>
              <circle r="4" fill={p.color}>
                <animateMotion
                  dur="7s"
                  begin="1.6s"
                  repeatCount="indefinite"
                  keyPoints={`${p.from};0.5;0.5`}
                  keyTimes="0;0.62;1"
                  calcMode="linear"
                >
                  <mpath href="#fb-arc" />
                </animateMotion>
                <animate attributeName="opacity" dur="7s" begin="1.6s" repeatCount="indefinite" values="0;1;1;0" keyTimes="0;0.08;0.8;1" />
              </circle>
            </g>
          ))}
          <circle
            cx="600"
            cy="240"
            r="6"
            fill="none"
            stroke="hsl(var(--accent))"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
            opacity="0"
          >
            <animate attributeName="r" dur="7s" begin="1.6s" repeatCount="indefinite" values="6;6;40" keyTimes="0;0.62;1" />
            <animate attributeName="opacity" dur="7s" begin="1.6s" repeatCount="indefinite" values="0;0;0.8;0" keyTimes="0;0.61;0.64;1" />
          </circle>
        </>
      ) : null}
    </svg>
  );
};
