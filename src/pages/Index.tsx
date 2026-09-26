import { Link } from 'react-router-dom';
import {
  ArrowRight, BadgeCheck, Briefcase, CalendarCheck, ClipboardList, Ear, FileText, FlaskConical, GitBranch, Heart,
  HeartHandshake, LifeBuoy, Lock, Mail, MessagesSquare, Mic, Pill, ShieldCheck, Sparkles, Sunrise, Target, Users, Wallet,
} from 'lucide-react';
import { BrandedFooter } from '@/components/BrandedFooter';
import { SEOHead, createOrganizationSchema } from '@/components/SEOHead';
import PublicCrisisHelp from '@/components/PublicCrisisHelp';
import { AppStoreBadge, ComingSoon, NewBadge, Phone, SiteHeader } from '@/components/site/SiteChrome';
import { HeroDynamic } from '@/components/site/HeroDynamic';
import todayShot from '@/assets/app/today.webp';
import insightsShot from '@/assets/app/insights.webp';
import chatShot from '@/assets/app/chat.webp';
import practiceShot from '@/assets/app/practice.webp';
import planShot from '@/assets/app/plan.webp';
import sosShot from '@/assets/app/sos.webp';
import liveShot from '@/assets/app/live.webp';
import caseloadShot from '@/assets/app/caseload.webp';

const TOOL_GROUPS: { title: string; blurb: string; items: { icon: React.ElementType; name: string; text: string; soon?: boolean; isNew?: boolean }[] }[] = [
  {
    title: 'Accountability',
    blurb: 'One honest record everyone can see, so nobody has to be the bad guy.',
    items: [
      { icon: Wallet, name: 'Money & requests', text: 'Requests, family votes, receipts, a monthly limit, and a “no cash” rule.' },
      { icon: Users, name: 'Meetings', text: 'AA, NA, SMART, Al-Anon — everyone logs, everyone has a goal.' },
      { icon: CalendarCheck, name: 'Appointments', text: 'Therapy, psychiatry, IOP and sponsor check-ins, with reminders.' },
      { icon: Pill, name: 'Medications', text: 'Daily doses and refills — shared only if the person chooses.' },
      { icon: FlaskConical, name: 'Drug testing', text: 'Home, program and partner-lab results in one honest record.', soon: true },
    ],
  },
  {
    title: 'Getting on the same page',
    blurb: 'Agreements the whole family signs off on — and sticks to.',
    items: [
      { icon: ShieldCheck, name: 'Family agreement', text: 'If-then boundaries everyone agrees to, with a record of when they held.' },
      { icon: Target, name: 'Shared goals', text: 'Personal and family goals broken into small steps.' },
      { icon: GitBranch, name: 'Relapse response plan', text: 'Warning signs and who does what — decided calmly, in advance.' },
      { icon: ClipboardList, name: 'Aftercare import', text: 'Photograph a discharge plan and AI turns it into your family’s plan.' },
    ],
  },
  {
    title: 'Communicating well',
    blurb: 'The hardest part of helping someone — made a little easier.',
    items: [
      { icon: MessagesSquare, name: 'Family chat', text: 'A respect filter stops insults and threats before they’re sent.' },
      { icon: Sparkles, name: 'AI coach', text: 'Help with what to say, trained on CRAFT and motivational interviewing.' },
      { icon: Mic, name: 'Practice a conversation', text: 'Rehearse a hard talk with AI playing your loved one — in a realistic voice matched to their age — then get kind, specific feedback.', isNew: true },
      { icon: Ear, name: 'Live Coaching', text: 'Real-time cues during a hard call or conversation. Nothing is recorded.' },
      { icon: FileText, name: 'Intervention letters', text: 'Write your letter with kind, honest feedback — never visible to your loved one.' },
    ],
  },
];

const FAQ = [
  { q: 'Who is FamilyBridge for?', a: 'Families of someone struggling with alcohol or drugs — before, during and after treatment — and the professionals who work with them: interventionists, treatment centers, therapists, recovery coaches, sober living and outpatient programs.' },
  { q: 'Does my loved one have to use it?', a: 'No. Many families start before their loved one is ready for help. If your loved one joins, they get their own view — check-ins, meetings, meds, wins — and never see intervention letters, conversation notes or Family Insights.' },
  { q: 'Is FamilyBridge free?', a: 'Yes — every tool is free for every family. Family Plus ($19.99 a month or $179 a year) adds much more AI coaching and covers everyone in your family with one subscription. If you work with a professional on a FamilyBridge plan, Family Plus is often included.' },
  { q: 'Can I practice what to say before a hard conversation?', a: 'Yes. Practice a conversation lets you rehearse with an AI playing your loved one — matched to their age, and to how they tend to react — in a realistic voice. You go first, they push back like they might, and afterward you get kind, specific feedback and a line to try. Your practice is private; your loved one never sees it.' },
  { q: 'Is the AI reading everything?', a: 'Only if you say so. AI features are off until you agree, and Family Insights only runs if someone in your family turns it on. Everything is processed by Claude (Anthropic), which doesn’t train on your information. You can turn AI off anytime.' },
  { q: 'What happens when I tap SOS?', a: 'If you have a professional, SOS sends them an urgent message. If you don’t, you can open a 24-hour messaging session with a certified interventionist — one is included each billing cycle. In an emergency, always call 911 or 988 first.' },
  { q: 'Can a professional see everything?', a: 'No. A parent or partner chooses exactly what each professional can see — money, meetings, appointments, medications, your plan, check-ins, chat — and can change it or disconnect at any time.' },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="FamilyBridge — Recovery Is a Family Journey"
        description="Keep your family on the same page through a loved one's recovery: shared accountability, AI coaching for hard conversations, and real help when it matters."
        canonicalPath="/"
        structuredData={createOrganizationSchema()}
      />

      <SiteHeader
        right={<a href="#download" className="hidden sm:inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90">Get the app</a>}
      />

      <HeroDynamic />

      {/* WHY */}
      <section className="container mx-auto px-4 max-w-6xl py-14 sm:py-20">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { icon: Users, t: 'Everyone on the same page', d: 'Parents, partners, siblings and your loved one share one plan, one record and one set of agreements.' },
            { icon: HeartHandshake, t: 'Coaching for the hard moments', d: 'Know what to say — before, during and after the conversations that matter most.' },
            { icon: LifeBuoy, t: 'Real help, built in', d: 'Your treatment team inside the app, and an SOS line to a certified interventionist when you need it.' },
          ].map(({ icon: Icon, t, d }) => (
            <div key={t} className="rounded-2xl border border-border bg-card p-6">
              <Icon className="h-6 w-6 text-primary" />
              <h2 className="mt-4 text-lg font-bold text-foreground">{t}</h2>
              <p className="mt-2 text-muted-foreground leading-relaxed">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAMILY INSIGHTS */}
      <section className="bg-[#134A51] text-white">
        <div className="container mx-auto px-4 max-w-6xl py-16 sm:py-24 grid gap-12 lg:grid-cols-2 items-center">
          <div className="order-2 lg:order-1 mx-auto w-full max-w-[320px]">
            <Phone src={insightsShot} alt="Family Insights: the window with your loved one, who they'll listen to, and coaching for you" />
          </div>
          <div className="order-1 lg:order-2 max-w-xl">
            <p className="text-sm font-bold uppercase tracking-wider text-[#EE9B4A]">Family Insights</p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight [text-wrap:balance]">Know when they're ready — and who they'll listen to.</h2>
            <p className="mt-4 text-lg text-white/80 leading-relaxed">
              Family Insights looks across your family's chat, conversation notes, check-ins and agreements, and coaches each of you — privately.
            </p>
            <ul className="mt-6 space-y-4">
              {[
                ['A window may be opening', 'Spots the moments your loved one may be ready to accept help — with the quotes that show it, what to say, and when.'],
                ['Who they will hear', 'Ranks the family members your loved one is most likely to listen to right now.'],
                ['Coaching for you', 'What’s working, your own words rewritten more effectively, and a next line to try.'],
                ['Where you’re drifting', 'Notices when boundaries slip, money goes out against the plan, or goals stall.'],
              ].map(([t, d]) => (
                <li key={t} className="flex gap-3">
                  <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#9ED6DB]" />
                  <span><span className="font-semibold">{t}.</span> <span className="text-white/75">{d}</span></span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-white/60">Your loved one never sees Family Insights. It's coaching, not a diagnosis — and it only runs if your family turns it on.</p>
          </div>
        </div>
      </section>

      {/* TOOLS */}
      <section id="features" className="container mx-auto px-4 max-w-6xl py-16 sm:py-24 scroll-mt-20">
        <div className="max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-wider text-primary">Everything in one place</p>
          <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground [text-wrap:balance]">The tools families actually need.</h2>
        </div>
        <div className="mt-10 grid gap-8 lg:grid-cols-3">
          {TOOL_GROUPS.map((g) => (
            <div key={g.title} className="rounded-2xl border border-border bg-card p-6">
              <h3 className="text-lg font-bold text-foreground">{g.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{g.blurb}</p>
              <ul className="mt-5 space-y-4">
                {g.items.map(({ icon: Icon, name, text, soon, isNew }) => (
                  <li key={name} className="flex gap-3">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary"><Icon className="h-[18px] w-[18px] text-primary" /></span>
                    <span><span className="flex flex-wrap items-center gap-2 font-semibold text-foreground">{name}{soon ? <ComingSoon /> : null}{isNew ? <NewBadge /> : null}</span><span className="text-sm text-muted-foreground">{text}</span></span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-14 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">
          {[
            [practiceShot, 'Practicing a hard conversation: a mom rehearses saying no to cash with an AI playing her son'],
            [planShot, 'Our plan: how much the family agrees on, and boundaries that need a conversation'],
            [chatShot, 'Family chat with a respect filter and a reply from the family’s coach'],
            [liveShot, 'Live Coaching setup for a hard conversation'],
          ].map(([src, alt]) => (
            <Phone key={src} src={src} alt={alt} />
          ))}
        </div>
      </section>

      {/* SOS */}
      <section className="bg-card border-y border-border">
        <div className="container mx-auto px-4 max-w-6xl py-16 sm:py-24 grid gap-12 lg:grid-cols-2 items-center">
          <div className="max-w-xl">
            <p className="text-sm font-bold uppercase tracking-wider text-destructive">SOS</p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground [text-wrap:balance]">When it's too much, a real person answers.</h2>
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
              One tap brings up 911, 988 and overdose steps. Then it connects you with a human: an urgent message to your own professional — or, if you don't have one, a 24-hour messaging session with a certified interventionist.
            </p>
            <ul className="mt-6 space-y-2 text-foreground">
              <li className="flex gap-2"><Heart className="h-5 w-5 text-destructive shrink-0" /> One 24-hour session included every billing cycle</li>
              <li className="flex gap-2"><Heart className="h-5 w-5 text-destructive shrink-0" /> Your professional can invite you to keep working together afterward</li>
            </ul>
          </div>
          <div className="mx-auto w-full max-w-[320px]"><Phone src={sosShot} alt="The SOS screen: 911, 988, SAMHSA and reaching your care team" /></div>
        </div>
      </section>

      {/* PROFESSIONALS */}
      <section className="container mx-auto px-4 max-w-6xl py-16 sm:py-24">
        <div className="grid gap-12 lg:grid-cols-2 items-center">
          <div className="mx-auto w-full max-w-[320px] order-2 lg:order-1"><Phone src={caseloadShot} alt="The professional caseload: families that need attention, watch, and on track" /></div>
          <div className="max-w-xl order-1 lg:order-2">
            <p className="text-sm font-bold uppercase tracking-wider text-primary">With your professionals</p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground [text-wrap:balance]">Your treatment team, on the same page too.</h2>
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
              Connect your interventionist, treatment center, therapist, coach, sober living or IOP with a code. You choose exactly what they see. When care moves from one provider to the next, your history moves with you — only with your approval.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {['You choose what they see', 'Handoffs with your history', 'Their logo and colors in your app', 'Family Plus often included'].map((x) => (
                <span key={x} className="rounded-full bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground">{x}</span>
              ))}
            </div>
            <Link to="/for-providers" className="mt-8 inline-flex items-center gap-2 font-semibold text-primary hover:underline">
              <Briefcase className="h-4 w-4" /> FamilyBridge for professionals <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* PRIVACY */}
      <section className="bg-secondary/60">
        <div className="container mx-auto px-4 max-w-6xl py-14 sm:py-20">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-wider text-primary">Privacy by design</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-foreground">Your family's story stays yours.</h2>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['You decide what’s shared', 'Professionals see only the areas a parent or partner turns on — and every view is logged.'],
              ['Private where it matters', 'Letters, conversation notes and Family Insights are never visible to your loved one.'],
              ['AI only with permission', 'AI features stay off until you agree, and Anthropic doesn’t train on your information.'],
              ['Delete anytime', 'Delete your account and your data from inside the app.'],
            ].map(([t, d]) => (
              <div key={t} className="rounded-2xl bg-card border border-border p-5">
                <Lock className="h-5 w-5 text-primary" />
                <p className="mt-3 font-semibold text-foreground">{t}</p>
                <p className="mt-1 text-sm text-muted-foreground">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="container mx-auto px-4 max-w-6xl py-16 sm:py-24 scroll-mt-20">
        <div className="max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-wider text-primary">Pricing</p>
          <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">One price for the whole family.</h2>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-2 max-w-4xl">
          <div className="rounded-2xl border border-border bg-card p-7">
            <h3 className="text-xl font-bold text-foreground">Free</h3>
            <p className="mt-1 text-muted-foreground">Every tool, for every family.</p>
            <p className="mt-6 text-4xl font-extrabold text-foreground">$0</p>
            <ul className="mt-6 space-y-2 text-sm text-foreground">
              {['Every accountability and planning tool', 'Family chat with the respect filter', 'Family Insights, Live Coaching and letter feedback', 'Conversation practice: 1 a week', 'Aftercare plan import', 'One 24-hour SOS session each billing cycle', 'AI Coach: 10 questions a day per person'].map((x) => <li key={x} className="flex gap-2"><BadgeCheck className="h-4 w-4 mt-0.5 text-primary shrink-0" />{x}</li>)}
            </ul>
          </div>
          <div className="rounded-2xl border-2 border-primary bg-card p-7 relative">
            <h3 className="text-xl font-bold text-foreground">Family Plus</h3>
            <p className="mt-1 text-muted-foreground">Covers everyone in your family.</p>
            <p className="mt-6 text-4xl font-extrabold text-foreground">$19.99<span className="text-lg font-semibold text-muted-foreground">/month</span></p>
            <p className="text-sm text-muted-foreground">or $179/year — save 25%</p>
            <ul className="mt-6 space-y-2 text-sm text-foreground">
              {['Everything in Free', '6× more AI Coach: 60 questions a day per person', 'Conversation practice: up to 10 a day', 'One subscription covers everyone in the family', 'Funds the AI and new tools, so every family keeps them free'].map((x) => <li key={x} className="flex gap-2"><BadgeCheck className="h-4 w-4 mt-0.5 text-primary shrink-0" />{x}</li>)}
            </ul>
          </div>
        </div>
        <div className="mt-6 max-w-4xl flex gap-3 rounded-2xl border border-dashed border-accent/60 bg-accent/10 p-5">
          <FlaskConical className="h-5 w-5 mt-0.5 shrink-0 text-[#9A5A1C]" />
          <p className="text-sm text-foreground"><span className="font-semibold">Coming soon: drug testing.</span> Home, program and partner-lab results in one honest record, with lab kits included. It will be part of a new premium plan for families and professionals.</p>
        </div>
        <p className="mt-6 max-w-4xl text-sm text-muted-foreground">Working with a professional on a FamilyBridge plan? Family Plus is often included while you're in their care. Subscriptions are billed through your Apple ID and renew automatically until cancelled.</p>
      </section>

      {/* FAQ */}
      <section className="bg-card border-t border-border">
        <div className="container mx-auto px-4 py-16 sm:py-20 max-w-3xl">
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground">Questions families ask</h2>
          <div className="mt-8 divide-y divide-border">
            {FAQ.map(({ q, a }) => (
              <details key={q} className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-foreground">
                  {q}
                  <span className="text-primary transition-transform group-open:rotate-45 text-2xl leading-none">+</span>
                </summary>
                <p className="mt-3 text-muted-foreground leading-relaxed">{a}</p>
              </details>
            ))}
          </div>
          <p className="mt-8 text-muted-foreground">
            More questions? Visit <Link to="/support" className="font-semibold text-primary hover:underline">Support</Link> or email{' '}
            <a href="mailto:matt@freedominterventions.com" className="font-semibold text-primary hover:underline"><Mail className="inline h-4 w-4 mr-0.5" />matt@freedominterventions.com</a>.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#134A51]">
        <div className="container mx-auto px-4 max-w-6xl py-16 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white [text-wrap:balance]">Start today. Your family doesn't have to do this alone.</h2>
          <div className="mt-8 flex justify-center"><AppStoreBadge dark={false} /></div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8 max-w-3xl"><PublicCrisisHelp /></div>
      <BrandedFooter />
    </div>
  );
};

export default Index;
