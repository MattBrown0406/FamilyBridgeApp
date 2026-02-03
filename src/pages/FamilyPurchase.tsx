import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { usePlatform } from "@/hooks/usePlatform";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Check, CreditCard, Shield, Users, Tag, Loader2, Copy, MessageCircle, UserPlus, DollarSign, Target, Sparkles, Brain, TrendingUp, MessageSquareWarning, RotateCcw } from "lucide-react";
import { BrandedHeader } from "@/components/BrandedHeader";
import { SEOHead, createBreadcrumbSchema } from "@/components/SEOHead";
import { AppStorePurchaseButton, RestorePurchasesButton } from "@/components/AppStorePurchaseButton";

import { SubscriptionDisclosure } from "@/components/SubscriptionDisclosure";
import { PRODUCTS } from "@/lib/products";

const FamilyPurchase = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const status = searchParams.get("status");
  const reactivateFamilyId = searchParams.get("reactivate");
  const { isNative, isIOS, isAndroid, paymentMethod } = usePlatform();

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

  // Handle successful purchase for reactivation
  useEffect(() => {
    if (status === 'success' && reactivateFamilyId && user) {
      handleReactivateFamily();
    }
  }, [status, reactivateFamilyId, user]);

  // After returning from Square checkout, finalize purchase and generate the invite code.
  useEffect(() => {
    const finalize = async () => {
      if (status !== 'success') return;
      if (reactivateFamilyId) return; // reactivation has its own flow
      if (generatedCode) return;
      if (isNative) return; // App store flow already provides code

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

  const handleReactivateFamily = async () => {
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
  };

  const handleSquarePurchase = async () => {
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
        },
      });

      if (error) throw error;

      if (data.checkoutUrl) {
        // Save order id so we can verify payment & generate invite code after redirect
        if (data.orderId) {
          localStorage.setItem('familybridge_family_checkout_order_id', data.orderId);
        }
        localStorage.setItem('familybridge_family_checkout_email', email);

        window.location.href = data.checkoutUrl;
      } else {
        throw new Error("Failed to create checkout session");
      }
    } catch (error) {
      console.error("Purchase error:", error);
      toast.error("Failed to start checkout. Please try again.");
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
      toast.error("Coupon codes are only available on the web. Please use In-App Purchase to subscribe.");
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

  const handleValidateInviteCode = async () => {
    if (!familyInviteCode.trim()) {
      toast.error("Please enter an invite code");
      return;
    }

    setIsValidatingInvite(true);
    try {
      // Check if the invite code exists in family_invite_codes table
      const { data: inviteData, error: inviteError } = await supabase
        .from("family_invite_codes")
        .select("family_id")
        .eq("invite_code", familyInviteCode.trim().toLowerCase())
        .maybeSingle();

      if (inviteError) throw inviteError;

      // Also check families table for legacy invite codes
      let familyId = inviteData?.family_id;
      
      if (!familyId) {
        const { data: familyData, error: familyError } = await supabase
          .from("families")
          .select("id")
          .eq("invite_code", familyInviteCode.trim().toLowerCase())
          .maybeSingle();

        if (familyError) throw familyError;
        familyId = familyData?.id;
      }

      if (!familyId) {
        toast.error("Invalid invite code. Please check and try again.");
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
    { icon: Brain, text: "AI Pattern Intelligence", subtitle: "Automatically detects concerning behavioral patterns and early warning signs", highlight: true },
    { icon: MessageSquareWarning, text: "AI-Powered Chat Moderation", subtitle: "Real-time filtering blocks harmful language before it causes damage", highlight: true },
    { icon: TrendingUp, text: "Smart Behavioral Insights", subtitle: "AI tracks activities and surfaces trends to help you intervene early", highlight: true },
    { icon: Users, text: "Invite unlimited family members" },
    { icon: DollarSign, text: "Financial tracking & accountability", subtitle: "AI monitors request patterns for red flags" },
    { icon: Shield, text: "Privacy and content protection" },
  ];

  const handleCopyCode = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode);
      toast.success("Invite code copied to clipboard!");
    }
  };

  // Get payment method display info (for web and Android only - iOS uses email flow)
  const getPaymentInfo = () => {
    if (isAndroid) {
      return {
        icon: CreditCard,
        label: "Web Checkout",
        description: "Secure payment on our website",
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
            <Button onClick={() => navigate("/family-setup")} className="w-full" size="lg">
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
        title={isNative && isIOS ? "Create Your Family Group" : "Create Your Family Group - $19.99/month"}
        description={isNative && isIOS 
          ? "Start your family's recovery journey with FamilyBridge. AI-powered pattern detection, moderated chat, financial accountability, and meeting check-ins."
          : "Start your family's recovery journey with FamilyBridge. AI-powered pattern detection, moderated chat, financial accountability, and meeting check-ins for $19.99/month."}
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
              {reactivatingFamily ? 'Reactivate Your Family Group' : 'Create Your Family Group'}
            </h1>
            <p className="text-base sm:text-xl text-muted-foreground">
              {reactivatingFamily 
                ? 'Purchase a subscription to restore your family group'
                : 'Start your family\'s journey to healing and connection'
              }
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 sm:gap-8">
            {/* Features Card */}
            <Card>
              <CardHeader>
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-medium mb-2 w-fit">
                  <Brain className="h-3 w-3" />
                  AI-Powered
                </div>
                <CardTitle>What's Included</CardTitle>
                <CardDescription>
                  Intelligent tools that help families catch warning signs early
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  {features.map((feature, index) => (
                    <li key={index} className={`flex items-start gap-3 ${feature.highlight ? 'bg-primary/5 -mx-2 px-2 py-2 rounded-lg border border-primary/10' : ''}`}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${feature.highlight ? 'bg-primary/20' : 'bg-primary/10'}`}>
                        <feature.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className={feature.highlight ? 'font-medium' : ''}>{feature.text}</span>
                          {feature.highlight && (
                            <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-medium">AI</span>
                          )}
                        </div>
                        {feature.subtitle && (
                          <span className="text-xs text-muted-foreground mt-0.5">{feature.subtitle}</span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Purchase Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <paymentInfo.icon className="w-5 h-5" />
                  {isNative && isIOS ? "Family Subscription" : PRODUCTS.family.monthly.displayName}
                </CardTitle>
                <CardDescription>
                  {isNative && isIOS ? "Sign in to access your family" : "Auto-renewable subscription · Cancel anytime"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Clear Subscription Pricing - Only show on non-iOS platforms */}
                {!(isNative && isIOS) && (
                  <div className="text-center py-4 bg-primary/5 rounded-lg border border-primary/10">
                    <p className="text-xs text-muted-foreground mb-1">Monthly Subscription</p>
                    <div>
                      <span className="text-4xl font-bold">${PRODUCTS.family.monthly.price}</span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Billed monthly · Auto-renews until cancelled
                    </p>
                  </div>
                )}

                {/* Platform-specific payment notice - Only show on Android */}
                {isNative && !isIOS && (
                  <div className="bg-muted/50 border rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center gap-2 text-sm font-medium">
                      <paymentInfo.icon className="w-4 h-4" />
                      <span>{paymentInfo.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {paymentInfo.description}
                    </p>
                  </div>
                )}

                <div className="space-y-4">
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

                  {/* Coupon Code Section - only show on web to avoid IAP bypass concerns */}
                  {!isNative && (
                    <div className="space-y-2">
                      <Label htmlFor="coupon">Coupon Code (Optional)</Label>
                      <div className="flex gap-2">
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
                    <div className="flex gap-2">
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

                  {isNative && isIOS ? (
                    <>
                      {/* iOS App Store compliant: No purchase buttons or pricing, just sign-in */}
                      <div className="text-center py-4 bg-muted/50 rounded-lg mb-4">
                        <p className="text-sm text-muted-foreground">
                          Already have an account? Sign in to access your family group.
                        </p>
                      </div>
                      <Button
                        onClick={() => navigate("/auth")}
                        className="w-full"
                        size="lg"
                      >
                        Sign In to Your Account
                      </Button>
                    </>
                  ) : isNative ? (
                    <>
                      {/* Android: Can still direct to web checkout */}
                      <AppStorePurchaseButton
                        email={email}
                        subscriptionType="family"
                        disabled={!email}
                        className="w-full"
                      >
                        Subscribe on Web - ${PRODUCTS.family.monthly.price}/mo
                      </AppStorePurchaseButton>
                      <p className="text-xs text-muted-foreground text-center">
                        You'll be redirected to our secure web checkout to complete your purchase.
                      </p>
                      <RestorePurchasesButton 
                        className="w-full" 
                        onRestore={() => navigate("/auth")}
                      />
                    </>
                  ) : (
                    <>
                      <Button
                        onClick={handleSquarePurchase}
                        disabled={isLoading || !email}
                        className="w-full"
                        size="lg"
                      >
                        {isLoading ? "Processing..." : "Subscribe Now"}
                      </Button>
                      {/* Subscription Disclosure */}
                      <SubscriptionDisclosure
                        subscriptionTitle={PRODUCTS.family.monthly.displayName}
                        price={`$${PRODUCTS.family.monthly.price}`}
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
