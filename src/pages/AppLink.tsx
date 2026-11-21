import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Check, Copy } from 'lucide-react';
import { BrandedFooter } from '@/components/BrandedFooter';
import { SEOHead } from '@/components/SEOHead';
import { APP_STORE_URL, SiteHeader } from '@/components/site/SiteChrome';

/** The FamilyBridge web app, for people who would rather not install the iPhone app. */
const WEB_APP_URL = 'https://familybridge-app.vercel.app';

type Kind = 'connect' | 'join';

const COPY: Record<Kind, { title: string; heading: string; intro: string; steps: React.ReactNode[] }> = {
  connect: {
    title: 'Connect with your professional | FamilyBridge',
    heading: 'Connect with your professional',
    intro: 'Your professional uses FamilyBridge to stay in touch with your family between sessions.',
    steps: [
      'Create your account and set up your family.',
      <>On Today, tap <strong>“Connect with your provider”</strong>, or go to <strong>Tools</strong>, <strong>Our Professionals</strong>, and enter the code.</>,
    ],
  },
  join: {
    title: 'Join your family on FamilyBridge',
    heading: 'Join your family on FamilyBridge',
    intro: 'Someone in your family invited you to join them on FamilyBridge, so you can all stay on the same page.',
    steps: [
      'Create your account.',
      <>Choose <strong>“Join my family”</strong> and enter the code.</>,
    ],
  },
};

/** Links are typed, pasted and shared, so accept any case, spaces or dashes and keep only the code itself. */
const normalizeCode = (raw: string | undefined) => (raw ?? '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
const isValidCode = (code: string) => code.length >= 6 && code.length <= 12;

const AppStoreButton = () => (
  <a
    href={APP_STORE_URL}
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex w-full sm:w-auto items-center justify-center gap-2.5 h-12 px-6 rounded-xl bg-primary text-primary-foreground text-base font-semibold shadow-sm hover:bg-primary/90 transition-colors"
  >
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
    Get FamilyBridge on the App Store
  </a>
);

const copyText = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Older browsers and some in-app browsers block the clipboard API.
    const field = document.createElement('textarea');
    field.value = text;
    field.setAttribute('readonly', '');
    field.style.position = 'fixed';
    field.style.opacity = '0';
    document.body.appendChild(field);
    field.select();
    const ok = document.execCommand('copy');
    field.remove();
    return ok;
  }
};

/**
 * /connect/:code (a practice's connect link) and /join/:code (a family invite link).
 * With the iPhone app installed, Apple opens these links in the app (public/.well-known/apple-app-site-association),
 * so this page is what people see without it: the code, the download, and what to do next.
 */
const AppLink = ({ kind }: { kind: Kind }) => {
  const { code: rawCode } = useParams();
  const code = normalizeCode(rawCode);
  const valid = isValidCode(code);
  const text = COPY[kind];
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    if (await copyText(code)) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead
        title={text.title}
        description="Open this FamilyBridge link on your iPhone or iPad, or download FamilyBridge and enter the code."
        noIndex
      />
      <SiteHeader />
      <div className="flex-1 container mx-auto px-4 max-w-xl py-12 sm:py-16">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground text-center">{text.heading}</h1>

        {valid ? (
          <>
            <p className="mt-3 text-lg text-muted-foreground text-center">{text.intro}</p>

            <div className="mt-8 rounded-2xl border border-border bg-card p-6 text-center">
              <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Your code</p>
              <p className="mt-2 font-mono text-4xl sm:text-5xl font-bold tracking-[0.15em] text-foreground break-all" data-testid="app-link-code">
                {code}
              </p>
              <button
                type="button"
                onClick={onCopy}
                className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
              >
                {copied ? <Check className="h-4 w-4 text-primary" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
                {copied ? 'Copied' : 'Copy code'}
              </button>
              <span className="sr-only" aria-live="polite">{copied ? 'Code copied' : ''}</span>
            </div>

            <div className="mt-8 flex justify-center">
              <AppStoreButton />
            </div>

            <div className="mt-10 rounded-2xl border border-border bg-card p-6">
              <h2 className="text-lg font-bold text-foreground">After you download it</h2>
              <ol className="mt-4 space-y-3">
                {text.steps.map((step, i) => (
                  <li key={i} className="flex gap-3 text-foreground">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">{i + 1}</span>
                    <span className="pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <p className="mt-8 text-center">
              <a href={`${WEB_APP_URL}/${kind}/${code}`} className="text-sm font-semibold text-primary hover:underline">
                Continue in your browser
              </a>
            </p>
          </>
        ) : (
          <>
            <p className="mt-4 text-lg text-muted-foreground text-center">This link looks incomplete. Ask whoever sent it for the code.</p>
            <div className="mt-8 flex justify-center">
              <AppStoreButton />
            </div>
          </>
        )}
      </div>
      <BrandedFooter />
    </div>
  );
};

export default AppLink;
