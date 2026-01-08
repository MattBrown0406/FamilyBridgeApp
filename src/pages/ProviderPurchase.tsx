import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Building2, Check, CreditCard, Shield, Users, Tag, Loader2, Copy } from "lucide-react";
import { BrandedHeader } from "@/components/BrandedHeader";

const ProviderPurchase = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const status = searchParams.get("status");

  const [email, setEmail] = useState(user?.email || "");
  const [couponCode, setCouponCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("annual");

  const handlePurchase = async () => {
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
    { icon: Building2, text: "Create and manage your organization" },
    { icon: Users, text: "Onboard unlimited families" },
    { icon: Shield, text: "Custom branding for your organization" },
    { icon: Check, text: "Access to all provider tools" },
  ];

  const handleCopyCode = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode);
      toast.success("Activation code copied to clipboard!");
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
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Become a Provider</h1>
            <p className="text-xl text-muted-foreground">
              Get your activation code to create your organization and start helping families
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Features Card */}
            <Card>
              <CardHeader>
                <CardTitle>What's Included</CardTitle>
                <CardDescription>
                  Everything you need to support families in recovery
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  {features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <feature.icon className="w-5 h-5 text-primary" />
                      </div>
                      <span>{feature.text}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Purchase Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Provider Subscription
                </CardTitle>
                <CardDescription>
                  Start your provider journey today
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Billing Toggle */}
                <div className="flex justify-center">
                  <div className="inline-flex items-center bg-muted rounded-lg p-1">
                    <button
                      onClick={() => setBillingPeriod("monthly")}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        billingPeriod === "monthly"
                          ? "bg-background shadow-sm text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => setBillingPeriod("annual")}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        billingPeriod === "annual"
                          ? "bg-background shadow-sm text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Annual
                    </button>
                  </div>
                </div>

                {/* Pricing Display */}
                <div className="text-center py-4">
                  {billingPeriod === "monthly" ? (
                    <>
                      <span className="text-4xl font-bold">$249</span>
                      <span className="text-muted-foreground">/month</span>
                    </>
                  ) : (
                    <div className="space-y-2">
                      <div>
                        <span className="text-4xl font-bold">$2,499</span>
                        <span className="text-muted-foreground">/year</span>
                      </div>
                      <div className="inline-flex items-center gap-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1 rounded-full text-sm font-medium">
                        <Check className="w-4 h-4" />
                        Save $489/year (16% off)
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

                  {/* Coupon Code Section */}
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

                  <Button
                    onClick={handlePurchase}
                    disabled={isLoading || !email}
                    className="w-full"
                    size="lg"
                  >
                    {isLoading ? "Processing..." : "Subscribe Now"}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    Secure payment powered by Square. Cancel anytime.
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
