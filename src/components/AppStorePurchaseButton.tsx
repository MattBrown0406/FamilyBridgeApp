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
  const [retryCount, setRetryCount] = useState(0);
  const { purchaseProduct, isLoading, isInitialized, error, getProduct, initialize } = usePurchases();
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

    // If not initialized, try to reinitialize before giving up
    if (!isInitialized) {
      if (retryCount < 2) {
        toast.info("Connecting to purchase system...");
        setRetryCount(prev => prev + 1);
        try {
          const init = await initialize();
          if (!init.success) {
            toast.error(init.error || "Unable to connect to purchase system. Please restart the app and try again.");
            return;
          }
        } catch (e) {
          toast.error("Purchase system unavailable. Please check your internet connection and restart the app.");
          return;
        }
      } else {
        toast.error("Purchase system is not available. Please restart the app or contact support.");
        return;
      }
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
  
  // Show initialization status in button text
  const getButtonText = () => {
    if (isLoading) return "Loading...";
    if (!isInitialized && error) {
      if (/not linked|plugin/i.test(error) || /not implemented/i.test(error)) {
        return "Purchase Setup Required";
      }
      return "Retry Connection";
    }
    if (!isInitialized) return "Connecting...";
    const priceText = displayPrice ? ` (${displayPrice})` : "";
    return platform === "apple" 
      ? `Subscribe with Apple${priceText}` 
      : `Subscribe with Google Play${priceText}`;
  };

  const buttonText = getButtonText();

  // Button is only disabled if we're actively loading/processing, no email, or explicitly disabled
  // Allow clicks when not initialized so user can trigger retry
  const isButtonDisabled = disabled || isLoading || isProcessing || !email;

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
