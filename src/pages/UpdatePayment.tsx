import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePlatform } from "@/hooks/usePlatform";
import { toast } from "sonner";
import { CreditCard, Shield, Loader2, CheckCircle, ArrowLeft, Smartphone } from "lucide-react";
import { BrandedHeader } from "@/components/BrandedHeader";
import { BrandedFooter } from "@/components/BrandedFooter";

export default function UpdatePayment() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isNative, isIOS } = usePlatform();
  
  const entityType = searchParams.get("entity") as "family" | "organization" | null;
  const entityId = searchParams.get("id");
  const status = searchParams.get("status");

  const [isLoading, setIsLoading] = useState(false);
  const [entityName, setEntityName] = useState<string>("");

  useEffect(() => {
    const fetchEntityInfo = async () => {
      if (!entityId || !entityType) return;

      try {
        if (entityType === "family") {
          const { data } = await supabase
            .from("families")
            .select("name")
            .eq("id", entityId)
            .single();
          if (data) setEntityName(data.name);
        } else {
          const { data } = await supabase
            .from("organizations")
            .select("name")
            .eq("id", entityId)
            .single();
          if (data) setEntityName(data.name);
        }
      } catch (error) {
        console.error("Error fetching entity:", error);
      }
    };

    fetchEntityInfo();
  }, [entityId, entityType]);

  // Handle successful payment update
  useEffect(() => {
    if (status === "success" && entityId && entityType) {
      toast.success("Payment method updated successfully!");
      // The webhook will handle updating the status
      setTimeout(() => navigate("/dashboard"), 2000);
    }
  }, [status, entityId, entityType, navigate]);

  const handleUpdatePayment = async () => {
    if (!entityId || !entityType || !user) {
      toast.error("Missing required information");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-payment-update-checkout", {
        body: {
          entityType,
          entityId,
          email: user.email,
          redirectUrl: `${window.location.origin}/update-payment?entity=${entityType}&id=${entityId}&status=success`,
        },
      });

      if (error) throw error;

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error("Failed to create checkout session");
      }
    } catch (error) {
      console.error("Error creating checkout:", error);
      toast.error("Failed to start payment update. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "success") {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <BrandedHeader />
        <main className="flex-1 container max-w-lg mx-auto px-3 sm:px-4 py-6 sm:py-12">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-3 sm:space-y-4">
                <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-7 w-7 sm:h-8 sm:w-8 text-green-600" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold">Payment Updated!</h2>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Your payment method has been successfully updated. Your subscription is now active.
                </p>
                <Button onClick={() => navigate("/dashboard")} className="mt-3 sm:mt-4">
                  Go to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
        <BrandedFooter />
      </div>
    );
  }

  // On iOS native, show generic account management instructions
  if (isNative && isIOS) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <BrandedHeader />
        <main className="flex-1 container max-w-lg mx-auto px-3 sm:px-4 py-6 sm:py-12">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4 sm:mb-6 gap-1 sm:gap-2 h-8 px-2 sm:px-3"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </Button>

          <Card>
            <CardHeader className="text-center px-4 sm:px-6">
              <div className="mx-auto w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                <Smartphone className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <CardTitle className="text-lg sm:text-xl">Manage Subscription</CardTitle>
              <CardDescription className="text-sm">
                Manage your subscription from your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  To update your payment method or manage your subscription, 
                  please sign in to your account on the web.
                </AlertDescription>
              </Alert>

              <div className="space-y-3 sm:space-y-4">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  <strong>To manage your subscription:</strong>
                </p>
                <ol className="text-xs sm:text-sm text-muted-foreground space-y-1.5 sm:space-y-2 list-decimal list-inside">
                  <li>Sign in to your account</li>
                  <li>Go to your account settings</li>
                  <li>Select subscription management</li>
                  <li>Update your payment information</li>
                </ol>
              </div>

              <Button
                onClick={() => navigate("/dashboard")}
                className="w-full"
              >
                Return to Dashboard
              </Button>
            </CardContent>
          </Card>
        </main>
        <BrandedFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <BrandedHeader />
      <main className="flex-1 container max-w-lg mx-auto px-3 sm:px-4 py-6 sm:py-12">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4 sm:mb-6 gap-1 sm:gap-2 h-8 px-2 sm:px-3"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Back</span>
        </Button>

        <Card>
          <CardHeader className="text-center px-4 sm:px-6">
            <div className="mx-auto w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3 sm:mb-4">
              <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
            <CardTitle className="text-lg sm:text-xl">Update Payment Method</CardTitle>
            <CardDescription className="text-sm">
              {entityName ? (
                <>Update the payment method for <strong>{entityName}</strong></>
              ) : (
                "Enter a new card to continue your subscription"
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Your payment information is processed securely through Square. 
                We never store your full card details.
              </AlertDescription>
            </Alert>

            <div className="space-y-3 sm:space-y-4">
              <p className="text-xs sm:text-sm text-muted-foreground">
                Click the button below to securely update your payment method. 
                You'll be redirected to our secure payment processor.
              </p>

              <Button
                onClick={handleUpdatePayment}
                disabled={isLoading || !entityId || !entityType}
                className="w-full gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4" />
                    Update Payment Method
                  </>
                )}
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              By updating your payment method, you authorize us to charge your new card 
              for your subscription.
            </p>
          </CardContent>
        </Card>
      </main>
      <BrandedFooter />
    </div>
  );
}
