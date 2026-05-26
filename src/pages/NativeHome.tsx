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
  CreditCard,
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

const featureCards = [
  {
    icon: MessageCircle,
    title: "Calmer communication",
    description: "Private family channels, guided prompts, and tone support help families respond instead of react.",
  },
  {
    icon: BellRing,
    title: "Accountability that stays visible",
    description: "Check-ins, tasks, meetings, medication notes, documents, and care-plan updates stay organized.",
  },
  {
    icon: TrendingUp,
    title: "Recovery insight over time",
    description: "FIIS intelligence and trajectory tools help families and providers notice patterns earlier.",
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
            className="flex items-center gap-2 text-left"
            aria-label="FamilyBridge home"
          >
            <img src={familyBridgeLogo} alt="FamilyBridge" className="h-9 w-auto object-contain" />
            <span className="font-display text-lg font-semibold">FamilyBridge</span>
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
        <div className="mx-auto max-w-6xl space-y-6">
          <section className="overflow-hidden rounded-3xl border bg-card shadow-sm">
            <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-6 p-6 sm:p-8 lg:p-10">
                <div className="space-y-4">
                  <Badge variant="secondary" className="w-fit gap-1.5 rounded-full px-3 py-1">
                    <HeartHandshake className="h-3.5 w-3.5" />
                    Family recovery coordination
                  </Badge>
                  <div className="space-y-3">
                    <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
                      A private command center for families navigating addiction recovery.
                    </h1>
                    <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                      FamilyBridge helps families, interventionists, and treatment professionals stay aligned after the hard conversation starts. It turns scattered texts, missed updates, and emotional guesswork into one secure workspace for communication, accountability, documents, and continuing care.
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Button size="lg" className="h-12 justify-between" onClick={() => navigate(user ? "/dashboard" : "/auth")}>
                    {user ? "Open your dashboard" : "Sign in or create account"}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button size="lg" variant="outline" className="h-12 justify-between" onClick={() => navigate("/family-purchase")}>
                    View family plan
                    <CreditCard className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid gap-3 pt-1 sm:grid-cols-3">
                  <div className="rounded-2xl bg-muted/60 p-4">
                    <p className="text-2xl font-bold">Private</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">Secure family and provider workspaces</p>
                  </div>
                  <div className="rounded-2xl bg-muted/60 p-4">
                    <p className="text-2xl font-bold">Guided</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">Communication prompts and recovery tools</p>
                  </div>
                  <div className="rounded-2xl bg-muted/60 p-4">
                    <p className="text-2xl font-bold">Ongoing</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">Support beyond detox, treatment, or intervention day</p>
                  </div>
                </div>
              </div>

              <div className="border-t bg-primary/5 p-6 sm:p-8 lg:border-l lg:border-t-0 lg:p-10">
                <Card className="h-full border-primary/20 bg-background/95 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-primary" />
                      Why subscribe?
                    </CardTitle>
                    <CardDescription>
                      Addiction affects the entire system. Families and professional teams need structure after the crisis moment passes.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <p className="text-sm font-semibold">For families</p>
                      {familyBenefits.map((benefit) => (
                        <div key={benefit} className="flex gap-2 text-sm leading-6">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          <span>{benefit}</span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t pt-4 space-y-3">
                      <p className="text-sm font-semibold">For professional organizations</p>
                      {providerBenefits.map((benefit) => (
                        <div key={benefit} className="flex gap-2 text-sm leading-6">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          <span>{benefit}</span>
                        </div>
                      ))}
                    </div>
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

          <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Choose the workspace that fits
                </CardTitle>
                <CardDescription>
                  Start with a family plan, a provider plan, or a short guidance window when a family needs professional help getting organized.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                <Button className={actionButtonClass} onClick={() => navigate("/family-purchase")}>
                  <span className={actionTextClass}>
                    <span className={actionTitleClass}>Family subscription</span>
                    <span className="mt-1 block text-xs font-normal leading-snug opacity-80">For one family system coordinating recovery support</span>
                  </span>
                  <ArrowRight className={actionIconClass} />
                </Button>
                <Button className={actionButtonClass} variant="outline" onClick={() => navigate("/provider-purchase")}>
                  <span className={actionTextClass}>
                    <span className={actionTitleClass}>Provider subscription</span>
                    <span className={actionDescriptionClass}>For interventionists, treatment teams, and recovery organizations</span>
                  </span>
                  <Building2 className={actionIconClass} />
                </Button>
                <Button className={actionButtonClass} variant="outline" onClick={() => navigate("/moderator-purchase")}>
                  <span className={actionTextClass}>
                    <span className={actionTitleClass}>Guidance window</span>
                    <span className={actionDescriptionClass}>Short-term professional support to help a family get stabilized</span>
                  </span>
                  <Sparkles className={actionIconClass} />
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
                  Built for the messy middle: after concern becomes action, and before recovery feels stable.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                {[
                  "Family agreements and boundaries",
                  "Meeting notes and next steps",
                  "Treatment and aftercare documents",
                  "Medication and appointment reminders",
                  "Emotional check-ins and risk signals",
                  "Provider-family coordination",
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
        </div>
      </main>
    </div>
  );
}
