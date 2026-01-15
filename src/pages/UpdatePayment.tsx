import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { CreditCard, Shield, Loader2, CheckCircle, ArrowLeft } from "lucide-react";
import { BrandedHeader } from "@/components/BrandedHeader";
import { BrandedFooter } from "@/components/BrandedFooter";

export default function UpdatePayment() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
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
        <main className="flex-1 container max-w-lg mx-auto px-4 py-12">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold">Payment Updated!</h2>
                <p className="text-muted-foreground">
                  Your payment method has been successfully updated. Your subscription is now active.
                </p>
                <Button onClick={() => navigate("/dashboard")} className="mt-4">
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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <BrandedHeader />
      <main className="flex-1 container max-w-lg mx-auto px-4 py-12">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <CreditCard className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Update Payment Method</CardTitle>
            <CardDescription>
              {entityName ? (
                <>Update the payment method for <strong>{entityName}</strong></>
              ) : (
                "Enter a new card to continue your subscription"
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Your payment information is processed securely through Square. 
                We never store your full card details.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
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
              for your subscription. Your subscription will be immediately reactivated 
              upon successful payment.
            </p>
          </CardContent>
        </Card>
      </main>
      <BrandedFooter />
    </div>
  );
}
