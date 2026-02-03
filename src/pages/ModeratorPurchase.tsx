import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { usePlatform } from "@/hooks/usePlatform";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Shield, Clock, CheckCircle, Users, AlertCircle, Smartphone, ArrowLeft } from "lucide-react";
import { BrandedHeader } from "@/components/BrandedHeader";
import { BrandedFooter } from "@/components/BrandedFooter";
import { AppStorePurchaseButton } from "@/components/AppStorePurchaseButton";
import { SubscriptionDisclosure } from "@/components/SubscriptionDisclosure";
import { PRODUCTS } from "@/lib/products";

export default function ModeratorPurchase() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isNative, isIOS, paymentMethod } = usePlatform();
  const [loading, setLoading] = useState(false);
  const [families, setFamilies] = useState<{ id: string; name: string }[]>([]);
  const [selectedFamily, setSelectedFamily] = useState<string>("");
  const [email, setEmail] = useState("");
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [activeRequests, setActiveRequests] = useState<any[]>([]);

  const success = searchParams.get("success");
  const familyIdParam = searchParams.get("familyId");

  useEffect(() => {
    if (user) {
      setEmail(user.email || "");
      fetchFamilies();
      fetchRequests();
    }
  }, [user]);

  useEffect(() => {
    if (familyIdParam && families.length > 0) {
      setSelectedFamily(familyIdParam);
    }
  }, [familyIdParam, families]);

  const fetchFamilies = async () => {
    const { data, error } = await supabase
      .from("family_members")
      .select("family_id, families(id, name)")
      .eq("user_id", user?.id);

    if (!error && data) {
      const familyList = data
        .filter((fm: any) => fm.families)
        .map((fm: any) => ({
          id: fm.families.id,
          name: fm.families.name,
        }));
      setFamilies(familyList);
      if (familyList.length === 1 && !selectedFamily) {
        setSelectedFamily(familyList[0].id);
      }
    }
  };

  const fetchRequests = async () => {
    const { data, error } = await supabase
      .from("paid_moderator_requests")
      .select("*")
      .eq("requested_by", user?.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setPendingRequests(data.filter((r) => r.status === "pending_payment"));
      setActiveRequests(data.filter((r) => r.status === "active"));
    }
  };

  const handlePurchase = async () => {
    if (!selectedFamily) {
      toast.error("Please select a family");
      return;
    }

    if (!email) {
      toast.error("Please enter your email");
      return;
    }

    setLoading(true);

    try {
      // Create a pending request record
      const { data: request, error: insertError } = await supabase
        .from("paid_moderator_requests")
        .insert({
          family_id: selectedFamily,
          requested_by: user?.id,
          status: "pending_payment",
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Create Square checkout
      const { data, error } = await supabase.functions.invoke("create-moderator-checkout", {
        body: {
          email,
          redirectUrl: `${window.location.origin}/moderator-purchase?success=true&familyId=${selectedFamily}`,
          familyId: selectedFamily,
          requestId: request.id,
        },
      });

      if (error) throw error;

      if (data?.checkoutUrl) {
        // Update with order ID
        await supabase
          .from("paid_moderator_requests")
          .update({ square_order_id: data.orderId })
          .eq("id", request.id);

        window.location.href = data.checkoutUrl;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (error: any) {
      console.error("Purchase error:", error);
      toast.error(error.message || "Failed to start checkout");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <BrandedHeader />
        <main className="flex-1 container py-8">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Sign In Required</CardTitle>
              <CardDescription>Please sign in to purchase moderator support.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate("/auth")} className="w-full">
                Sign In
              </Button>
            </CardContent>
          </Card>
        </main>
        <BrandedFooter />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex flex-col">
        <BrandedHeader />
        <main className="flex-1 container py-8">
          <Card className="max-w-lg mx-auto text-center">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl">Payment Successful!</CardTitle>
              <CardDescription className="text-base">
                Your 24-hour moderator support has been purchased. A moderator will be assigned to your family shortly.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                You will receive a notification when your moderator is ready to help.
              </p>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => navigate(familyIdParam ? `/family/${familyIdParam}` : "/dashboard")}>
                  Return to Family
                </Button>
                <Button variant="outline" onClick={() => navigate("/moderator-purchase")}>
                  Purchase More Hours
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
        <BrandedFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <BrandedHeader />
      <main className="flex-1 container px-3 sm:px-4 py-4 sm:py-8">
        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-2 sm:space-y-4">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">Extended Moderator Support</h1>
            <p className="text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              Need more time with a professional moderator? Purchase additional 24-hour support sessions for your family.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 sm:gap-8">
            {/* Features Card */}
            <Card>
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  What's Included
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div className="flex gap-2 sm:gap-3">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-sm sm:text-base">24 Hours of Support</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Full day of professional moderation</p>
                  </div>
                </div>
                <div className="flex gap-2 sm:gap-3">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-sm sm:text-base">Trained Professional</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Expert in family recovery dynamics</p>
                  </div>
                </div>
                <div className="flex gap-2 sm:gap-3">
                  <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-sm sm:text-base">Crisis Intervention</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Help navigate difficult conversations</p>
                  </div>
                </div>
                <div className="flex gap-2 sm:gap-3">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-sm sm:text-base">Boundary Support</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Assistance setting healthy boundaries</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Purchase Card */}
            <Card>
              <CardHeader>
              <CardTitle>{isNative && isIOS ? "24-Hour Support" : "Purchase 24-Hour Support"}</CardTitle>
                <CardDescription>{isNative && isIOS ? "Professional crisis moderation" : "$150 per 24-hour session"}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="family">Select Family</Label>
                  <select
                    id="family"
                    value={selectedFamily}
                    onChange={(e) => setSelectedFamily(e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  >
                    <option value="">Choose a family...</option>
                    {families.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email for Receipt</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                  />
                </div>

                {isNative && isIOS ? (
                  <>
                    {/* iOS App Store compliant: No purchase buttons or pricing */}
                    <div className="text-center py-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        This service is available through our website at familybridgeapp.com
                      </p>
                    </div>
                  </>
                ) : isNative ? (
                  <>
                    {/* Android: Can still direct to web checkout */}
                    <AppStorePurchaseButton
                      email={email}
                      subscriptionType="family"
                      disabled={!selectedFamily || !email}
                      className="w-full"
                    >
                      Purchase on Web - ${PRODUCTS.crisisModeration.daily.price}
                    </AppStorePurchaseButton>
                    <p className="text-xs text-muted-foreground text-center">
                      You'll be redirected to our secure web checkout to complete your purchase.
                    </p>
                  </>
                ) : (
                  <>
                    <Button onClick={handlePurchase} disabled={loading || !selectedFamily} className="w-full" size="lg">
                      {loading ? "Processing..." : "Purchase for $150"}
                    </Button>
                    {/* Purchase Disclosure */}
                    <SubscriptionDisclosure
                      subscriptionTitle={PRODUCTS.crisisModeration.daily.displayName}
                      price={`$${PRODUCTS.crisisModeration.daily.price}`}
                      period="One-time purchase for 24 hours"
                      isNative={false}
                      isOneTimePurchase={true}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Pending Requests */}
          {pendingRequests.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-500" />
                  Pending Payments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  You have {pendingRequests.length} request(s) awaiting payment completion.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Active Requests */}
          {activeRequests.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Active Support Sessions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {activeRequests.map((req) => (
                  <div key={req.id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">24-Hour Session</p>
                      <p className="text-sm text-muted-foreground">
                        Expires: {req.expires_at ? new Date(req.expires_at).toLocaleString() : "Pending activation"}
                      </p>
                    </div>
                    <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">Active</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <BrandedFooter />
    </div>
  );
}
