import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import familyBridgeLogo from "@/assets/familybridge-logo.png";
import {
  ArrowRight,
  Building2,
  CreditCard,
  Lock,
  MessageCircle,
  ShieldCheck,
  Smartphone,
  Trash2,
  Users,
} from "lucide-react";

const reviewerChecks = [
  { icon: MessageCircle, label: "Secure family communication" },
  { icon: Smartphone, label: "Accountability and check-ins" },
  { icon: ShieldCheck, label: "FIIS recovery intelligence" },
  { icon: CreditCard, label: "App Store subscriptions" },
];

export default function NativeHome() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-left"
            aria-label="FamilyBridge home"
          >
            <img src={familyBridgeLogo} alt="FamilyBridge" className="h-8 w-auto object-contain" />
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

      <main className="container mx-auto px-4 py-5 sm:py-8">
        <div className="mx-auto max-w-5xl space-y-5">
          <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-5">
              <div className="space-y-3">
                <Badge variant="secondary" className="w-fit">iOS App</Badge>
                <h1 className="font-display text-3xl font-bold tracking-normal sm:text-4xl">
                  Family coordination workspace
                </h1>
                <p className="max-w-2xl text-base text-muted-foreground">
                  Open a pre-populated family or provider workspace, continue to your account, or start a subscription through the App Store.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Button className="h-auto justify-between p-4 text-left" onClick={() => navigate(user ? "/dashboard" : "/auth")}>
                  <span>
                    <span className="block font-semibold">{user ? "Open Dashboard" : "Sign In or Create Account"}</span>
                    <span className="block text-xs font-normal opacity-80">Family groups, check-ins, documents, and settings</span>
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button className="h-auto justify-between p-4 text-left" variant="outline" onClick={() => navigate("/family-purchase")}>
                  <span>
                    <span className="block font-semibold">Family Subscription</span>
                    <span className="block text-xs font-normal text-muted-foreground">Purchase or restore with Apple In-App Purchase</span>
                  </span>
                  <CreditCard className="h-4 w-4" />
                </Button>
                <Button className="h-auto justify-between p-4 text-left" variant="outline" onClick={() => navigate("/provider-purchase")}>
                  <span>
                    <span className="block font-semibold">Provider Subscription</span>
                    <span className="block text-xs font-normal text-muted-foreground">Provider plans through Apple In-App Purchase</span>
                  </span>
                  <Building2 className="h-4 w-4" />
                </Button>
                <Button className="h-auto justify-between p-4 text-left" variant="outline" onClick={() => navigate("/dashboard")}>
                  <span>
                    <span className="block font-semibold">Account Deletion</span>
                    <span className="block text-xs font-normal text-muted-foreground">Dashboard, Settings, Delete Account</span>
                  </span>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <Card className="border-primary/25 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    In-App Purchases for App Review
                  </CardTitle>
                  <CardDescription>
                    Use these direct paths to review each Apple sandbox In-App Purchase in the submitted iOS app.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-3">
                  <Button className="h-auto justify-between p-3 text-left" onClick={() => navigate("/family-purchase")}>
                    <span>
                      <span className="block text-sm font-semibold">Family Subscription</span>
                      <span className="block text-xs font-normal opacity-80">$49.99 monthly</span>
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button className="h-auto justify-between p-3 text-left" variant="outline" onClick={() => navigate("/provider-purchase")}>
                    <span>
                      <span className="block text-sm font-semibold">Provider Subscription</span>
                      <span className="block text-xs font-normal text-muted-foreground">Monthly or quarterly</span>
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button className="h-auto justify-between p-3 text-left" variant="outline" onClick={() => navigate("/moderator-purchase")}>
                    <span>
                      <span className="block text-sm font-semibold">Guidance Window</span>
                      <span className="block text-xs font-normal text-muted-foreground">$399 one-time purchase</span>
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Reviewer Demo</CardTitle>
                <CardDescription>
                  Pre-populated app views are available without setup.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-between" onClick={() => navigate("/demo/family")}>
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Family Workspace Demo
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button className="w-full justify-between" variant="outline" onClick={() => navigate("/demo/provider")}>
                  <span className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Provider Workspace Demo
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button className="w-full justify-between" variant="outline" onClick={() => navigate("/demo")}>
                  <span className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Full Feature Demo Index
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {reviewerChecks.map((item) => (
              <Card key={item.label}>
                <CardContent className="flex min-h-24 items-center gap-3 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-medium leading-snug">{item.label}</p>
                </CardContent>
              </Card>
            ))}
          </section>
        </div>
      </main>
    </div>
  );
}
