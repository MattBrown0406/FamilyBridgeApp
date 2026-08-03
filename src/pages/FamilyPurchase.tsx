import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { usePlatform } from "@/hooks/usePlatform";
import { useRevenueCat } from "@/hooks/useRevenueCat";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Check, CreditCard, Shield, Users, Tag, Loader2, Copy, MessageCircle, UserPlus, DollarSign, Target, Brain, TrendingUp, MessageSquareWarning, RotateCcw } from "lucide-react";
import { BrandedHeader } from "@/components/BrandedHeader";
import { SEOHead, createBreadcrumbSchema } from "@/components/SEOHead";
import { SubscriptionDisclosure } from "@/components/SubscriptionDisclosure";
import { PRODUCTS } from "@/lib/products";
import {
  getOfferingPackageByProductId,
  hasRevenueCatEntitlement,
  isMatchingRevenueCatProductId,
  REVENUECAT_ENTITLEMENT_IDS,
  REVENUECAT_OFFERING_IDS,
  REVENUECAT_PRODUCT_IDS,
  type PurchasesOffering,
} from "@/lib/revenuecat";

const formatPrice = (price: number) =>
  price.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: price % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });

type CheckoutResponse = {
  checkoutUrl?: string;
  orderId?: string;
  error?: string;
};

const FamilyPurchase = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const status = searchParams.get("status");
  const reactivateFamilyId = searchParams.get("reactivate");
  const { isNative, isAndroid } = usePlatform();
  const { isSupported, isReady, getOffering, purchasePackageWithResult, restorePurchases, hasEntitlement } = useRevenueCat();

  // Legacy email links (?inviteCode=XXXX) sent people here to "buy a family"
  // when they actually just want to join an existing one. Bounce them to /join
  // with the code preserved so they never land on a payment screen.
  useEffect(() => {
    const legacyInviteParam = searchParams.get("inviteCode");
    if (legacyInviteParam) {
      navigate(`/join?code=${encodeURIComponent(legacyInviteParam)}`, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [email, setEmail] = useState(user?.email || "");
  const [couponCode, setCouponCode] = useState("");
  const [familyInviteCode, setFamilyInviteCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [isValidatingInvite, setIsValidatingInvite] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [reactivatingFamily, setReactivatingFamily] = useState<{ id: string; name: string } | null>(null);
  const [isReactivating, setIsReactivating] = useState(false);
  const [isNativePurchasing, setIsNativePurchasing] = useState(false);
  const [isNativeRestoring, setIsNativeRestoring] = useState(false);
  const [familyOffering, setFamilyOffering] = useState<PurchasesOffering | null>(null);
  const showNativeRevenueCat = isNative && isSupported;
  const nativeStoreName = isAndroid ? "Google Play" : "App Store";
  const hasFamilyAccess = hasEntitlement(REVENUECAT_ENTITLEMENT_IDS.family);
  const authReturnPath = "/auth?next=/family-purchase";
  const setupAuthReturnPath = "/auth?mode=signup&setup=family&next=/family-setup";

  useEffect(() => {
    if (!showNativeRevenueCat || !isReady) {
      setFamilyOffering(null);
      return;
    }

    void getOffering(REVENUECAT_OFFERING_IDS.family)
      .then(setFamilyOffering)
      .catch((error) => {
        console.error("Failed to load family offering:", error);
        setFamilyOffering(null);
      });
  }, [getOffering, isReady, showNativeRevenueCat]);

  // Fetch family info if reactivating
  useEffect(() => {
    if (reactivateFamilyId) {
      supabase
        .from('families')
        .select('id, name')
        .eq('id', reactivateFamilyId)
        .single()
        .then(({ data }) => {
          if (data) {
            setReactivatingFamily({ id: data.id, name: data.name });
          }
        });
    }
  }, [reactivateFamilyId]);

  const handleReactivateFamily = useCallback(async () => {
    if (!reactivateFamilyId || !user) return;
    
    setIsReactivating(true);
    try {
      // Reactivate as independent (remove organization)
      const { error: familyError } = await supabase
        .from('families')
        .update({
          is_archived: false,
          archived_at: null,
          archived_by: null,
          organization_id: null, // Remove provider association
        })
        .eq('id', reactivateFamilyId);

      if (familyError) throw familyError;

      // Update any pending reactivation requests
      await supabase
        .from('family_reactivation_requests')
        .update({
          status: 'approved',
          approved_by: user.id,
          approved_at: new Date().toISOString(),
          reactivation_type: 'family_admin',
        })
        .eq('family_id', reactivateFamilyId)
        .eq('status', 'pending');

      toast.success("Family reactivated successfully!");
      navigate('/dashboard');
    } catch (error) {
      console.error('Error reactivating family:', error);
      toast.error("Failed to reactivate family. Please contact support.");
    } finally {
      setIsReactivating(false);
    }
  }, [navigate, reactivateFamilyId, user]);

  // Handle successful purchase for reactivation
  useEffect(() => {
    if (status === 'success' && reactivateFamilyId && user) {
      void handleReactivateFamily();
    }
  }, [handleReactivateFamily, reactivateFamilyId, status, user]);

  // After returning from web checkout, finalize purchase and generate the invite code.
  useEffect(() => {
    const finalize = async () => {
      if (status !== 'success') return;
      if (reactivateFamilyId) return; // reactivation has its own flow
      if (generatedCode) return;
      if (isNative) return; // Native store flow already handles this differently.

      const orderId = localStorage.getItem('familybridge_family_checkout_order_id');
      const purchaseEmail = localStorage.getItem('familybridge_family_checkout_email') || email;

      if (!orderId) {
        // If we don't have an order id, we can't verify payment. Show a clear message.
        toast.error('We could not confirm your payment automatically. Please contact support.');
        return;
      }

      setIsFinalizing(true);
      try {
        const { data, error } = await supabase.functions.invoke('finalize-family-purchase', {
          body: { orderId, email: purchaseEmail },
        });

        if (error) throw error;

        if (data?.success && data?.inviteCode) {
          setGeneratedCode(data.inviteCode);
          toast.success('Invite code created!');
        } else {
          toast.error(data?.error || 'Unable to generate invite code yet. Please try again in a minute.');
        }
      } catch (e) {
        console.error('Finalize family purchase error:', e);
        toast.error('Unable to confirm payment and generate code. Please contact support.');
      } finally {
        setIsFinalizing(false);
      }
    };

    finalize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, reactivateFamilyId, generatedCode, isNative]);

  const handleSquarePurchase = async (withTrial = true) => {
    // Native store compliance: never execute web payment flows on native.
    if (isNative) {
      toast.error(`Purchases on this device must be completed with the in-app ${nativeStoreName} flow.`);
      return;
    }

    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setIsLoading(true);
    try {
      // Include reactivate param in redirect if present
      const redirectUrl = reactivateFamilyId 
        ? `${window.location.origin}/family-purchase?status=success&reactivate=${reactivateFamilyId}`
        : `${window.location.origin}/family-purchase?status=success`;

      const { data, error } = await supabase.functions.invoke("create-family-checkout", {
        body: {
          email,
          redirectUrl,
          ...(withTrial && { trialDays: 7, couponCode: "TRIAL7" }),
        },
      });

      const checkoutData = data as CheckoutResponse | null;

      // Surface backend error detail (Square error payload comes back in data even on non-2xx)
      if (error) {
        const backendMsg = checkoutData?.error || error.message;
        throw new Error(backendMsg || "Checkout request failed");
      }
      if (checkoutData?.error) {
        throw new Error(checkoutData.error);
      }

      if (checkoutData?.checkoutUrl) {
        // Save order id so we can verify payment & generate invite code after redirect
        if (checkoutData.orderId) {
          localStorage.setItem('familybridge_family_checkout_order_id', checkoutData.orderId);
        }
        localStorage.setItem('familybridge_family_checkout_email', email);

        window.location.href = checkoutData.checkoutUrl;
      } else {
        throw new Error("Failed to create checkout session");
      }
    } catch (error) {
      console.error("Purchase error:", error);
      const msg = error instanceof Error ? error.message : "Failed to start checkout. Please try again.";
      toast.error(`Checkout failed: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };


  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error("Please enter a coupon code");
      return;
    }

    if (!email) {
      toast.error("Please enter your email address first");
      return;
    }

    // On native platforms, coupons that require external checkout are not supported
    // Only full-discount coupons that generate immediate invite codes work on iOS/Android
    if (isNative) {
      toast.error("Coupon codes are only available on the web.");
      return;
    }

    setIsApplyingCoupon(true);
    try {
      const { data, error } = await supabase.functions.invoke("apply-family-coupon", {
        body: {
          couponCode: couponCode.trim(),
          email,
        },
      });

      if (error) throw error;

      if (data.valid && data.inviteCode) {
        setGeneratedCode(data.inviteCode);
        toast.success("Coupon applied! Your invite code has been generated and emailed to you.");
      } else if (data.valid && data.trialDays) {
        // Trial coupon - redirect to checkout with trial
        toast.success(`${data.trialDays}-day free trial applied! Redirecting to checkout...`);
        const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke("create-family-checkout", {
          body: {
            email,
            redirectUrl: `${window.location.origin}/family-purchase?status=success`,
            trialDays: data.trialDays,
            couponCode: couponCode.trim().toUpperCase(),
          },
        });

        if (checkoutError) throw checkoutError;

        if (checkoutData.checkoutUrl) {
          if (checkoutData.orderId) {
            localStorage.setItem('familybridge_family_checkout_order_id', checkoutData.orderId);
          }
          localStorage.setItem('familybridge_family_checkout_email', email);
          window.location.href = checkoutData.checkoutUrl;
        } else {
          throw new Error("Failed to create checkout session");
        }
      } else if (!data.valid) {
        toast.error(data.error || "Invalid coupon code");
      }
    } catch (error) {
      console.error("Coupon error:", error);
      toast.error("Failed to apply coupon. Please try again.");
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleNativePurchase = async () => {
    if (!showNativeRevenueCat) {
      toast.error(`Native ${nativeStoreName} purchase is not available on this device yet.`);
      return;
    }

    if (!isReady) {
      toast.error(`Still connecting to ${nativeStoreName}. Please try again in a moment.`);
      return;
    }

    const monthlyPackage = getOfferingPackageByProductId(familyOffering, REVENUECAT_PRODUCT_IDS.familyMonthly);
    if (!monthlyPackage) {
      toast.error("The family subscription is not available yet. Please refresh and try again.");
      return;
    }

    setIsNativePurchasing(true);
    try {
      const purchaseResult = await purchasePackageWithResult(monthlyPackage);
      const customerInfo = purchaseResult?.customerInfo ?? null;
      const purchasedFamilySubscription = purchaseResult
        ? isMatchingRevenueCatProductId(purchaseResult.productIdentifier, REVENUECAT_PRODUCT_IDS.familyMonthly)
        : false;

      if (hasRevenueCatEntitlement(customerInfo, REVENUECAT_ENTITLEMENT_IDS.family) || purchasedFamilySubscription) {
        if (user) {
          toast.success("Subscription active. You can now create your family group.");
          navigate("/family-setup");
        } else {
          toast.success("Subscription active. Set up your account to finish FamilyBridge setup.");
          navigate(setupAuthReturnPath);
        }
        return;
      }

      toast.success("Subscription completed. If setup does not unlock immediately, tap Restore Purchases.");
      navigate("/family-setup");
    } catch (error) {
      console.error("Native family purchase error:", error);
      toast.error(`We couldn't complete the ${nativeStoreName} purchase.`);
    } finally {
      setIsNativePurchasing(false);
    }
  };

  const handleNativeRestore = async () => {
    if (!showNativeRevenueCat) {
      navigate(authReturnPath);
      return;
    }

    if (!isReady) {
      toast.error(`Still connecting to ${nativeStoreName}. Please try again in a moment.`);
      return;
    }

    setIsNativeRestoring(true);
    try {
      const customerInfo = await restorePurchases();

      if (hasRevenueCatEntitlement(customerInfo, REVENUECAT_ENTITLEMENT_IDS.family)) {
        if (user) {
          toast.success("Family subscription restored. You can continue to family setup.");
          navigate("/family-setup");
        } else {
          toast.success("Family subscription restored. Set up your account to finish FamilyBridge setup.");
          navigate(setupAuthReturnPath);
        }
        return;
      }

      toast.error("No active family subscription was found to restore.");
    } catch (error) {
      console.error("Native family restore error:", error);
      toast.error("We couldn't restore purchases right now.");
    } finally {
      setIsNativeRestoring(false);
    }
  };

  const handleValidateInviteCode = async () => {
    if (!familyInviteCode.trim()) {
      toast.error("Please enter an invite code");
      return;
    }

    setIsValidatingInvite(true);
    try {
      // Validate via public edge function (RLS prevents anonymous SELECT
      // against family_invite_codes, so client-side lookups always 404).
      const { data, error: fnError } = await supabase.functions.invoke('validate-invite-code', {
        body: { code: familyInviteCode.trim() },
      });

      if (fnError) {
        console.error('Invite validation function error:', fnError);
        toast.error('Could not validate the code right now. Please try again in a moment.');
        return;
      }

      if (!data?.valid) {
        toast.error(data?.error || 'Invalid invite code. Please check and try again.');
        return;
      }

      // Valid invite code - redirect to auth with the invite code
      toast.success("Valid invite code! Create your account to join the family.");
      navigate(`/auth?mode=signup&familyInvite=${encodeURIComponent(familyInviteCode.trim())}`);
    } catch (error) {
      console.error("Invite code validation error:", error);
      toast.error("Failed to validate invite code. Please try again.");
    } finally {
      setIsValidatingInvite(false);
    }
  };

  const features = [
    {
      icon: Brain,
      text: "FIIS pattern guidance",
      subtitle: "FIIS is the patent-pending AI brain that runs the system and learns your family’s needs the more it is used.",
      highlight: true,
    },
    {
      icon: MessageSquareWarning,
      text: "Protected family communication",
      subtitle: "Private family communication with active AI coaching for difficult conversations and texts.",
      highlight: true,
    },
    {
      icon: TrendingUp,
      text: "Pattern visibility",
      subtitle: "Location check-ins, financial requests and communication and relationship dynamics.",
      highlight: true,
    },
    {
      icon: Users,
      text: "Unlimited family participation",
      subtitle: "One monthly fee covers all family users and gives each family unlimited use of the app.",
    },
    { icon: DollarSign, text: "Financial accountability tools", subtitle: "Clearer requests, pledges, and follow-through" },
    {
      icon: Shield,
      text: "1 guidance window each month",
      subtitle: "Get help from a professional human interventionist in your chat for 24 hours. Additional windows are available at an added daily rate.",
    },
  ];

  const handleCopyCode = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode);
      toast.success("Invite code copied to clipboard!");
    }
  };

  // Get payment method display info for the non-native web checkout.
  const getPaymentInfo = () => {
    if (isAndroid) {
      return {
        icon: CreditCard,
        label: "Google Play Billing",
        description: "Native subscription through Google Play",
      };
    }
    return {
      icon: CreditCard,
      label: "Secure Checkout",
      description: "Secure payment powered by Square. Cancel anytime.",
    };
  };

  const paymentInfo = getPaymentInfo();

  // Show generated invite code
  if (generatedCode) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Payment Successful!</CardTitle>
            <CardDescription>
              Your subscription is now active. Here's your activation code.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-amber-50 border-2 border-amber-400 p-4 rounded-lg">
              <p className="text-sm font-semibold text-amber-800 mb-1 text-center">
                ⚠️ IMPORTANT: Please write this code down!
              </p>
              <p className="text-xs text-amber-700 text-center mb-3">
                You'll need this code to set up your family group.
              </p>
              <div className="bg-white p-3 rounded-md border border-amber-300">
                <p className="text-xs text-muted-foreground mb-1 text-center">Your Activation Code</p>
                <div className="flex items-center justify-center gap-2">
                  <p className="text-2xl font-mono font-bold tracking-widest text-primary">{generatedCode}</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleCopyCode}
                    className="h-8 w-8"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-3">
              <p className="text-sm text-center font-medium">
                Next Steps:
              </p>
              <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                <li><strong>Write down or copy</strong> your activation code above</li>
                <li>Click the button below to set up your family</li>
                <li>Enter your activation code when prompted</li>
                <li>Add your family members' information</li>
              </ol>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              A copy of this code has also been sent to your email.
            </p>
            <Button onClick={() => navigate(`/family-setup?inviteCode=${encodeURIComponent(generatedCode)}`)} className="w-full" size="lg">
              Continue to Family Setup
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show reactivation in progress
  if (status === "success" && reactivateFamilyId && isReactivating) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
            <CardTitle className="text-2xl">Reactivating Your Family...</CardTitle>
            <CardDescription>
              Please wait while we restore your family group.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Show reactivation success
  if (status === "success" && reactivateFamilyId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Family Reactivated!</CardTitle>
            <CardDescription>
              Your family group has been reactivated as an independent family.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Your family is now active and all members can access the group again.
            </p>
            <Button onClick={() => navigate("/dashboard")} className="w-full">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
            <CardTitle className="text-2xl">Finalizing your purchase…</CardTitle>
            <CardDescription>
              We’re confirming your payment and generating your invite code.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              This usually takes a few seconds. If it doesn’t finish, please try refreshing.
            </p>
            <Button onClick={() => window.location.reload()} className="w-full" disabled={isFinalizing}>
              Refresh
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const breadcrumbSchema = createBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Family Purchase', url: '/family-purchase' },
  ]);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Family Recovery Support Plan | FamilyBridge"
        description="Explore the FamilyBridge family plan for shared communication, boundaries, decisions, recovery support actions, and coordinated follow-through."
        canonicalPath="/family-purchase"
        structuredData={breadcrumbSchema}
      />
      <BrandedHeader />
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-12">
        <div className="max-w-4xl mx-auto">
          {/* Reactivation Banner */}
          {reactivatingFamily && (
            <Card className="mb-6 border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20">
              <CardContent className="flex items-center gap-4 py-4">
                <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center flex-shrink-0">
                  <RotateCcw className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-amber-800 dark:text-amber-300">
                    Reactivating: {reactivatingFamily.name}
                  </h3>
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    Complete your purchase to reactivate this family as an independent group.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="text-center mb-6 sm:mb-12">
            <h1 className="text-2xl sm:text-4xl font-bold mb-2 sm:mb-4">
              {reactivatingFamily ? 'Reactivate Your Family Group' : 'FIIS Support for Families'}
            </h1>
            <p className="text-base sm:text-xl text-muted-foreground">
              {reactivatingFamily 
                ? (isNative ? 'Restore your family group' : 'Purchase a subscription to restore your family group')
                : 'Structured family guidance, accountability tools, and one included Professional Guidance Window each month'
              }
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
            {/* Features Card */}
            <Card className="min-w-0 md:col-span-1">
              <CardHeader className="px-4 sm:px-6">
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-medium mb-2 w-fit">
                  <Brain className="h-3 w-3" />
                  AI-Powered
                </div>
                <CardTitle>What's Included</CardTitle>
                <CardDescription>
                  Support tools that help families notice patterns earlier
                </CardDescription>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                <ul className="space-y-4">
                  {features.map((feature, index) => (
                    <li key={index} className={`grid grid-cols-1 items-start gap-3 ${feature.highlight ? 'bg-primary/5 px-2 py-2 rounded-lg border border-primary/10' : ''}`}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${feature.highlight ? 'bg-primary/20' : 'bg-primary/10'}`}>
                        <feature.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex min-w-0 flex-col">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className={`block min-w-0 max-w-full basis-full whitespace-normal break-words leading-snug ${feature.highlight ? 'font-medium' : ''}`}>{feature.text}</span>
                          {feature.highlight && (
                            <span className="shrink-0 text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-medium">AI</span>
                          )}
                        </div>
                        {feature.subtitle && (
                          <span className="text-xs text-muted-foreground mt-1 break-words leading-relaxed">{feature.subtitle}</span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* FIIS Support Card */}
            <Card className="md:col-span-1 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-emerald-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                  Most Popular
                </span>
              </div>
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2 text-xl">
                  <paymentInfo.icon className="w-5 h-5" />
                  FIIS Support
                </CardTitle>
                <CardDescription>
                  {showNativeRevenueCat ? "Foundational family guidance inside FamilyBridge" : "Founding family subscription · Cancel anytime"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Free Trial + Subscription Pricing - hide on all native platforms */}
                {!isNative && (
                  <div className="space-y-4">
                    {/* Regular Pricing — first month due today, recurring monthly thereafter */}
                    <div className="text-center py-4 bg-primary/5 rounded-lg border border-primary/10">
                      <p className="text-xs text-muted-foreground mb-1">First month due today</p>
                      <div>
                        <span className="text-4xl font-bold">{formatPrice(PRODUCTS.family.monthly.price)}</span>
                        <span className="text-muted-foreground">/month</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Founding price while active · Cancel anytime
                      </p>
                    </div>
                  </div>
                )}

                {/* Platform-specific notice - Only show on Android (Apple compliance: no payment language) */}
                {isAndroid && (
                  <div className="bg-muted/50 border rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center gap-2 text-sm font-medium">
                      <CreditCard className="w-4 h-4" />
                      <span>{showNativeRevenueCat ? "Google Play Billing" : "Android Setup"}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {showNativeRevenueCat ? "Purchase securely through Google Play" : "Native billing setup required"}
                    </p>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Email input - web only */}
                  {!isNative && (
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Your invite code will be sent to this email
                      </p>
                    </div>
                  )}

                  {/* Coupon Code Section - web only */}
                  {!isNative && (
                    <div className="space-y-2">
                      <Label htmlFor="coupon">Coupon Code (Optional)</Label>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Input
                          id="coupon"
                          placeholder="Enter coupon code"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleApplyCoupon}
                          disabled={isApplyingCoupon || !couponCode.trim() || !email}
                          className="w-full sm:w-auto"
                        >
                          {isApplyingCoupon ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Tag className="h-4 w-4 mr-2" />
                          )}
                          Apply
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Family Invite Code Section */}
                  <div className="space-y-2 pt-2 border-t">
                    <Label htmlFor="familyInvite">Do you have an invite code?</Label>
                    <p className="text-xs text-muted-foreground">
                      If someone invited you to their family group, enter the code here
                    </p>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Input
                        id="familyInvite"
                        placeholder="Enter family invite code"
                        value={familyInviteCode}
                        onChange={(e) => setFamilyInviteCode(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleValidateInviteCode}
                        disabled={isValidatingInvite || !familyInviteCode.trim()}
                        className="w-full sm:w-auto"
                      >
                        {isValidatingInvite ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <UserPlus className="h-4 w-4 mr-2" />
                        )}
                        Join
                      </Button>
                    </div>
                  </div>

                  {showNativeRevenueCat ? (
                    <>
                      <div className="space-y-4">
                        {user && hasFamilyAccess ? (
                          <>
                            <div className="rounded-lg border border-emerald-500/30 bg-emerald-50/60 p-4 text-sm text-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-100">
                              <p className="font-medium mb-2">Your family subscription is active.</p>
                              <p>You can create your family group now, and everyone else can still join with invite codes.</p>
                            </div>
                            <Button onClick={() => navigate("/family-setup")} className="w-full" size="lg">
                              Continue to Family Setup
                            </Button>
                          </>
                        ) : (
                          <>
                            <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
                              <p className="font-medium text-foreground mb-2">One family admin subscription covers the whole family.</p>
                              <p>You can subscribe through {nativeStoreName} now. After purchase, you will continue to a clearly labeled account setup screen.</p>
                            </div>
                            <Button
                              onClick={handleNativePurchase}
                              disabled={isNativePurchasing || !isReady || !familyOffering}
                              className="h-auto min-h-12 w-full whitespace-normal px-3 text-center leading-snug"
                              size="lg"
                            >
                              {isNativePurchasing ? `Opening ${nativeStoreName}...` : `Subscribe to FIIS Support - ${formatPrice(PRODUCTS.family.monthly.price)}/month`}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={handleNativeRestore}
                              disabled={isNativeRestoring || !isReady}
                              className="w-full"
                            >
                              {isNativeRestoring ? "Restoring..." : "Restore Purchases"}
                            </Button>
                            <SubscriptionDisclosure
                              subscriptionTitle={PRODUCTS.family.monthly.displayName}
                              price={formatPrice(PRODUCTS.family.monthly.price)}
                              period="1 month auto-renewable subscription"
                              isNative
                            />
                            <p className="text-xs text-center text-muted-foreground">
                              Already subscribed with this {isAndroid ? "Google Play account" : "Apple ID"}? Restore first, then continue to family setup.
                            </p>
                            <Button
                              variant="ghost"
                              onClick={() => navigate(authReturnPath)}
                              className="w-full"
                            >
                              {user ? "Switch Account" : "Already have an account? Sign In"}
                            </Button>
                          </>
                        )}
                      </div>
                    </>
                  ) : isAndroid ? (
                    <>
                      <div className="space-y-4">
                        <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
                          <p className="font-medium text-foreground mb-2">Google Play Billing is required for Android subscriptions.</p>
                          <p>Add the Android RevenueCat public SDK key as <code>VITE_REVENUECAT_GOOGLE_API_KEY</code>, then rebuild this app to enable native Google Play purchases.</p>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => navigate(authReturnPath)}
                          className="w-full"
                        >
                          Sign In or Create Account
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Web-only purchase flow */}
                      <Button
                        onClick={() => handleSquarePurchase(false)}
                        disabled={isLoading || !email}
                        className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg"
                        size="lg"
                      >
                        {isLoading
                          ? "Processing..."
                          : `Subscribe — ${formatPrice(PRODUCTS.family.monthly.price)} due today, then monthly`}
                      </Button>
                      <p className="text-xs text-center text-muted-foreground">
                        You'll enter your card on Square's secure checkout page. The first month is charged today; the recurring subscription begins next month.
                      </p>
                      
                      {/* Subscription Disclosure */}
                      <SubscriptionDisclosure
                        subscriptionTitle={PRODUCTS.family.monthly.displayName}
                        price={formatPrice(PRODUCTS.family.monthly.price)}
                        period="1 month auto-renewable subscription"
                        isNative={isNative}
                      />
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Already have a code */}
          <div className="mt-8 text-center">
            <p className="text-muted-foreground">
              Already purchased and have an invite code from email?{" "}
              <Button variant="link" onClick={() => navigate("/family-setup")} className="p-0">
                Go to Family Setup
              </Button>
            </p>
          </div>

          {/* Disclaimer */}
          <div className="mt-8 text-center">
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              FamilyBridge provides educational and support-focused content only. It does not offer medical, mental health, or crisis services.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FamilyPurchase;
