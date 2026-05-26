import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { usePlatform } from "@/hooks/usePlatform";
import { useRevenueCat } from "@/hooks/useRevenueCat";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Shield, Clock, CheckCircle, Users, AlertCircle } from "lucide-react";
import { BrandedHeader } from "@/components/BrandedHeader";
import { SEOHead } from "@/components/SEOHead";
import { BrandedFooter } from "@/components/BrandedFooter";
import { SubscriptionDisclosure } from "@/components/SubscriptionDisclosure";
import { PRODUCTS } from "@/lib/products";
import {
  getOfferingPackageByProductId,
  REVENUECAT_OFFERING_IDS,
  REVENUECAT_PRODUCT_IDS,
  type PurchasesOffering,
} from "@/lib/revenuecat";

export default function ModeratorPurchase() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isNative, isAndroid } = usePlatform();
  const { isSupported, isReady, getOffering, purchasePackageWithResult } = useRevenueCat();
  const [loading, setLoading] = useState(false);
  const [nativePurchasing, setNativePurchasing] = useState(false);
  const [crisisOffering, setCrisisOffering] = useState<PurchasesOffering | null>(null);
  const [families, setFamilies] = useState<{ id: string; name: string }[]>([]);
  const [selectedFamily, setSelectedFamily] = useState<string>("");
  const [email, setEmail] = useState("");
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [activeRequests, setActiveRequests] = useState<any[]>([]);

  const success = searchParams.get("success");
  const familyIdParam = searchParams.get("familyId");
  const showNativeRevenueCat = isNative && isSupported;
  const nativeStoreName = isAndroid ? "Google Play" : "App Store";

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

  useEffect(() => {
    if (!showNativeRevenueCat || !user) {
      setCrisisOffering(null);
      return;
    }

    getOffering(REVENUECAT_OFFERING_IDS.crisisModeration)
      .then(setCrisisOffering)
      .catch((error) => {
        console.error("Crisis moderation offering load error:", error);
        setCrisisOffering(null);
      });
  }, [getOffering, showNativeRevenueCat, user]);

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
    if (isNative) {
      toast.error(`Purchases on this device must be completed with the in-app ${nativeStoreName} flow.`);
      return;
    }

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

      // Create web checkout
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

  const handleNativePurchase = async () => {
    if (!showNativeRevenueCat) {
      toast.error(`${nativeStoreName} purchase is not available on this device yet.`);
      return;
    }

    if (!selectedFamily) {
      toast.error("Please select a family");
      return;
    }

    if (!isReady) {
      toast.error(`Still connecting to ${nativeStoreName}. Please try again in a moment.`);
      return;
    }

    if (!crisisOffering) {
      toast.error("The Professional Guidance Window purchase is not available yet. Please refresh and try again.");
      return;
    }

    const selectedPackage = getOfferingPackageByProductId(
      crisisOffering,
      REVENUECAT_PRODUCT_IDS.crisisModerationDaily,
    );

    if (!selectedPackage) {
      toast.error(`That Professional Guidance Window product is not available yet. Please check ${nativeStoreName} setup.`);
      return;
    }

    setNativePurchasing(true);

    try {
      const purchaseResult = await purchasePackageWithResult(selectedPackage);

      if (!purchaseResult || purchaseResult.productIdentifier !== REVENUECAT_PRODUCT_IDS.crisisModerationDaily) {
        toast.error("Purchase completed, but FamilyBridge could not confirm the guidance product.");
        return;
      }

      const { data, error } = await supabase.functions.invoke("activate-native-moderator-purchase", {
        body: {
          familyId: selectedFamily,
          productId: purchaseResult.productIdentifier,
          transactionId: purchaseResult.transaction?.transactionIdentifier ?? null,
          purchaseDate: purchaseResult.transaction?.purchaseDate ?? new Date().toISOString(),
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Unable to activate guidance window");

      toast.success("Professional Guidance Window purchased and activated.");
      await fetchRequests();
      navigate(`/moderator-purchase?success=true&familyId=${selectedFamily}`);
    } catch (error: any) {
      console.error("Native moderator purchase error:", error);
      toast.error(error.message || `We couldn't complete the ${nativeStoreName} purchase.`);
    } finally {
      setNativePurchasing(false);
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
              <CardDescription>Please sign in to purchase a Professional Guidance Window.</CardDescription>
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
              <CardTitle className="text-2xl">Success!</CardTitle>
              <CardDescription className="text-base">
                Your Professional Guidance Window is now active. A FamilyBridge moderator will join your family chat soon.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                You will receive a notification when your guidance window is ready.
              </p>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => navigate(familyIdParam ? `/family/${familyIdParam}` : "/dashboard")}>
                  Return to Family
                </Button>
                <Button variant="outline" onClick={() => navigate("/moderator-purchase")}>
                  Get Another Window
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
      <SEOHead
        title="Professional Guidance Window — FamilyBridge"
        description="Request a 24-hour Professional Guidance Window for human support inside your FamilyBridge family chat."
        canonicalPath="/moderator-purchase"
      />
      <BrandedHeader />
      <main className="flex-1 container px-3 sm:px-4 py-4 sm:py-8">
        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-2 sm:space-y-4">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">Professional Guidance Window</h1>
            <p className="text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              {showNativeRevenueCat 
                ? `Purchase a 24-hour human guidance window through ${nativeStoreName} for your family chat.`
                : "Purchase a 24-hour human guidance window for your family chat when you need added structure and support."}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:gap-8 md:grid-cols-2">
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
                    <p className="font-medium text-sm sm:text-base">24-Hour Guidance Window</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">A single structured support period inside the app</p>
                  </div>
                </div>
                <div className="flex gap-2 sm:gap-3">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-sm sm:text-base">Experienced Moderator</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Human guidance for family communication and boundaries</p>
                  </div>
                </div>
                <div className="flex gap-2 sm:gap-3">
                  <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-sm sm:text-base">In-App Only</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Support stays inside your FamilyBridge family chat</p>
                  </div>
                </div>
                <div className="flex gap-2 sm:gap-3">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-sm sm:text-base">Not Emergency Care</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">No off-platform texting, personal phone access, or psychiatric services</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Purchase Card */}
            <Card>
              <CardHeader>
              <CardTitle>{isNative ? "Professional Guidance Window" : "Purchase a Professional Guidance Window"}</CardTitle>
                <CardDescription>{isNative ? "Human guidance inside the family chat" : "$399 one-time purchase • 24-hour period"}</CardDescription>
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

                {!showNativeRevenueCat && (
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
                )}

                {showNativeRevenueCat ? (
                  <>
                    <div className="text-center py-4 bg-muted/50 rounded-lg space-y-1">
                      <p className="text-3xl font-bold">${PRODUCTS.crisisModeration.daily.price}</p>
                      <p className="text-sm text-muted-foreground">One-time {nativeStoreName} purchase for a 24-hour in-app guidance window.</p>
                    </div>
                    <Button
                      onClick={handleNativePurchase}
                      disabled={nativePurchasing}
                      className="h-auto min-h-12 w-full whitespace-normal px-3 text-center leading-snug"
                      size="lg"
                    >
                      {nativePurchasing ? `Opening ${nativeStoreName}...` : "Buy Guidance Window"}
                    </Button>
                    <SubscriptionDisclosure
                      subscriptionTitle={PRODUCTS.crisisModeration.daily.displayName}
                      price={`$${PRODUCTS.crisisModeration.daily.price}`}
                      period="One-time purchase for 24 hours"
                      isNative
                      isOneTimePurchase
                    />
                    <p className="text-xs text-center text-muted-foreground">
                      This purchase activates a service request inside FamilyBridge. It does not provide emergency services.
                    </p>
                  </>
                ) : isAndroid ? (
                  <>
                    <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
                      <p className="font-medium text-foreground mb-2">Google Play Billing is required for Android purchases.</p>
                      <p>Add the Android RevenueCat public SDK key as <code>VITE_REVENUECAT_GOOGLE_API_KEY</code>, then rebuild this app to enable the guidance window purchase.</p>
                    </div>
                  </>
                ) : (
                  <>
                    <Button onClick={handlePurchase} disabled={loading || !selectedFamily} className="w-full" size="lg">
                      {loading ? "Processing..." : "Purchase Guidance Window"}
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
                  Active Guidance Windows
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {activeRequests.map((req) => (
                    <div key={req.id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <div>
                      <p className="font-medium">24-Hour Guidance Window</p>
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
