import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, Clock, CreditCard, KeyRound, LifeBuoy, Loader2, Mail, MapPin, MessageCircle, Phone, Send, ShieldCheck, Sparkles, Stethoscope, Users } from 'lucide-react';
import { BrandedFooter } from '@/components/BrandedFooter';
import { SEOHead, createBreadcrumbSchema } from '@/components/SEOHead';
import PublicCrisisHelp from '@/components/PublicCrisisHelp';
import { SiteHeader } from '@/components/site/SiteChrome';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const TOPICS: { icon: React.ElementType; title: string; items: { q: string; a: React.ReactNode }[] }[] = [
  {
    icon: Users,
    title: 'Getting started',
    items: [
      { q: 'How do I set up my family?', a: 'Download FamilyBridge from the App Store, create an account, and choose “Start our family.” Share your family’s invite code from Tools → Family Members (others choose “Join my family”). People who join with the code wait for a parent or partner to approve them.' },
      { q: 'Does my loved one need to join?', a: 'No. Many families start before their loved one is ready. If they join, they get their own view and never see intervention letters, conversation notes or Family Insights.' },
      { q: 'Can I use FamilyBridge on a computer or an Android phone?', a: <>Yes. Sign in at <a href="https://app.familybridgeapp.com">app.familybridgeapp.com</a> in any web browser, on a computer or on an Android phone or tablet, with the same account you use on iPhone. Family invite links offer the browser too, so a relative without an iPhone can still join your family. A few things need the iPhone or iPad app, such as subscribing to Family Plus and notifications. An Android app is on the way. Practice owners can choose or manage their plan online in <a href="/practice-billing">Practice billing</a>.</> },
      { q: 'Why does the app ask where my loved one is?', a: 'When you set up your family, you choose where your loved one is right now — still using, in treatment, or early recovery. Tools shows that stage’s tools first (“Show all tools” shows the rest), and the family program follows the same stage. Change it anytime from “Where we are” at the top of the Together tab.' },
      { q: 'Can I use FamilyBridge in Spanish?', a: 'Yes. FamilyBridge follows your phone’s language, and you can switch between English and Spanish in Tools → Family Members.' },
    ],
  },
  {
    icon: KeyRound,
    title: 'Your account',
    items: [
      { q: 'I forgot my password.', a: 'On the sign-in screen, enter your email, choose Sign in, then tap “Forgot password?” We’ll email you a link that opens the app so you can choose a new password.' },
      { q: 'How do I delete my account?', a: 'In the app: Settings (Tools → Family Members, or Practice for professionals) → Privacy & account → Delete my account, then type DELETE to confirm. This permanently deletes your account and personal information. If you’re the only account in your family or practice, it’s deleted too.' },
      { q: 'How do I get a copy of my data?', a: 'Email us using the form on this page and we’ll help.' },
    ],
  },
  {
    icon: CreditCard,
    title: 'Subscriptions and billing',
    items: [
      { q: 'What does Family Plus include?', a: 'Family Plus ($19.99 a month) covers everyone in your family with one subscription. It includes the full family program, every AI feature — the AI Coach (up to 60 questions a day each), Live Coaching, conversation practice, daily Family Insights, letter feedback and document reading — and one 24-hour SOS session each billing cycle. Without it, every planning, accountability and safety tool stays free, along with the first three lessons, a few AI Coach questions and text rewrites a day, and one Family Insights read a month. Subscribe in Tools → Family Members → FamilyBridge Plus.' },
      { q: 'How do I cancel or change my subscription?', a: 'Subscriptions are billed by Apple. On your iPhone, open Settings → your name → Subscriptions → FamilyBridge. Deleting your account doesn’t cancel a subscription.' },
      { q: 'How do refunds work?', a: 'Refunds for App Store purchases are handled by Apple at reportaproblem.apple.com.' },
      { q: 'My practice covers our family. Why am I seeing a price?', a: 'Family Plus is included while your practice’s plan is active and for 14 days after they complete your care. After that, you can continue on your own subscription.' },
    ],
  },
  {
    icon: LifeBuoy,
    title: 'SOS and safety',
    items: [
      { q: 'Where are the safety tools?', a: 'On the Tools tab: What’s happening right now? (a 60-second plan for hard moments), the Early-Warning Radar, Overdose Ready (your family’s naloxone kits, and where to get naloxone in your state) and Reach Out. They’re free for every family.' },
      { q: 'What happens when I tap SOS?', a: 'You’ll see 911, 988 and overdose steps first. If you work with a professional, SOS sends them an urgent message. Otherwise you can open a 24-hour messaging session with a certified interventionist — one is included every billing cycle, and extra sessions can be purchased in the app.' },
      { q: 'Is SOS an emergency service?', a: 'No. If anyone may be in danger, call 911. For a mental-health crisis, call or text 988.' },
    ],
  },
  {
    icon: MapPin,
    title: 'Meetings, location and documents',
    items: [
      { q: 'How do I find a meeting?', a: 'Tools → Find a Meeting. Choose who it’s for, then use your location or type a city. The app searches NA across the US, AA in more than 40 metro areas and online, Recovery Dharma, Refuge Recovery and Crystal Meth Anonymous. Fellowships that keep their lists on their own sites (Al-Anon, Nar-Anon, PAL, Families Anonymous, SMART and others) open their own finder in one tap.' },
      { q: 'Why does it say AA’s list for my area isn’t open to other apps?', a: 'AA has no single national list. Each local office publishes its own, and some don’t allow other apps to read theirs. Where that’s the case FamilyBridge says so and points you to AA’s own Meeting Guide, rather than showing “no meetings”.' },
      { q: 'Does FamilyBridge track anyone’s location?', a: 'No. Location is read once, only when you tap a button: to check in or check out, to search for meetings near you, or to answer a family member who asked where you are. Nothing is ever read in the background.' },
      { q: 'Who can ask where I am, and who sees my answer?', a: 'Only your family’s helpers can ask, and only if you turned on “Let my family ask where I am” (Tools → Location Check-ins). You choose each time whether to share or say “not now”, and only the person who asked sees your answer. A helper’s location is never shown to the person in recovery. A request lapses after two hours.' },
      { q: 'How long are locations kept?', a: 'Exact map points are deleted after 90 days. The place name and time stay as your family’s record until you delete the check-in or your account. An answer you gave to someone who asked stays with the two of you.' },
      { q: 'Who can open a document I add?', a: 'You choose for each one: your whole family, the family’s helpers only, or only you, and whether a professional you’re connected with can open it. Documents can be a PDF or a photo, up to 10 MB. A parent or partner can also remove a document that was shared with the family.' },
      { q: 'What is a release of information?', a: 'Your own written permission for a provider to talk with the family members you name, about the things you choose, for a length of time you choose (from 3 months to 2 years). You sign it for your own information only, and you can revoke it at any time. It is a convenience for families and providers, not legal advice; your provider may still need its own form.' },
    ],
  },
  {
    icon: Stethoscope,
    title: 'Professionals',
    items: [
      { q: 'How do we find a professional?', a: 'Tools → Find a professional. Answer a few short questions and you see interventionists, family coaches, therapists and drug and alcohol counselors who fit your family, never treatment programs. Licensed professionals appear only in the states where they’re licensed. Tap Ask for help to send a request; if they say yes, you get their connect code. Every professional listed confirmed they take no payment from treatment programs for placements, and FamilyBridge reviewed each listing.' },
      { q: 'How do we connect our professional?', a: 'Ask them for their family connect code, then go to Tools → Our Professionals. A parent or partner chooses what they can see, and can change it or disconnect anytime. When a practice provides your FamilyBridge on its paid plan, it sees the family-wide areas, and each person signs (or declines) their own release for their messages, notes, location check-ins, medications and private documents. You can take your release back in Tools → Our Professionals.' },
      { q: 'I’m a professional. How do I start?', a: <>Download the app, create an account and choose “Set up my practice” — you can work with up to 3 families free, with 5 AI Assistant answers to try. See <Link to="/for-providers">plans for professionals</Link>.</> },
      { q: 'Is there a report for my practice?', a: 'Yes. On the Practice tab, open Monthly outcomes report: families connected and engaged, session attendance, your median reply time and family activity, counted only from what each family shares with you. You can share it with your team, funders or referral partners.' },
      { q: 'What happens in a handoff?', a: 'When a professional refers your family to another provider, you get a notice in the app. Nothing is shared until a parent or partner accepts and chooses what the new provider can see.' },
    ],
  },
  {
    icon: Sparkles,
    title: 'Privacy and AI',
    items: [
      { q: 'How do AI features work?', a: <>AI features use Claude by Anthropic and stay off until you agree. You can turn them off in Tools → Family Members → Privacy &amp; account (professionals: the Practice tab). Anthropic doesn’t train on your information. If you choose to hear conversation practice out loud, ElevenLabs turns the AI’s replies into speech — it never receives your voice. See our <Link to="/privacy">Privacy Policy</Link>.</> },
      { q: 'Does Live Coaching record my calls?', a: 'No. FamilyBridge records and saves nothing. Your phone’s speech service turns speech into text — on the phone itself when it supports that, otherwise Apple’s speech service may process it — and only the latest words are sent for coaching. For a phone call, put the call on speaker on another phone or a landline: iPhone doesn’t let any app listen to a call on the same phone. Everyone in the conversation should know you’re using it — some states require their consent.' },
    ],
  },
];

const Support = () => {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });

  // Context passed in from links inside the app.
  const userType = searchParams.get('type') as 'family' | 'moderator' | 'provider' | null;
  const accountNumber = searchParams.get('account');
  const organizationName = searchParams.get('org');
  const organizationId = searchParams.get('orgId');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      toast({ title: 'Missing information', description: 'Please fill in your name, email, and message.', variant: 'destructive' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast({ title: 'Invalid email', description: 'Please enter a valid email address.', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke('send-support-email', {
        body: {
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          message: formData.message.trim(),
          accountNumber: accountNumber || undefined,
          organizationName: organizationName || undefined,
          organizationId: organizationId || undefined,
          userType: userType || 'family',
        },
      });
      if (error) throw error;
      setIsSubmitted(true);
      toast({ title: 'Message sent', description: "We'll get back to you as soon as possible." });
    } catch (error) {
      console.error('Error sending support email:', error);
      toast({ title: 'Something went wrong', description: 'Please try again or email us directly.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead
        title="FamilyBridge Support"
        description="Help with FamilyBridge: family setup, passwords, deleting your account, subscriptions, SOS, working with professionals, and privacy."
        canonicalPath="/support"
        structuredData={createBreadcrumbSchema([{ name: 'Home', url: '/' }, { name: 'Support', url: '/support' }])}
      />
      <SiteHeader />

      <main className="flex-1">
        <section className="bg-gradient-to-b from-secondary/70 to-background">
          <div className="container mx-auto px-4 py-12 sm:py-16 max-w-5xl">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">How can we help?</h1>
            <p className="mt-3 text-lg text-muted-foreground max-w-2xl">Answers to common questions below — or send us a message and a real person will get back to you, usually within one business day.</p>
            <PublicCrisisHelp className="mt-6 max-w-3xl" />
          </div>
        </section>

        <section className="container mx-auto px-4 py-10 max-w-5xl grid gap-6 md:grid-cols-2">
          {TOPICS.map(({ icon: Icon, title, items }) => (
            <div key={title} className="rounded-2xl border border-border bg-card p-6">
              <h2 className="flex items-center gap-2 text-lg font-bold text-foreground"><Icon className="h-5 w-5 text-primary" /> {title}</h2>
              <div className="mt-3 divide-y divide-border">
                {items.map(({ q, a }) => (
                  <details key={q} className="group py-3">
                    <summary className="flex cursor-pointer list-none items-start justify-between gap-3 font-semibold text-foreground">
                      {q}
                      <span className="text-primary text-xl leading-none transition-transform group-open:rotate-45">+</span>
                    </summary>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground [&_a]:text-primary [&_a]:underline">{a}</p>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </section>

        <section id="contact" className="container mx-auto px-4 pb-16 max-w-5xl grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="flex items-center gap-2 text-lg font-bold text-foreground"><MessageCircle className="h-5 w-5 text-primary" /> Send us a message</h2>
            {isSubmitted ? (
              <div className="py-10 text-center">
                <CheckCircle className="mx-auto h-14 w-14 text-success" />
                <p className="mt-3 text-lg font-semibold text-foreground">Message sent</p>
                <p className="mt-1 text-muted-foreground">Thank you — we'll reply by email, usually within one business day.</p>
                <Button variant="outline" className="mt-5" onClick={() => { setIsSubmitted(false); setFormData({ name: '', email: '', phone: '', message: '' }); }}>Send another message</Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5"><Label htmlFor="name">Name *</Label><Input id="name" name="name" value={formData.name} onChange={onChange} autoComplete="name" required /></div>
                  <div className="space-y-1.5"><Label htmlFor="email">Email *</Label><Input id="email" name="email" type="email" value={formData.email} onChange={onChange} autoComplete="email" required /></div>
                </div>
                <div className="space-y-1.5"><Label htmlFor="phone">Phone (optional)</Label><Input id="phone" name="phone" type="tel" value={formData.phone} onChange={onChange} autoComplete="tel" /></div>
                <div className="space-y-1.5"><Label htmlFor="message">How can we help? *</Label><Textarea id="message" name="message" rows={5} value={formData.message} onChange={onChange} required /></div>
                {organizationName ? <p className="text-xs text-muted-foreground">Practice: {organizationName}</p> : null}
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending…</> : <><Send className="mr-2 h-4 w-4" /> Send message</>}
                </Button>
              </form>
            )}
          </div>
          <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <h2 className="text-lg font-bold text-foreground">Other ways to reach us</h2>
            <a href="mailto:matt@freedominterventions.com" className="flex items-center gap-3 text-foreground hover:text-primary"><Mail className="h-5 w-5 text-primary" /> matt@freedominterventions.com</a>
            <a href="tel:458-298-8003" className="flex items-center gap-3 text-foreground hover:text-primary"><Phone className="h-5 w-5 text-primary" /> 458-298-8003</a>
            <p className="flex items-center gap-3 text-muted-foreground"><Clock className="h-5 w-5 text-primary" /> Replies usually within one business day</p>
            <div className="pt-2 border-t border-border text-sm text-muted-foreground space-y-1">
              <p className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link> · <Link to="/terms" className="text-primary hover:underline">Terms</Link> · <Link to="/eula" className="text-primary hover:underline">EULA</Link></p>
            </div>
          </div>
        </section>
      </main>
      <BrandedFooter />
    </div>
  );
};

export default Support;
