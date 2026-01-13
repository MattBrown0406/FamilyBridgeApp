import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { usePlatform } from "@/hooks/usePlatform";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Building2, Check, CreditCard, Shield, Users, Tag, Loader2, Copy, Brain, TrendingUp, MessageSquareWarning, Sparkles } from "lucide-react";
import { BrandedHeader } from "@/components/BrandedHeader";
import { AppStorePurchaseButton } from "@/components/AppStorePurchaseButton";
import { AppleLogo, GooglePlayLogo } from "@/components/icons/StoreLogos";

const ProviderPurchase = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const status = searchParams.get("status");
  const { isNative, isIOS, isAndroid, paymentMethod } = usePlatform();

  const [email, setEmail] = useState(user?.email || "");
  const [couponCode, setCouponCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "quarterly" | "annual">(isNative ? "quarterly" : "annual");

  const handleSquarePurchase = async () => {
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-square-checkout", {
        body: {
          email,
          redirectUrl: `${window.location.origin}/provider-purchase?status=success`,
          billingPeriod,
        },
      });

      if (error) throw error;

      if (data.checkoutUrl) {
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

  const handleAppStorePurchaseSuccess = (transactionId: string, activationCode: string) => {
    setGeneratedCode(activationCode);
    toast.success("Purchase complete! Your activation code has been generated.");
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

    setIsApplyingCoupon(true);
    try {
      const { data, error } = await supabase.functions.invoke("apply-coupon", {
        body: {
          couponCode: couponCode.trim(),
          email,
        },
      });

      if (error) throw error;

      if (data.valid && data.activationCode) {
        setGeneratedCode(data.activationCode);
        toast.success("Coupon applied! Your activation code has been generated.");
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

  const features = [
    { icon: Brain, text: "AI Pattern Intelligence Dashboard", subtitle: "Monitor all families with AI-powered behavioral insights", highlight: true },
    { icon: TrendingUp, text: "Cross-Family Analytics", subtitle: "AI surfaces trends and early warning signs across your entire caseload", highlight: true },
    { icon: MessageSquareWarning, text: "AI Chat Moderation", subtitle: "Automatic filtering protects communication in all family groups", highlight: true },
    { icon: Building2, text: "Create and manage your organization" },
    { icon: Users, text: "Onboard unlimited families" },
    { icon: Shield, text: "Custom branding for your organization" },
  ];

  const handleCopyCode = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode);
      toast.success("Activation code copied to clipboard!");
    }
  };

  // Get payment method display info
  const getPaymentInfo = () => {
    if (isIOS) {
      return {
        icon: AppleLogo,
        label: "Apple App Store",
        description: "Payment processed through Apple",
      };
    }
    if (isAndroid) {
      return {
        icon: GooglePlayLogo,
        label: "Google Play Store",
        description: "Payment processed through Google Play",
      };
    }
    return {
      icon: CreditCard,
      label: "Secure Checkout",
      description: "Secure payment powered by Square. Cancel anytime.",
    };
  };

  const paymentInfo = getPaymentInfo();

  // Get the appropriate product ID based on billing period
  const getProductIdForPurchase = () => {
    switch (billingPeriod) {
      case "annual":
        return "app.lovable.feec162303784a959c1635217b29129c.provider_annual";
      case "quarterly":
        return "app.lovable.feec162303784a959c1635217b29129c.provider_quarterly";
      default:
        return "app.lovable.feec162303784a959c1635217b29129c.provider_monthly";
    }
  };

  // Show generated activation code
  if (generatedCode) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Coupon Applied!</CardTitle>
            <CardDescription>
              Your activation code has been generated
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-xs text-muted-foreground mb-2 text-center">Your Activation Code</p>
              <div className="flex items-center justify-center gap-2">
                <p className="text-2xl font-mono font-bold tracking-widest">{generatedCode}</p>
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
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-3">
              <p className="text-sm text-center font-medium">
                Next Steps:
              </p>
              <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                <li>Copy your activation code above</li>
                <li>Click the button below to go to Provider Admin</li>
                <li>Enter your code to create your provider account</li>
              </ol>
            </div>
            <Button onClick={() => navigate("/provider-admin")} className="w-full" size="lg">
              Continue to Provider Setup
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
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Payment Successful!</CardTitle>
            <CardDescription>
              Your activation code has been generated and will be sent to your email shortly.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Check your email for your activation code, then use it to set up your provider account.
            </p>
            <Button onClick={() => navigate("/provider-admin")} className="w-full">
              Go to Provider Setup
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <BrandedHeader />
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6 sm:mb-12">
            <h1 className="text-2xl sm:text-4xl font-bold mb-2 sm:mb-4">Become a Provider</h1>
            <p className="text-base sm:text-xl text-muted-foreground">
              Get your activation code to create your organization and start helping families
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 sm:gap-8">
            {/* Features Card */}
            <Card>
              <CardHeader>
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-medium mb-2 w-fit">
                  <Brain className="h-3 w-3" />
                  AI-Powered Platform
                </div>
                <CardTitle>What's Included</CardTitle>
                <CardDescription>
                  AI-powered tools to help you support more families, more effectively
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
                  Provider Subscription
                </CardTitle>
                <CardDescription>
                  Start your provider journey today
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Platform-specific payment notice */}
                {isNative && (
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

                {/* Billing Toggle */}
                <div className="flex justify-center">
                  <div className="inline-flex items-center bg-muted rounded-lg p-1">
                    <button
                      onClick={() => setBillingPeriod("monthly")}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        billingPeriod === "monthly"
                          ? "bg-background shadow-sm text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Monthly
                    </button>
                    {isNative ? (
                      <button
                        onClick={() => setBillingPeriod("quarterly")}
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          billingPeriod === "quarterly"
                            ? "bg-background shadow-sm text-foreground"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Quarterly
                      </button>
                    ) : (
                      <button
                        onClick={() => setBillingPeriod("annual")}
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          billingPeriod === "annual"
                            ? "bg-background shadow-sm text-foreground"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Annual
                      </button>
                    )}
                  </div>
                </div>

                {/* Pricing Display */}
                <div className="text-center py-4">
                  {billingPeriod === "monthly" ? (
                    <>
                      <span className="text-4xl font-bold">$250</span>
                      <span className="text-muted-foreground">/month</span>
                    </>
                  ) : billingPeriod === "quarterly" ? (
                    <div className="space-y-2">
                      <div>
                        <span className="text-4xl font-bold">$625</span>
                        <span className="text-muted-foreground">/quarter</span>
                      </div>
                      <div className="inline-flex items-center gap-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1 rounded-full text-sm font-medium">
                        <Check className="w-4 h-4" />
                        4 payments = $2,500/year
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Same as annual, paid quarterly
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div>
                        <span className="text-4xl font-bold">$2,500</span>
                        <span className="text-muted-foreground">/year</span>
                      </div>
                      <div className="inline-flex items-center gap-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1 rounded-full text-sm font-medium">
                        <Check className="w-4 h-4" />
                        Save $500/year (2 months free!)
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Equivalent to $208/month
                      </p>
                    </div>
                  )}
                </div>

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
                      Your activation code will be sent to this email
                    </p>
                  </div>

                  {/* Coupon Code Section - only show on web */}
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

                  {/* Platform-specific purchase button */}
                  {isNative ? (
                    <AppStorePurchaseButton
                      platform={paymentMethod as "apple" | "google"}
                      productId={getProductIdForPurchase()}
                      email={email}
                      subscriptionType="provider"
                      onSuccess={handleAppStorePurchaseSuccess}
                      disabled={!email}
                      className="w-full"
                    >
                      Subscribe Now
                    </AppStorePurchaseButton>
                  ) : (
                    <Button
                      onClick={handleSquarePurchase}
                      disabled={isLoading || !email}
                      className="w-full"
                      size="lg"
                    >
                      {isLoading ? "Processing..." : "Subscribe Now"}
                    </Button>
                  )}

                  <p className="text-xs text-muted-foreground text-center">
                    {paymentInfo.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Already have a code */}
          <div className="mt-8 text-center">
            <p className="text-muted-foreground">
              Already have an activation code?{" "}
              <Button variant="link" onClick={() => navigate("/provider-admin")} className="p-0">
                Go to Provider Setup
              </Button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProviderPurchase;
