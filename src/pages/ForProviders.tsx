import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SEOHead } from "@/components/SEOHead";
import {
  ArrowRight,
  ArrowLeft,
  Calendar,
  Phone,
  Mail,
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
      title: "Outcome Predictions",
      blurb:
        "Probabilistic modeling that flags risk shifts before they show up in a session — quietly, on real signal.",
      points: ["Completion probability", "Relapse risk forecasting", "Actionable recommendations"],
    },
    {
      icon: Target,
      tier: "Action Systems",
      title: "Intervention Readiness",
      blurb:
        "A 0–100 readiness score grounded in observable behavior, plus structured execution planning.",
      points: ["Readiness scoring (0–100)", "Execution planning", "Real-time conversation coaching"],
    },
    {
      icon: ScrollText,
      tier: "Action Systems",
      title: "Accountability Engine",
      blurb:
        "Behavioral contracts the whole family — and the provider team — can see, with performance tracking on both sides.",
      points: ["Family accountability scoring", "Provider performance tracking", "Behavioral contracts"],
    },
    {
      icon: Brain,
      tier: "Platform Integrity",
      title: "AI Learning Layer",
      blurb:
        "Privacy-preserving, evidence-proportional adaptation. The platform gets smarter without becoming a black box.",
      points: ["Privacy-preserving insights", "Cross-case pattern learning", "Transparent and reversible"],
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
      title: "Catch the slip before the call comes in.",
      body:
        "Pattern detection and trajectory tracking surface emotional and behavioral shifts days before they become a phone call from a panicked parent.",
    },
    {
      title: "End he-said / she-said.",
      body:
        "Input Reconciliation flags contradictions between family members and prompts for clarity — so your team isn't refereeing the family system blind.",
    },
    {
      title: "Hold families to their commitments.",
      body:
        "Behavioral contracts and accountability scoring make boundary work visible. Enabling stops being invisible labor — it becomes a measurable variable.",
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
        description="FamilyBridge gives clinical teams a real-time view of the family system — pattern detection, intervention readiness, accountability tracking, and AI-driven outcome predictions. Extend your clinical reach into the home without adding staff."
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
              FamilyBridge gives clinical teams a real-time view of what's happening inside the family while a loved one is in or after treatment — and gives families the structure, coaching, and accountability that protects your clinical work.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button size="lg" asChild className="bg-background text-foreground hover:bg-background/90 h-12 px-6">
                <a href={calendarUrl} target="_blank" rel="noopener noreferrer">
                  <Calendar className="h-5 w-5 mr-2" />
                  Book a 20-minute call with Matt
                  <ArrowRight className="h-4 w-4 ml-2" />
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
                <CheckCircle2 className="h-4 w-4" /> Outcome Predictions
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
              FamilyBridge turns the family system into observable, supportable, measurable data — without asking the family to do clinical work they aren't trained for.
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
              <div className="text-3xl sm:text-4xl font-display font-bold text-primary mb-2">0–100</div>
              <p className="text-sm text-muted-foreground">Intervention readiness and accountability scoring</p>
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

      {/* Outcomes panel */}
      <section className="bg-foreground">
        <div className="container mx-auto px-4 py-14 sm:py-20">
          <p className="text-xs uppercase tracking-[0.25em] text-accent font-semibold mb-3">What Providers Can Measure</p>
          <h2 className="text-2xl sm:text-4xl font-display font-bold text-background mb-10 tracking-tight max-w-3xl">
            Measurable shifts, not just better feelings.
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { dir: "↓", label: "Family-driven crisis escalations between sessions" },
              { dir: "↑", label: "Aftercare plan completion and adherence" },
              { dir: "↑", label: "Family follow-through on behavioral contracts" },
              { dir: "↑", label: "Visibility into post-discharge trajectory" },
            ].map((o) => (
              <div key={o.label}>
                <div className="text-5xl font-display font-bold text-background mb-2">{o.dir}</div>
                <p className="text-sm text-background/70 leading-relaxed">{o.label}</p>
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
              body: "Provider-side dashboards show readiness, risk, contradiction flags, and accountability — so your sessions start grounded in real signal.",
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

              <div className="flex flex-col sm:flex-row gap-3 mb-10">
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8 border-t border-primary-foreground/20">
                <div>
                  <p className="text-xs uppercase tracking-widest text-primary-foreground/70 font-semibold mb-1">Founder</p>
                  <p className="text-primary-foreground font-semibold">Matt Brown</p>
                  <p className="text-primary-foreground/80 text-sm">Freedom Interventions</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-primary-foreground/70 font-semibold mb-1">Phone</p>
                  <a href="tel:+15038362136" className="text-primary-foreground font-semibold inline-flex items-center gap-1.5 hover:underline">
                    <Phone className="h-4 w-4" />
                    503-836-2136
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
