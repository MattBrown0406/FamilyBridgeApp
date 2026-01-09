import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppleLogo, GooglePlayLogo } from "@/components/icons/StoreLogos";

interface AppStorePurchaseButtonProps {
  platform: "apple" | "google";
  productId: string;
  email: string;
  subscriptionType?: "family" | "provider";
  onSuccess?: (transactionId: string, inviteCode: string) => void;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function AppStorePurchaseButton({
  platform,
  productId,
  email,
  subscriptionType = "family",
  onSuccess,
  disabled,
  className,
  children,
}: AppStorePurchaseButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handlePurchase = async () => {
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setIsLoading(true);
    
    try {
      // In a real implementation, this would use the Capacitor purchases plugin
      // to initiate the native purchase flow
      
      if (platform === "apple") {
        // Apple In-App Purchase flow
        // This would typically use a library like @capgo/capacitor-purchases
        // 
        // Example with RevenueCat/capacitor-purchases:
        // import { Purchases } from '@capgo/capacitor-purchases';
        // 
        // await Purchases.configure({ apiKey: 'YOUR_REVENUECAT_API_KEY' });
        // const { customerInfo } = await Purchases.purchaseProduct({ 
        //   productIdentifier: productId 
        // });
        // const transactionId = customerInfo.originalAppUserId;
        // const receiptData = await Purchases.getAppStoreReceipt();
        
        toast.info(
          "To complete Apple In-App Purchase setup, you'll need to:\n\n" +
          "1. Configure products in App Store Connect\n" +
          "2. Add the capacitor-purchases plugin\n" +
          "3. Set up APPLE_SHARED_SECRET in backend secrets\n\n" +
          "Contact support for assistance.",
          { duration: 8000 }
        );
        
        // For development/demo purposes, show a simulated flow
        // In production, remove this and implement actual IAP
        const mockTransactionId = `apple_${Date.now()}`;
        
        // Verify with backend (this would include actual receipt data in production)
        const { data, error } = await supabase.functions.invoke("verify-app-store-purchase", {
          body: {
            platform: "apple",
            transactionId: mockTransactionId,
            productId,
            email,
            subscriptionType,
            receiptData: null, // Would be actual receipt in production
          },
        });

        if (error) throw error;

        if (data.success && data.inviteCode) {
          toast.success("Purchase verified! Your code has been generated.");
          onSuccess?.(mockTransactionId, data.inviteCode);
        } else {
          throw new Error(data.error || "Purchase verification failed");
        }
        
      } else if (platform === "google") {
        // Google Play Billing flow
        // Similar to Apple, would use capacitor-purchases or similar
        
        toast.info(
          "To complete Google Play Billing setup, you'll need to:\n\n" +
          "1. Configure products in Google Play Console\n" +
          "2. Add the capacitor-purchases plugin\n" +
          "3. Set up Google service account credentials\n\n" +
          "Contact support for assistance.",
          { duration: 8000 }
        );

        // For development/demo purposes
        const mockTransactionId = `google_${Date.now()}`;
        
        const { data, error } = await supabase.functions.invoke("verify-app-store-purchase", {
          body: {
            platform: "google",
            transactionId: mockTransactionId,
            productId,
            email,
            subscriptionType,
            receiptData: null,
          },
        });

        if (error) throw error;

        if (data.success && data.inviteCode) {
          toast.success("Purchase verified! Your code has been generated.");
          onSuccess?.(mockTransactionId, data.inviteCode);
        } else {
          throw new Error(data.error || "Purchase verification failed");
        }
      }
      
    } catch (error) {
      console.error("App store purchase error:", error);
      toast.error("Purchase failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const Icon = platform === "apple" ? AppleLogo : GooglePlayLogo;
  const buttonText = platform === "apple" 
    ? "Subscribe with Apple" 
    : "Subscribe with Google Play";

  return (
    <Button
      onClick={handlePurchase}
      disabled={disabled || isLoading || !email}
      className={className}
      size="lg"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
      ) : (
        <Icon className="h-5 w-5 mr-2" />
      )}
      {children || buttonText}
    </Button>
  );
}
