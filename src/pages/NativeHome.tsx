import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import familyBridgeLogo from "@/assets/familybridge-logo.png";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  HeartHandshake,
  Lock,
  ShieldCheck,
  Users,
} from "lucide-react";

const familyHelpPoints = [
  "Learn how and when to set boundaries — and how to hold them with more confidence.",
  "Create financial accountability so help does not quietly turn into enabling.",
  "Keep private, secure family communication in one place so everyone understands the plan, the boundaries, and the goals.",
  "Recognize when it may be time for a DIY intervention or when a professional interventionist should step in.",
];

const demoLinks = [
  { icon: Users, label: "Family demo", path: "/demo/family" },
  { icon: Building2, label: "Provider demo", path: "/demo/provider" },
];

export default function NativeHome() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [loading, navigate, user]);

  if (loading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="text-center">
          <img src={familyBridgeLogo} alt="FamilyBridge" className="mx-auto h-12 w-auto object-contain" />
          <p className="mt-4 text-sm text-muted-foreground">Opening your dashboard…</p>
        </div>
      </div>
    );
  }

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
              <span className="hidden text-xs text-muted-foreground sm:block">Private support for families affected by addiction</span>
            </span>
          </button>
          <Button variant="outline" size="sm" onClick={() => navigate("/auth")}>
            Sign In
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 sm:py-10">
        <div className="mx-auto max-w-3xl space-y-6">
          <section className="overflow-hidden rounded-3xl border bg-card shadow-sm">
            <div className="space-y-6 p-6 sm:p-8">
              <div className="space-y-5 text-center">
                <Badge variant="secondary" className="mx-auto w-fit gap-1.5 rounded-full px-3 py-1">
                  <HeartHandshake className="h-3.5 w-3.5" />
                  Family recovery support
                </Badge>
                <div className="space-y-3">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                    When addiction affects one person, the whole family needs a plan.
                  </p>
                  <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
                    Clearer decisions. Calmer communication. One family plan.
                  </h1>
                  <p className="mx-auto max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                    FamilyBridge uses patent-pending AI technology, FIIS, to help families recognize patterns — not just react to big moments.
                  </p>
                </div>
              </div>

              <Card className="border-primary/15 bg-primary/5">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    How FamilyBridge helps
                  </CardTitle>
                  <CardDescription>
                    Practical support for families trying to move from chaos to clarity.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3">
                  {familyHelpPoints.map((item) => (
                    <div key={item} className="flex gap-2 rounded-xl bg-background/80 p-3 text-sm leading-6">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{item}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Button size="lg" className="h-auto min-h-16 justify-between gap-3 p-4 text-left" onClick={() => navigate("/family-purchase")}>
                  <span>
                    <span className="block font-semibold">I’m here for my family</span>
                    <span className="mt-1 block text-xs font-normal opacity-80">Start a family workspace</span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0" />
                </Button>
                <Button size="lg" variant="outline" className="h-auto min-h-16 justify-between gap-3 p-4 text-left" onClick={() => navigate("/provider-purchase")}>
                  <span>
                    <span className="block font-semibold">I’m a provider</span>
                    <span className="mt-1 block text-xs font-normal text-muted-foreground">Set up a provider workspace</span>
                  </span>
                  <Building2 className="h-4 w-4 shrink-0" />
                </Button>
              </div>

              <div className="rounded-2xl border bg-muted/30 p-4">
                <p className="mb-3 text-center text-sm font-medium text-foreground">Want to see it first?</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {demoLinks.map((item) => (
                    <Button key={item.label} variant="outline" className="h-12 justify-between bg-background" onClick={() => navigate(item.path)}>
                      <span className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  ))}
                </div>
              </div>

              <Button variant="ghost" className="mx-auto flex justify-between" onClick={() => navigate("/auth")}>
                Already have an account? Sign in
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </section>

          <section className="rounded-2xl border bg-muted/40 p-4 text-sm leading-6 text-muted-foreground">
            <div className="flex gap-2">
              <Lock className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                FamilyBridge does not replace treatment, emergency services, medical care, or professional clinical judgment. It helps families and care teams stay organized, informed, and connected. If someone may be in immediate danger, call emergency services now.
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
