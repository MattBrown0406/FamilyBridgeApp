import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import familyBridgeLogo from "@/assets/familybridge-logo.png";
import {
  ArrowRight,
  BellRing,
  Building2,
  CheckCircle2,
  FileText,
  HeartHandshake,
  Lock,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";

const familyBenefits = [
  "Keep everyone on the same page without group-text chaos",
  "Track check-ins, meetings, tasks, and recovery milestones",
  "Get guided communication support before emotions take over",
];

const providerBenefits = [
  "Coordinate families, interventions, and aftercare in one workspace",
  "Share documents, expectations, and next steps securely",
  "Use outcomes and engagement signals to support continuing care",
];

const painPoints = [
  "Too many people texting different things",
  "No one knows what the plan is",
  "Boundaries keep changing under stress",
  "Treatment and aftercare updates get lost",
  "Families are unsure when to step in or step back",
  "Professionals need one place to coordinate the case",
];

const featureCards = [
  {
    icon: MessageCircle,
    title: "Calmer communication",
    description: "Private family channels, guided prompts, and tone support help families respond instead of react.",
  },
  {
    icon: BellRing,
    title: "Know what comes next",
    description: "Check-ins, tasks, meetings, medication notes, documents, and care-plan updates stay organized.",
  },
  {
    icon: TrendingUp,
    title: "See patterns earlier",
    description: "Recovery trajectory tools help families and providers notice changes before they become bigger problems.",
  },
];

const demoLinks = [
  { icon: Users, label: "Family demo", path: "/demo/family" },
  { icon: Building2, label: "Provider demo", path: "/demo/provider" },
  { icon: Lock, label: "Feature index", path: "/demo" },
];

const actionButtonClass = "h-full min-h-[84px] w-full justify-start gap-3 overflow-hidden p-4 text-left whitespace-normal";
const actionTextClass = "min-w-0 flex-1";
const actionTitleClass = "block text-sm font-semibold leading-snug sm:text-base";
const actionDescriptionClass = "mt-1 block text-xs font-normal leading-snug text-muted-foreground";
const actionIconClass = "h-5 w-5 shrink-0 text-muted-foreground";

export default function NativeHome() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/40">
      <header className="sticky top-0 z-20 border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex items-center gap-3 text-left"
            aria-label="FamilyBridge home"
          >
            <img src={familyBridgeLogo} alt="FamilyBridge" className="h-9 w-auto object-contain" />
            <span className="leading-tight">
              <span className="block font-display text-lg font-semibold">FamilyBridge</span>
              <span className="hidden text-xs text-muted-foreground sm:block">Recovery coordination for families and care teams</span>
            </span>
          </button>
          {user ? (
            <Button variant="ghost" size="sm" onClick={() => signOut()}>
              Sign Out
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => navigate("/auth")}>
              Sign In
            </Button>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 sm:py-10">
        <div className="mx-auto max-w-6xl space-y-8">
          <section className="overflow-hidden rounded-3xl border bg-card shadow-sm">
            <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-7 p-6 sm:p-8 lg:p-10">
                <div className="space-y-5">
                  <Badge variant="secondary" className="w-fit gap-1.5 rounded-full px-3 py-1">
                    <HeartHandshake className="h-3.5 w-3.5" />
                    Family recovery coordination
                  </Badge>
                  <div className="space-y-3">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                      When addiction affects one person, the whole family needs a plan.
                    </p>
                    <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
                      One private place to organize recovery support.
                    </h1>
                    <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                      FamilyBridge helps families, interventionists, and treatment professionals stay aligned after the hard conversation starts. It turns scattered texts, missed updates, and emotional guesswork into a secure workspace for communication, boundaries, documents, check-ins, and next steps.
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Button size="lg" className="h-auto min-h-16 justify-between gap-3 p-4 text-left" onClick={() => navigate("/family-purchase")}>
                    <span>
                      <span className="block font-semibold">I’m here for my family</span>
                      <span className="mt-1 block text-xs font-normal opacity-80">Start a family workspace</span>
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0" />
                  </Button>
                  <Button size="lg" variant="outline" className="h-auto min-h-16 justify-between gap-3 p-4 text-left" onClick={() => navigate("/provider-purchase")}>
                    <span>
                      <span className="block font-semibold">I support families professionally</span>
                      <span className="mt-1 block text-xs font-normal text-muted-foreground">Set up a provider workspace</span>
                    </span>
                    <Building2 className="h-4 w-4 shrink-0" />
                  </Button>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button variant="ghost" className="justify-between sm:min-w-48" onClick={() => navigate(user ? "/dashboard" : "/auth")}>
                    {user ? "Open your dashboard" : "Sign in or create account"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button variant="ghost" className="justify-between sm:min-w-48" onClick={() => navigate("/demo/family")}>
                    Preview the app
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="border-t bg-primary/5 p-6 sm:p-8 lg:border-l lg:border-t-0 lg:p-10">
                <Card className="h-full border-primary/20 bg-background/95 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-primary" />
                      What this helps with
                    </CardTitle>
                    <CardDescription>
                      Built for the messy middle: after concern becomes action, and before recovery feels stable.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-3">
                    {painPoints.map((item) => (
                      <div key={item} className="flex gap-2 rounded-xl bg-muted/40 p-3 text-sm leading-6">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            {featureCards.map((feature) => (
              <Card key={feature.title} className="h-full">
                <CardHeader>
                  <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription className="leading-6">{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </section>

          <section className="grid gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Why families subscribe
                </CardTitle>
                <CardDescription>
                  Families need a calmer way to communicate, agree on boundaries, and know what happens next.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {familyBenefits.map((benefit) => (
                  <div key={benefit} className="flex gap-2 text-sm leading-6">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{benefit}</span>
                  </div>
                ))}
                <Button className={actionButtonClass} onClick={() => navigate("/family-purchase")}>
                  <span className={actionTextClass}>
                    <span className={actionTitleClass}>Start a family workspace</span>
                    <span className="mt-1 block text-xs font-normal leading-snug opacity-80">For one family system coordinating recovery support</span>
                  </span>
                  <ArrowRight className={actionIconClass} />
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  Why organizations subscribe
                </CardTitle>
                <CardDescription>
                  Professional teams need one place to coordinate families, cases, documentation, and continuing care.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {providerBenefits.map((benefit) => (
                  <div key={benefit} className="flex gap-2 text-sm leading-6">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{benefit}</span>
                  </div>
                ))}
                <Button className={actionButtonClass} variant="outline" onClick={() => navigate("/provider-purchase")}>
                  <span className={actionTextClass}>
                    <span className={actionTitleClass}>Set up a provider workspace</span>
                    <span className={actionDescriptionClass}>For interventionists, treatment teams, and recovery organizations</span>
                  </span>
                  <ArrowRight className={actionIconClass} />
                </Button>
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Need help getting organized?
                </CardTitle>
                <CardDescription>
                  Some families need a short professional guidance window before the system can stabilize.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className={actionButtonClass} variant="outline" onClick={() => navigate("/moderator-purchase")}>
                  <span className={actionTextClass}>
                    <span className={actionTitleClass}>Get short-term professional guidance</span>
                    <span className={actionDescriptionClass}>A focused support window to help a family clarify next steps</span>
                  </span>
                  <ArrowRight className={actionIconClass} />
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  What FamilyBridge helps organize
                </CardTitle>
                <CardDescription>
                  Practical tools for families and care teams trying to move from chaos to clarity.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                {[
                  "Family agreements and boundaries",
                  "Meeting notes and next steps",
                  "Treatment and aftercare documents",
                  "Medication and appointment reminders",
                  "Emotional check-ins and risk signals",
                  "Care team and family alignment",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2 rounded-xl border bg-muted/30 p-3 text-sm leading-6">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{item}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>

          <section className="rounded-3xl border bg-card p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-display text-2xl font-semibold">Want to see it first?</h2>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Open sample family and provider workspaces to understand how the app supports real recovery coordination before subscribing.
                </p>
              </div>
              <Button variant="outline" onClick={() => navigate(user ? "/dashboard" : "/auth")}>
                {user ? "Go to dashboard" : "Create account"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {demoLinks.map((item) => (
                <Button key={item.label} variant="outline" className="h-12 justify-between" onClick={() => navigate(item.path)}>
                  <span className="flex items-center gap-2">
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border bg-muted/40 p-4 text-sm leading-6 text-muted-foreground">
            <p>
              FamilyBridge does not replace treatment, emergency services, medical care, or professional clinical judgment. It helps families and care teams stay organized, informed, and connected. If someone may be in immediate danger, call emergency services now.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
