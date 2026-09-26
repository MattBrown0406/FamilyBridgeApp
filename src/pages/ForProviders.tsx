import { Link } from 'react-router-dom';
import {
  ArrowRight, BadgeCheck, Bell, Brush, FileSignature, FlaskConical, Gift, KeyRound, LifeBuoy, Mail, MessagesSquare, Phone as PhoneIcon,
  Route, ShieldCheck, Sparkles,
} from 'lucide-react';
import { BrandedFooter } from '@/components/BrandedFooter';
import { SEOHead, createBreadcrumbSchema } from '@/components/SEOHead';
import PublicCrisisHelp from '@/components/PublicCrisisHelp';
import { AppStoreBadge, ComingSoon, Phone, SiteHeader, WEB_APP_URL } from '@/components/site/SiteChrome';
import caseloadShot from '@/assets/app/caseload.webp';
import journeyShot from '@/assets/app/journey.webp';

const FEATURES = [
  { icon: Bell, t: 'A caseload that tells you who needs you', d: 'Families sorted into needs attention, watch and on track — from missed appointments, slipping medications, high obsessive thinking, boundary slips, cash requests and unanswered messages.' },
  { icon: KeyRound, t: 'Consent built in', d: 'Families connect with your practice code, and a parent or partner chooses exactly what you see: money, meetings, appointments, medications, the family plan, check-ins and family chat. Every view is logged for them.' },
  { icon: MessagesSquare, t: 'Work alongside the family', d: 'Message the family, assign tasks, schedule sessions and keep private notes. If they share their family chat, you can read it and reply right inside it — clearly labeled as you.' },
  { icon: Sparkles, t: 'AI that does the paperwork', d: 'Weekly summaries, session prep, next steps, draft messages and handoff notes from what the family has shared. Family Insights shows readiness windows and who the loved one listens to.' },
  { icon: FlaskConical, t: 'Drug tests and lab results', d: 'Log program screens that the family can see but not edit. Partner-lab results arrive lab-verified and locked. Part of a new premium plan.', soon: true },
  { icon: Route, t: 'Handoffs that keep the story', d: 'Refer a family to the next level of care — treatment, sober living, IOP — with a handoff note. With the family’s approval, their whole history follows them, and you can stay involved or step back.' },
  { icon: LifeBuoy, t: 'SOS routes to you', d: 'When a family you work with taps SOS, you get an urgent push and email — not a stranger.' },
  { icon: Brush, t: 'Your brand, included', d: 'Families see your logo, name and colors throughout their app, with a small “with FamilyBridge.” White label is included with every plan.' },
  { icon: Gift, t: 'Family Plus for your families', d: 'Families you work with get Family Plus included on any paid plan — and keep it for 14 days after you complete their care.' },
];

const PLANS = [
  { name: 'Solo', price: '$149', families: 'Up to 15 families', who: 'Interventionists, recovery coaches and therapists' },
  { name: 'Practice', price: '$399', families: 'Up to 50 families', who: 'Group practices, sober living and outpatient programs', featured: true },
  { name: 'Organization', price: '$1,499', families: 'Unlimited families', who: 'Treatment centers and multi-site programs' },
];

const ForProviders = () => (
  <div className="min-h-screen bg-background">
    <SEOHead
      title="FamilyBridge for Treatment Professionals"
      description="A consent-based caseload, family chat, AI summaries, handoffs between levels of care and white label for the families you serve. From $149/month."
      canonicalPath="/for-providers"
      structuredData={createBreadcrumbSchema([{ name: 'Home', url: '/' }, { name: 'For professionals', url: '/for-providers' }])}
    />
    <SiteHeader right={<a href="#plans" className="hidden sm:inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90">See plans</a>} />

    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-secondary/70 to-background" aria-hidden="true" />
      <div className="container relative mx-auto px-4 max-w-6xl pt-12 pb-16 sm:pt-20 sm:pb-24 grid gap-12 lg:grid-cols-[1.1fr_0.9fr] items-center">
        <div className="max-w-xl">
          <p className="text-sm font-bold uppercase tracking-wider text-primary">For interventionists, treatment centers, therapists, coaches, sober living and IOP</p>
          <h1 className="mt-4 text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground [text-wrap:balance]">The family is part of the treatment plan. Now they're part of your workflow.</h1>
          <p className="mt-5 text-lg text-muted-foreground leading-relaxed">
            FamilyBridge gives your team a live view of how each family is really doing — with their consent — and one place to coach them, from the first call through aftercare.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#plans" className="inline-flex h-12 items-center gap-2 rounded-xl bg-primary px-5 font-semibold text-primary-foreground hover:bg-primary/90">See plans <ArrowRight className="h-4 w-4" /></a>
            <a href="mailto:matt@freedominterventions.com?subject=FamilyBridge%20for%20my%20practice" className="inline-flex h-12 items-center gap-2 rounded-xl border border-border bg-card px-5 font-semibold text-foreground hover:bg-muted"><Mail className="h-4 w-4" /> Talk with us</a>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">On iPhone, or at your desk — <a href={WEB_APP_URL} className="font-semibold text-primary underline-offset-4 hover:underline">sign in on the web</a> with the same account.</p>
        </div>
        <div className="mx-auto w-full max-w-[330px]"><Phone src={caseloadShot} alt="The FamilyBridge caseload for professionals" /></div>
      </div>
    </section>

    <section className="container mx-auto px-4 max-w-6xl py-16 sm:py-20">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(({ icon: Icon, t, d, soon }: { icon: React.ElementType; t: string; d: string; soon?: boolean }) => (
          <div key={t} className="rounded-2xl border border-border bg-card p-6">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary"><Icon className="h-5 w-5 text-primary" /></span>
            <h2 className="mt-4 flex flex-wrap items-center gap-2 text-lg font-bold text-foreground">{t}{soon ? <ComingSoon /> : null}</h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{d}</p>
          </div>
        ))}
      </div>
    </section>

    <section className="bg-[#134A51] text-white">
      <div className="container mx-auto px-4 max-w-6xl py-16 sm:py-24 grid gap-12 lg:grid-cols-2 items-center">
        <div className="max-w-xl">
          <p className="text-sm font-bold uppercase tracking-wider text-[#EE9B4A]">Continuity of care</p>
          <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight [text-wrap:balance]">From the intervention to independent living — one record.</h2>
          <ol className="mt-6 space-y-4">
            {[
              ['Intervention', 'You work with the family and place their loved one in treatment.'],
              ['Handoff', 'Refer the family to the treatment center with a note. They approve and choose what the center can see.'],
              ['Step-down', 'Treatment hands off to sober living and IOP. Each provider sees the whole journey — clinical notes only when shared.'],
              ['Independent living', 'The last provider completes care. The family keeps their history and continues on their own.'],
            ].map(([t, d], i) => (
              <li key={t} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EE9B4A] font-bold text-[#3E2507]">{i + 1}</span>
                <span><span className="font-semibold">{t}.</span> <span className="text-white/75">{d}</span></span>
              </li>
            ))}
          </ol>
        </div>
        <div className="mx-auto w-full max-w-[320px]"><Phone src={journeyShot} alt="A family file's Journey tab: referral from a treatment center, and a handoff to the next provider" /></div>
      </div>
    </section>

    <section id="plans" className="container mx-auto px-4 max-w-6xl py-16 sm:py-24 scroll-mt-20">
      <div className="max-w-2xl">
        <p className="text-sm font-bold uppercase tracking-wider text-primary">Plans</p>
        <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">Simple pricing, everything included.</h2>
        <p className="mt-3 text-muted-foreground">Every plan includes white label, the AI Assistant, handoffs, and Family Plus for the families you work with. Try it free with up to 3 families.</p>
      </div>
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {PLANS.map((p) => (
          <div key={p.name} className={`rounded-2xl bg-card p-7 ${p.featured ? 'border-2 border-primary' : 'border border-border'}`}>
            <h3 className="text-xl font-bold text-foreground">{p.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground min-h-[2.5rem]">{p.who}</p>
            <p className="mt-5 text-4xl font-extrabold text-foreground">{p.price}<span className="text-lg font-semibold text-muted-foreground">/month</span></p>
            <p className="mt-1 font-semibold text-primary">{p.families}</p>
            <ul className="mt-5 space-y-2 text-sm text-foreground">
              {['Unlimited staff', 'White label: your logo and colors', 'Family Plus for your families', 'AI Assistant and Family Insights'].map((x) => (
                <li key={x} className="flex gap-2"><BadgeCheck className="h-4 w-4 mt-0.5 text-primary shrink-0" />{x}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mt-10 flex flex-col sm:flex-row gap-4 sm:items-center">
        <p className="text-foreground font-semibold">Ready to bring your families in?</p>
        <div className="flex flex-wrap gap-3">
          <a href="mailto:matt@freedominterventions.com?subject=FamilyBridge%20plan%20for%20my%20practice" className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 font-semibold text-primary-foreground hover:bg-primary/90"><Mail className="h-4 w-4" /> matt@freedominterventions.com</a>
          <a href="tel:458-298-8003" className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-card px-5 font-semibold text-foreground hover:bg-muted"><PhoneIcon className="h-4 w-4" /> 458-298-8003</a>
        </div>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">Plans are billed monthly, directly by FamilyBridge. Download the app, create your practice, and start with up to 3 families free.</p>
      <div className="mt-6"><AppStoreBadge /></div>
    </section>

    <section className="bg-secondary/60">
      <div className="container mx-auto px-4 py-14 max-w-4xl">
        <div className="flex gap-4 items-start">
          <ShieldCheck className="h-7 w-7 text-primary shrink-0" />
          <div>
            <h2 className="text-xl font-bold text-foreground">Privacy and your obligations</h2>
            <p className="mt-2 text-muted-foreground leading-relaxed">
              Families control what your practice sees and can revoke it at any time. Access is enforced on our servers for every record, every view is logged for the family, and clinical notes stay private unless you choose to share them in a handoff. If your program is subject to HIPAA or 42 CFR Part 2, talk with us about your agreements before inviting families.
            </p>
            <Link to="/privacy" className="mt-3 inline-flex items-center gap-1 font-semibold text-primary hover:underline"><FileSignature className="h-4 w-4" /> Read our privacy policy</Link>
          </div>
        </div>
      </div>
    </section>

    <div className="container mx-auto px-4 py-8 max-w-3xl"><PublicCrisisHelp /></div>
    <BrandedFooter />
  </div>
);

export default ForProviders;
