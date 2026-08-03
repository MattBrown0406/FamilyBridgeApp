import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import {
  ArrowRight,
  Check,
  Clock3,
  Heart,
  ListChecks,
  Lock,
  MessageCircle,
  Pause,
  Play,
  Plus,
} from 'lucide-react';
import './AnimatedHomeHero.css';

interface AnimatedHomeHeroProps {
  tagline: string;
  onStart: () => void;
  onDemo: () => void;
}

const stages = [
  {
    tab: 'Listen',
    title: 'Listen before solving',
    copy: 'Make room for each person’s perspective before deciding the next step.',
    activeSignals: [0],
  },
  {
    tab: 'Align',
    title: 'Align around what matters',
    copy: 'Turn different perspectives into one compassionate boundary and shared decision.',
    activeSignals: [2],
  },
  {
    tab: 'Act',
    title: 'Follow through calmly',
    copy: 'Keep commitments visible so support stays consistent without chasing or blame.',
    activeSignals: [1, 3],
  },
] as const;

const signals = [
  {
    className: 'fb-hero-signal-1',
    title: 'A concern was shared',
    detail: 'Heard without blame',
    icon: MessageCircle,
  },
  {
    className: 'fb-hero-signal-2',
    title: 'A next step was added',
    detail: 'Clear owner · clear date',
    icon: Plus,
  },
  {
    className: 'fb-hero-signal-3',
    title: 'A boundary was affirmed',
    detail: 'Care without enabling',
    icon: Check,
  },
  {
    className: 'fb-hero-signal-4',
    title: 'Follow-up stays visible',
    detail: 'Nothing falls through',
    icon: Clock3,
  },
] as const;

const AnimatedHomeHero = ({ tagline, onStart, onDemo }: AnimatedHomeHeroProps) => {
  const [activeStage, setActiveStage] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const visualRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncMotionPreference = () => {
      if (reducedMotion.matches) setIsAutoPlaying(false);
    };

    syncMotionPreference();
    reducedMotion.addEventListener('change', syncMotionPreference);
    return () => reducedMotion.removeEventListener('change', syncMotionPreference);
  }, []);

  useEffect(() => {
    if (!isAutoPlaying) return undefined;

    const interval = window.setInterval(() => {
      setActiveStage((current) => (current + 1) % stages.length);
    }, 4400);

    return () => window.clearInterval(interval);
  }, [isAutoPlaying]);

  const chooseStage = (index: number) => {
    setActiveStage(index);
    setIsAutoPlaying(false);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!window.matchMedia('(pointer: fine) and (prefers-reduced-motion: no-preference)').matches) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    event.currentTarget.style.setProperty('--fb-hero-x', `${x}`);
    event.currentTarget.style.setProperty('--fb-hero-y', `${y}`);
  };

  const resetPointerDepth = () => {
    visualRef.current?.style.setProperty('--fb-hero-x', '0');
    visualRef.current?.style.setProperty('--fb-hero-y', '0');
  };

  const stage = stages[activeStage];

  return (
    <section className="fb-hero-shell" aria-labelledby="familybridge-hero-title">
      <div className="fb-hero-grid">
        <div className="fb-hero-copy">
          <div className="fb-hero-eyebrow">
            <span className="fb-hero-eyebrow-icon" aria-hidden="true">
              <Heart />
            </span>
            Built for families navigating addiction
          </div>

          <h1 id="familybridge-hero-title" className="fb-hero-title">
            When everyone sees the same path, families move <em>forward.</em>
          </h1>

          <p className="fb-hero-lede">
            {tagline || 'FamilyBridge turns scattered conversations, concerns, and commitments into one private place for calmer communication, clearer boundaries, and consistent next steps.'}
          </p>

          <div className="fb-hero-actions">
            <button type="button" className="fb-hero-primary" onClick={onStart}>
              Start your family space
              <ArrowRight aria-hidden="true" />
            </button>
            <button type="button" className="fb-hero-secondary" onClick={onDemo}>
              See how it works
            </button>
          </div>

          <div className="fb-hero-reassurance">
            <div className="fb-hero-faces" aria-hidden="true">
              <span>M</span>
              <span>K</span>
              <span>J</span>
            </div>
            <span><strong>Private by design.</strong> Shared only with people you choose.</span>
          </div>
        </div>

        <div className="fb-hero-visual-frame">
          <div
            ref={visualRef}
            className="fb-hero-visual"
            onPointerMove={handlePointerMove}
            onPointerLeave={resetPointerDepth}
            aria-label="Family concerns becoming a shared plan through listening, alignment, and coordinated action"
          >
            <div className="fb-hero-aura" aria-hidden="true" />
            <svg className="fb-hero-bridge" viewBox="0 0 590 390" aria-hidden="true">
              <defs>
                <linearGradient id="familybridgeHeroGradient">
                  <stop stopColor="#d98b73" />
                  <stop offset=".48" stopColor="#d7b875" />
                  <stop offset="1" stopColor="#56856e" />
                </linearGradient>
              </defs>
              <path className="fb-hero-bridge-base" d="M44 300 C116 54 462 52 546 300" />
              <path className="fb-hero-bridge-inner" d="M44 300 C116 54 462 52 546 300" />
              <path className="fb-hero-bridge-travel" d="M44 300 C116 54 462 52 546 300" />
            </svg>

            <span className="fb-hero-pulse fb-hero-pulse-1" aria-hidden="true" />
            <span className="fb-hero-pulse fb-hero-pulse-2" aria-hidden="true" />

            {signals.map((signal, index) => {
              const Icon = signal.icon;
              const isActive = stage.activeSignals.some((activeIndex) => activeIndex === index);
              return (
                <div
                  key={signal.title}
                  className={`fb-hero-signal ${signal.className}${isActive ? ' is-active' : ''}`}
                  aria-hidden="true"
                >
                  <span className="fb-hero-signal-icon"><Icon /></span>
                  <span>
                    <strong>{signal.title}</strong>
                    <small>{signal.detail}</small>
                  </span>
                </div>
              );
            })}

            <article className="fb-hero-dashboard">
              <header className="fb-hero-dashboard-top">
                <h2>Your family today</h2>
                <span className="fb-hero-private"><Lock aria-hidden="true" /> Private</span>
              </header>

              <div className="fb-hero-today-card">
                <span className="fb-hero-mini-label">Shared focus</span>
                <h3 key={`title-${activeStage}`}>{stage.title}</h3>
                <p key={`copy-${activeStage}`}>{stage.copy}</p>
                <div className="fb-hero-progress" aria-hidden="true">
                  {stages.map((item, index) => (
                    <span key={item.tab} className={index === activeStage ? 'is-active' : ''} />
                  ))}
                </div>
              </div>

              <div className="fb-hero-dashboard-grid">
                <div className="fb-hero-tile">
                  <span className="fb-hero-tile-icon"><ListChecks aria-hidden="true" /></span>
                  <strong>3 shared actions</strong>
                  <small>Everyone knows what’s next</small>
                </div>
                <div className="fb-hero-tile">
                  <span className="fb-hero-tile-icon is-coral"><Heart aria-hidden="true" /></span>
                  <strong>One family rhythm</strong>
                  <small>Compassion with consistency</small>
                </div>
              </div>

              <div className="fb-hero-acknowledged">
                <span className="fb-hero-check"><Check aria-hidden="true" /></span>
                <span>
                  <strong>Plan acknowledged by the family</strong>
                  <small>Updated moments ago</small>
                </span>
                <span className="fb-hero-mini-faces" aria-hidden="true">
                  <i /><i /><i />
                </span>
              </div>
            </article>

            <div className="fb-hero-stage-control" role="group" aria-label="Explore how FamilyBridge supports a family">
              {stages.map((item, index) => (
                <button
                  key={item.tab}
                  type="button"
                  className={index === activeStage ? 'is-active' : ''}
                  aria-pressed={index === activeStage}
                  onClick={() => chooseStage(index)}
                >
                  {index + 1} · {item.tab}
                </button>
              ))}
              <button
                type="button"
                className="fb-hero-stage-toggle"
                aria-label={isAutoPlaying ? 'Pause automatic stage changes' : 'Play automatic stage changes'}
                aria-pressed={!isAutoPlaying}
                onClick={() => setIsAutoPlaying((current) => !current)}
              >
                {isAutoPlaying ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AnimatedHomeHero;
