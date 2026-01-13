import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { usePurchases } from "@/hooks/usePurchases";
import { AppleLogo, GooglePlayLogo } from "@/components/icons/StoreLogos";
import { usePlatform } from "@/hooks/usePlatform";

interface AppStorePurchaseButtonProps {
  platform: "apple" | "google";
  productId: string;
  email: string;
  subscriptionType?: "family" | "provider";
  couponCode?: string;
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
  couponCode,
  onSuccess,
  disabled,
  className,
  children,
}: AppStorePurchaseButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { purchaseProduct, isLoading, isInitialized, error, getProduct } = usePurchases();
  const { isIOS, isAndroid, isNative } = usePlatform();

  const handlePurchase = async () => {
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    if (!isNative) {
      toast.error("In-app purchases are only available on mobile devices");
      return;
    }

    if (!isInitialized) {
      toast.error("Purchase system is not ready. Please try again.");
      return;
    }

    setIsProcessing(true);
    
    try {
      const result = await purchaseProduct(productId, email, subscriptionType, couponCode);

      if (result.success && result.inviteCode) {
        toast.success("Purchase successful! Your activation code has been generated.");
        onSuccess?.(productId, result.inviteCode);
      } else if (result.error) {
        if (result.error !== "Purchase was cancelled") {
          toast.error(result.error);
        }
      }
    } catch (error) {
      console.error("Purchase error:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Get localized price from store if available
  const storeProduct = getProduct(productId);
  const displayPrice = storeProduct?.priceString;

  const Icon = platform === "apple" ? AppleLogo : GooglePlayLogo;
  const buttonText = platform === "apple" 
    ? `Subscribe with Apple${displayPrice ? ` (${displayPrice})` : ""}` 
    : `Subscribe with Google Play${displayPrice ? ` (${displayPrice})` : ""}`;

  // Show appropriate state
  const isButtonDisabled = disabled || isLoading || isProcessing || !email || !isInitialized;

  return (
    <Button
      onClick={handlePurchase}
      disabled={isButtonDisabled}
      className={className}
      size="lg"
    >
      {isLoading || isProcessing ? (
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
      ) : (
        <Icon className="h-5 w-5 mr-2" />
      )}
      {children || buttonText}
    </Button>
  );
}

// Restore Purchases Button Component
export function RestorePurchasesButton({ 
  className,
  onRestore 
}: { 
  className?: string;
  onRestore?: () => void;
}) {
  const { restorePurchases, isLoading, isNative } = usePurchases();
  const [isRestoring, setIsRestoring] = useState(false);

  if (!isNative) return null;

  const handleRestore = async () => {
    setIsRestoring(true);
    try {
      const customerInfo = await restorePurchases();
      if (customerInfo?.activeSubscriptions.length) {
        onRestore?.();
      }
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleRestore}
      disabled={isLoading || isRestoring}
      className={className}
    >
      {isRestoring ? (
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
      ) : (
        <RotateCcw className="h-4 w-4 mr-2" />
      )}
      Restore Purchases
    </Button>
  );
}
