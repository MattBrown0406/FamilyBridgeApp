import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Check, CreditCard, Shield, Users, Tag, Loader2, Copy, MessageCircle, UserPlus, DollarSign, Target, Sparkles } from "lucide-react";
import { BrandedHeader } from "@/components/BrandedHeader";
const FamilyPurchase = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const status = searchParams.get("status");

  const [email, setEmail] = useState(user?.email || "");
  const [couponCode, setCouponCode] = useState("");
  const [familyInviteCode, setFamilyInviteCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [isValidatingInvite, setIsValidatingInvite] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  const handlePurchase = async () => {
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-family-checkout", {
        body: {
          email,
          redirectUrl: `${window.location.origin}/family-purchase?status=success`,
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
    { icon: Sparkles, text: "Create your family support group" },
    { icon: Users, text: "Invite unlimited family members" },
    { icon: MessageCircle, text: "Secure, filtered, moderated communication", subtitle: "No profanity or abusive language is permitted in the discussion area" },
    { icon: DollarSign, text: "Financial tracking & accountability", subtitle: "Request funds transparently with family voting and payment confirmation" },
    { icon: Target, text: "Values-driven goals & boundaries", subtitle: "Set family goals and boundaries for unity and accountability" },
    { icon: Shield, text: "Privacy and content protection" },
  ];

  const handleCopyCode = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode);
      toast.success("Invite code copied to clipboard!");
    }
  };

  // Show generated invite code
  if (generatedCode) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Your Invite Code is Ready!</CardTitle>
            <CardDescription>
              Copy your code and proceed to set up your family group
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-xs text-muted-foreground mb-2 text-center">Your Family Invite Code</p>
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
                <li>Copy your invite code above</li>
                <li>Click the button below to set up your family</li>
                <li>Add your family members' information</li>
                <li>Everyone will receive an email invitation</li>
              </ol>
            </div>
            <Button onClick={() => navigate("/family-setup")} className="w-full" size="lg">
              Continue to Family Setup
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
              Your invite code has been generated and sent to your email.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Check your email for your invite code, then use it to set up your family group.
            </p>
            <Button onClick={() => navigate("/family-setup")} className="w-full">
              Go to Family Setup
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
            <h1 className="text-4xl font-bold mb-4">Create Your Family Group</h1>
            <p className="text-xl text-muted-foreground">
              Start your family's journey to healing and connection
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Features Card */}
            <Card>
              <CardHeader>
                <CardTitle>What's Included</CardTitle>
                <CardDescription>
                  Everything your family needs for recovery support
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  {features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <feature.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex flex-col">
                        <span>{feature.text}</span>
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
                  <CreditCard className="w-5 h-5" />
                  Family Subscription
                </CardTitle>
                <CardDescription>
                  Start your family's recovery journey today
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center py-4">
                  <span className="text-4xl font-bold">$19.99</span>
                  <span className="text-muted-foreground">/month</span>
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
                      Your invite code will be sent to this email
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
