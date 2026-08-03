import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SEOHead } from "@/components/SEOHead";
import { ProviderInquiryForm } from "@/components/ProviderInquiryForm";
import {
  ArrowRight,
  ArrowLeft,
  Calendar,
  Phone,
  Mail,
  Apple,
  CheckCircle2,
  Eye,
  Activity,
  Target,
  ScrollText,
  Brain,
  Scale,
  ShieldCheck,
} from "lucide-react";
import familyBridgeLogo from "@/assets/familybridge-logo.png";

/**
 * /for-providers — conference / referral landing page.
 *
 * Mirrors the provider trifold brochure: positioning copy first,
 * the 6-module system, what providers measure, and a clear
 * "book time with Matt" CTA. No payment forms — providers who
 * want pricing can ask for it on the call.
 */
const ForProviders = () => {
  const navigate = useNavigate();

  // TODO: Replace with your Google Calendar Appointment Schedule URL.
  // To create one: calendar.google.com → "+ Create" → "Appointment schedule"
  // → set duration to 20 min, name it "Provider intro call" → save →
  // click "Share" → "Copy booking page link" → paste here.
  // Until then, this falls back to an email link so the CTA still works.
  const calendarUrl =
    "mailto:matt@freedominterventions.com?subject=FamilyBridge%20Provider%20Demo%20Request&body=Hi%20Matt%2C%20I%27d%20like%20to%20learn%20more%20about%20FamilyBridge%20for%20our%20program.%20Best%20times%20to%20talk%3A";

  const appStoreUrl = "https://apps.apple.com/us/app/family-bridge-recovery/id6757375159";

  const modules = [
    {
      icon: Eye,
      tier: "Core Intelligence",
      title: "FIIS™ Pattern Detection",
      blurb:
        "Surfaces emotional, behavioral, and recovery patterns that fly under the radar between sessions.",
      points: ["Emotional pattern detection", "Recovery trajectory tracking", "Smart document analysis"],
    },
    {
      icon: Activity,
      tier: "Core Intelligence",
      title: "Outcome Observations",
      blurb:
        "Organizes documented changes, follow-through, and shared concerns for professional review without claiming to predict an individual outcome.",
      points: ["Documented outcome changes", "Shared concern signals", "Human-reviewed next steps"],
    },
    {
      icon: Target,
      tier: "Action Systems",
      title: "Intervention Planning",
      blurb:
        "A structured review of documented family observations, paired with careful, non-coercive planning.",
      points: ["Documented observations", "Execution planning", "In-the-moment conversation support"],
    },
    {
      icon: ScrollText,
      tier: "Action Systems",
      title: "Accountability Engine",
      blurb:
        "Behavioral contracts the whole family — and the provider team — can see, with performance tracking on both sides.",
      points: ["Shared commitment tracking", "Documented follow-through", "Behavioral agreements"],
    },
    {
      icon: Brain,
      tier: "Platform Integrity",
      title: "AI Learning Layer",
      blurb:
        "Privacy-thresholded aggregate insights support broader review without exposing another family’s private information.",
      points: ["Privacy-thresholded insights", "Aggregate pattern review", "Transparent and reversible"],
    },
    {
      icon: Scale,
      tier: "Platform Integrity",
      title: "Input Reconciliation",
      blurb:
        "Catches contradictions between family members, asks the next clarifying question, and assigns confidence to every data point.",
      points: ["Contradiction detection", "Depth prompting", "Data confidence scoring"],
    },
  ];

  const valueCards = [
    {
      title: "See what happens between scheduled calls.",
      body:
        "Documented family activity and observations give your team clearer context for the next authorized review or conversation.",
    },
    {
      title: "End he-said / she-said.",
      body:
        "Input Reconciliation flags contradictions between family members and prompts for clarity — so your team isn't refereeing the family system blind.",
    },
    {
      title: "Hold families to their commitments.",
      body:
        "Shared actions and behavioral agreements make boundary work visible, including what was decided and what still needs follow-through.",
    },
    {
      title: "Document the family-side work.",
      body:
        "Aftercare plans, HIPAA releases, medication compliance, financial coordination, and care transitions — captured in one record, not seven sticky notes.",
    },
    {
      title: "Differentiate your program.",
      body:
        "Offering a family platform of this depth signals seriousness to referents and families shopping for care. A clinical differentiator and a marketing one.",
    },
    {
      title: "Lighter load on your clinical team.",
      body:
        "Routine check-ins, conversation scripts, and boundary coaching are handled by the platform. Your clinicians stay focused on clinical work.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="FamilyBridge for Treatment Providers"
        description="FamilyBridge helps authorized treatment teams collaborate with families through privacy-conscious communication, documented actions, care transitions, and follow-through."
        canonicalPath="/for-providers"
      />

      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 hover:opacity-80 transition"
          >
            <img src={familyBridgeLogo} alt="FamilyBridge" className="h-8 w-auto" />
            <span className="text-lg font-display font-bold text-foreground">FamilyBridge</span>
          </button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="hidden sm:inline-flex">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Home
            </Button>
            <Button size="sm" asChild className="bg-primary text-primary-foreground">
              <a href={calendarUrl} target="_blank" rel="noopener noreferrer">
                <Calendar className="h-4 w-4 mr-1.5" />
                Book a call
              </a>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-accent">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-72 h-72 rounded-full bg-white/30 blur-3xl" />
          <div className="absolute bottom-10 left-10 w-72 h-72 rounded-full bg-white/20 blur-3xl" />
        </div>
        <div className="container mx-auto px-4 py-16 sm:py-24 relative">
          <div className="max-w-4xl">
            <p className="text-xs sm:text-sm uppercase tracking-[0.25em] text-primary-foreground/80 font-semibold mb-4">
              For Treatment Providers
            </p>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-display font-bold text-primary-foreground leading-tight tracking-tight mb-5">
              The family system, finally visible — and actionable.
            </h1>
            <p className="text-base sm:text-xl text-primary-foreground/90 max-w-3xl leading-relaxed mb-8">
              FamilyBridge gives authorized clinical teams a shared view of documented family activity while a loved one is in or after treatment — and gives families structure for communication, boundaries, and follow-through.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button size="lg" asChild className="bg-background text-foreground hover:bg-background/90 h-12 px-6">
                <a href={calendarUrl} target="_blank" rel="noopener noreferrer">
                  <Calendar className="h-5 w-5 mr-2" />
                  Book a 20-minute call with Matt
                  <ArrowRight className="h-4 w-4 ml-2" />
                </a>
              </Button>
              <Button size="lg" variant="outline" asChild className="h-12 px-6 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                <a href={appStoreUrl} target="_blank" rel="noopener noreferrer">
                  <Apple className="h-5 w-5 mr-2" />
                  Download on the App Store
                </a>
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/demo")} className="h-12 px-6 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                See the demo
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-8 text-sm text-primary-foreground/80">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" /> Pattern Detection
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" /> Boundary Coaching
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" /> Outcome Observations
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Why family-side blind spots stall outcomes */}
      <section className="container mx-auto px-4 py-14 sm:py-20">
        <div className="max-w-3xl">
          <p className="text-xs uppercase tracking-[0.2em] text-accent font-semibold mb-3">The Gap</p>
          <h2 className="text-2xl sm:text-4xl font-display font-bold text-foreground mb-5 tracking-tight">
            Why family-side blind spots stall outcomes.
          </h2>
          <div className="space-y-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
            <p>
              The work you do inside the building is only one half of the story. What happens at home — the enabling, the contradictions, the financial bleeding, the conversations that erode boundaries — is the other half.
            </p>
            <p>
              And until now, you have had no structured signal into it.
            </p>
            <p className="text-foreground font-medium">
              FamilyBridge organizes authorized family activity into documented information for human review — without asking the family to do clinical work they are not trained for.
            </p>
          </div>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10">
          <Card className="border-border/50">
            <CardContent className="p-6">
              <div className="text-3xl sm:text-4xl font-display font-bold text-primary mb-2">6</div>
              <p className="text-sm text-muted-foreground">Intelligence modules across detection, action, and platform integrity</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-6">
              <div className="text-3xl sm:text-4xl font-display font-bold text-primary mb-2">Shared</div>
              <p className="text-sm text-muted-foreground">Intervention planning and commitment tracking</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-6">
              <div className="text-3xl sm:text-4xl font-display font-bold text-primary mb-2">24/7</div>
              <p className="text-sm text-muted-foreground">FIIS™ coaching layer with moderator-escalation triggers</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* The full system */}
      <section className="bg-muted/30 border-y">
        <div className="container mx-auto px-4 py-14 sm:py-20">
          <div className="max-w-3xl mb-10">
            <p className="text-xs uppercase tracking-[0.2em] text-accent font-semibold mb-3">The Full System</p>
            <h2 className="text-2xl sm:text-4xl font-display font-bold text-foreground mb-3 tracking-tight">
              Six modules. Three layers. One platform.
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed">
              Every layer builds on the last — from seeing what is happening, to acting on it, to keeping the system itself trustworthy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {modules.map((m) => {
              const Icon = m.icon;
              return (
                <Card key={m.title} className="border-border/50 hover:border-primary/40 transition">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-widest text-accent font-semibold mb-1">{m.tier}</p>
                        <h3 className="text-lg font-display font-bold text-foreground leading-tight">{m.title}</h3>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-3">{m.blurb}</p>
                    <ul className="space-y-1.5">
                      {m.points.map((p) => (
                        <li key={p} className="text-sm text-foreground/80 flex items-start gap-2">
                          <span className="text-accent mt-0.5">▸</span>
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* What it does for your organization */}
      <section className="container mx-auto px-4 py-14 sm:py-20">
        <div className="max-w-3xl mb-10">
          <p className="text-xs uppercase tracking-[0.2em] text-accent font-semibold mb-3">What It Does For You</p>
          <h2 className="text-2xl sm:text-4xl font-display font-bold text-foreground mb-3 tracking-tight">
            Extend your clinical reach into the home — without adding staff.
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed">
            FamilyBridge is the layer that makes the family-side of recovery visible, structured, and supportable. Your team keeps doing what they do best. We carry the load between sessions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {valueCards.map((v, i) => (
            <Card key={v.title} className={`border-l-4 ${i % 2 === 0 ? "border-l-primary" : "border-l-accent"} border-t-border/50 border-r-border/50 border-b-border/50`}>
              <CardContent className="p-6">
                <h3 className="text-lg font-display font-bold text-foreground mb-2">{v.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{v.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Outcomes panel + dashboard preview */}
      <section className="bg-foreground">
        <div className="container mx-auto px-4 py-14 sm:py-20">
          <div className="max-w-3xl mb-10">
            <p className="text-xs uppercase tracking-[0.25em] text-accent font-semibold mb-3">Documentation Your Team Can Review</p>
            <h2 className="text-2xl sm:text-4xl font-display font-bold text-background mb-4 tracking-tight">
              Clear records of authorized family activity and follow-through.
            </h2>
            <p className="text-base text-background/70 leading-relaxed">
              FamilyBridge organizes the authorized family-side information your treatment plan already considers between sessions.
              Check-ins, documents, boundaries, and behavioral agreements remain connected to a longitudinal record
              your clinical team can review alongside its own professional assessment.
            </p>
          </div>

          {/* Dashboard mock */}
          <div className="rounded-2xl bg-background/[0.04] border border-background/10 p-4 sm:p-6 mb-10 shadow-2xl">
            {/* Title bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-background/10">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-md bg-accent/20 flex items-center justify-center">
                  <Activity className="h-4 w-4 text-accent" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-background/50 font-semibold">Family Group</p>
                  <p className="text-sm font-display font-bold text-background">Dearing • last 30 days</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] uppercase tracking-widest px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-300 font-semibold">
                  ● Engaged
                </span>
                <span className="text-[10px] uppercase tracking-widest px-2 py-1 rounded-full bg-amber-500/15 text-amber-300 font-semibold">
                  ⚠ 1 pattern flag
                </span>
              </div>
            </div>

            {/* Top row: shared activity summary + timeline */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="rounded-xl bg-background/[0.06] border border-background/10 p-4">
                <p className="text-[10px] uppercase tracking-widest text-background/50 font-semibold mb-2">Shared actions completed</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-display font-bold text-background">12</span>
                  <span className="text-xs text-background/40">of 14</span>
                  <span className="ml-2 text-xs font-semibold text-emerald-300">documented (30d)</span>
                </div>
                <div className="mt-3 h-1.5 w-full rounded-full bg-background/10 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-accent to-emerald-400" style={{ width: "86%" }} />
                </div>
                <p className="text-[11px] text-background/50 mt-2">Based on authorized shared activity</p>
              </div>

              <div className="md:col-span-2 rounded-xl bg-background/[0.06] border border-background/10 p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] uppercase tracking-widest text-background/50 font-semibold">30-Day Trajectory</p>
                  <p className="text-[11px] text-background/40">activity recorded by date</p>
                </div>
                <div className="flex items-end gap-[3px] h-20">
                  {[34, 38, 36, 42, 41, 45, 44, 48, 46, 50, 52, 49, 55, 58, 56, 60, 62, 61, 64, 63, 66, 68, 67, 70, 69, 71, 72, 73, 74, 74].map((v, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-sm bg-gradient-to-t from-accent/30 to-accent"
                      style={{ height: `${v}%` }}
                    />
                  ))}
                </div>
                <div className="mt-2 flex justify-between text-[10px] text-background/40">
                  <span>Apr 28</span>
                  <span>May 13</span>
                  <span>May 27</span>
                </div>
              </div>
            </div>

            {/* Metrics grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { dir: "↓", color: "text-emerald-300", label: "Family-driven crisis escalations", value: "2", sub: "vs. 7 prior 30d" },
                { dir: "↑", color: "text-emerald-300", label: "Aftercare plan completion", value: "84%", sub: "12 of 14 milestones" },
                { dir: "↑", color: "text-emerald-300", label: "Behavioral contract adherence", value: "91%", sub: "both sides tracking" },
                { dir: "↻", color: "text-emerald-300", label: "Shared concerns reviewed", value: "4", sub: "documented by the care team" },
                { dir: "↑", color: "text-emerald-300", label: "Family engagement", value: "6 of 7", sub: "members active weekly" },
                { dir: "↻", color: "text-amber-300", label: "Open pattern flag", value: "1", sub: "boundary erosion (mother)" },
              ].map((m) => (
                <div key={m.label} className="rounded-lg bg-background/[0.06] border border-background/10 p-3">
                  <div className="flex items-baseline justify-between mb-1">
                    <span className={`text-xl font-display font-bold ${m.color}`}>{m.dir}</span>
                    <span className="text-lg font-display font-bold text-background">{m.value}</span>
                  </div>
                  <p className="text-[11px] text-background/80 leading-tight font-medium">{m.label}</p>
                  <p className="text-[10px] text-background/55 leading-tight mt-1">{m.sub}</p>
                </div>
              ))}
            </div>

            <p className="text-[10px] uppercase tracking-widest text-background/30 font-semibold mt-4 text-center">
              Illustrative dashboard • sample data
            </p>
          </div>

          {/* What this means for you */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                title: "Designed for human review",
                body: "Records retain dates, sources, and authorization context so your team can review what was documented and how it was shared.",
              },
              {
                title: "Between-session visibility",
                body: "Review documented family observations between scheduled sessions, alongside what the client and care team discuss directly.",
              },
              {
                title: "Honest framing",
                body: "We track signals, not promises. We don't claim outcomes the platform can't measure. The data is yours to interpret with your team.",
              },
            ].map((b) => (
              <div key={b.title} className="rounded-xl bg-background/[0.04] border border-background/10 p-5">
                <p className="text-sm font-display font-bold text-background mb-2">{b.title}</p>
                <p className="text-xs text-background/60 leading-relaxed">{b.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="container mx-auto px-4 py-14 sm:py-20">
        <div className="max-w-3xl mb-10">
          <p className="text-xs uppercase tracking-[0.2em] text-accent font-semibold mb-3">How It Works</p>
          <h2 className="text-2xl sm:text-4xl font-display font-bold text-foreground mb-3 tracking-tight">
            From intervention to aftercare, three simple steps.
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed">
            No hardware. No new EHR. The family does the inputs. The platform does the work.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              n: "1",
              title: "Family is invited",
              body: "Your team — or the family themselves — creates a Family Group in minutes. Roles are assigned: spouse, parent, sibling, provider observer.",
            },
            {
              n: "2",
              title: "System listens & coaches",
              body: "Daily check-ins, document uploads, communication coaching, and boundary work feed the FIIS™ engine. Patterns surface; scores update.",
            },
            {
              n: "3",
              title: "You see what matters",
              body: "Provider-side dashboards organize documented concerns, contradictions, and follow-through so sessions can begin with shared context.",
            },
          ].map((s) => (
            <Card key={s.n} className="border-border/50">
              <CardContent className="p-6">
                <div className="h-9 w-9 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-bold text-lg mb-4">
                  {s.n}
                </div>
                <h3 className="text-lg font-display font-bold text-foreground mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Built on doctrine */}
      <section className="bg-muted/30 border-y">
        <div className="container mx-auto px-4 py-14 sm:py-20">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <p className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">Built On Doctrine You Can Defend</p>
            </div>
            <p className="text-base sm:text-lg text-foreground/90 leading-relaxed mb-5">
              FamilyBridge is a coaching and pattern-recognition platform — not a clinician, not a lawyer, not an emergency responder.
            </p>
            <ul className="space-y-2 mb-6">
              {[
                "No diagnosis. No treatment prescriptions. No legal advice.",
                "Crisis escalations route to 911 first, then to the family's designated moderator or interventionist.",
                "Every AI adaptation is volatility-aware, privacy-safe, transparent, and reversible.",
              ].map((p) => (
                <li key={p} className="flex items-start gap-2 text-sm sm:text-base text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 mt-1 text-primary flex-shrink-0" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
            <blockquote className="border-l-4 border-accent pl-5 italic text-foreground/90 text-base sm:text-lg leading-relaxed">
              "A boundary without a consequence is a request. Emotional escalation is not a consequence."
            </blockquote>
          </div>
        </div>
      </section>

      {/* Inquiry form (v2 Tier 1.1) */}
      <section id="contact" className="container mx-auto px-4 py-14 sm:py-20">
        <div className="max-w-3xl">
          <ProviderInquiryForm source="for-providers-page" />
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-16 sm:py-24">
        <Card className="border-0 overflow-hidden bg-gradient-to-br from-primary to-accent">
          <CardContent className="p-8 sm:p-12">
            <div className="max-w-3xl">
              <h2 className="text-2xl sm:text-4xl font-display font-bold text-primary-foreground mb-4 tracking-tight">
                Let's see if your program is a fit.
              </h2>
              <p className="text-base sm:text-lg text-primary-foreground/90 leading-relaxed mb-8 max-w-2xl">
                FamilyBridge is built for treatment providers who want their family-side work to be as rigorous as their clinical work. If that sounds like your program, we'd like to talk.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <Button size="lg" asChild className="bg-background text-foreground hover:bg-background/90 h-12 px-6">
                  <a href={calendarUrl} target="_blank" rel="noopener noreferrer">
                    <Calendar className="h-5 w-5 mr-2" />
                    Book a 20-minute call
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </a>
                </Button>
                <Button size="lg" variant="outline" asChild className="h-12 px-6 border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10">
                  <a href="mailto:matt@freedominterventions.com?subject=FamilyBridge%20for%20Providers">
                    <Mail className="h-5 w-5 mr-2" />
                    Email Matt directly
                  </a>
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-10 pb-8 border-b border-primary-foreground/20">
                <p className="text-sm text-primary-foreground/80 mr-2">Try it yourself —</p>
                <Button size="lg" asChild variant="outline" className="h-12 px-6 bg-foreground/95 border-foreground/95 text-background hover:bg-foreground hover:text-background">
                  <a href={appStoreUrl} target="_blank" rel="noopener noreferrer">
                    <Apple className="h-5 w-5 mr-2" />
                    Download on the App Store
                  </a>
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <p className="text-xs uppercase tracking-widest text-primary-foreground/70 font-semibold mb-1">Founder</p>
                  <p className="text-primary-foreground font-semibold">Matt Brown</p>
                  <p className="text-primary-foreground/80 text-sm">Freedom Interventions</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-primary-foreground/70 font-semibold mb-1">Phone</p>
                  <a href={"tel:+1" + "4582988003"} className="text-primary-foreground font-semibold inline-flex items-center gap-1.5 hover:underline">
                    <Phone className="h-4 w-4" />
                    458-298-8003
                  </a>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-primary-foreground/70 font-semibold mb-1">Email</p>
                  <a href="mailto:matt@freedominterventions.com" className="text-primary-foreground font-semibold inline-flex items-center gap-1.5 hover:underline break-all">
                    <Mail className="h-4 w-4 flex-shrink-0" />
                    matt@freedominterventions.com
                  </a>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/20">
        <div className="container mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <img src={familyBridgeLogo} alt="FamilyBridge" className="h-6 w-auto" />
            <span className="font-display font-semibold text-foreground">FamilyBridge</span>
            <span className="text-muted-foreground/60">·</span>
            <span>For Treatment Providers</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/")} className="hover:text-foreground transition">
              Home
            </button>
            <button onClick={() => navigate("/demo")} className="hover:text-foreground transition">
              Demo
            </button>
            <button onClick={() => navigate("/privacy-policy")} className="hover:text-foreground transition">
              Privacy
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ForProviders;
