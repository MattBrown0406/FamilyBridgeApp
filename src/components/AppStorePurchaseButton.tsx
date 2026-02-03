import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { usePlatform } from "@/hooks/usePlatform";

interface WebCheckoutButtonProps {
  checkoutUrl?: string;
  email: string;
  subscriptionType?: "family" | "provider";
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Reader App Model: Directs users to web checkout instead of in-app purchases.
 * All payments are processed through Square on the web.
 */
export function AppStorePurchaseButton({
  checkoutUrl,
  email,
  subscriptionType = "family",
  disabled,
  className,
  children,
}: WebCheckoutButtonProps) {
  const [isOpening, setIsOpening] = useState(false);
  const { isNative } = usePlatform();

  const handleOpenWebCheckout = async () => {
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setIsOpening(true);
    
    try {
      // Construct web checkout URL with email prefilled
      const baseUrl = "https://familybridgeapp.lovable.app";
      const path = subscriptionType === "provider" ? "/provider-purchase" : "/family-purchase";
      const url = `${baseUrl}${path}?email=${encodeURIComponent(email)}`;
      
      if (isNative) {
        // Open in external browser on native platforms
        // This ensures we're following Apple's reader app guidelines
        window.open(url, "_system");
        toast.info("Opening web browser for secure checkout...");
      } else {
        // On web, just navigate
        window.location.href = checkoutUrl || path;
      }
    } catch (error) {
      console.error("Failed to open checkout:", error);
      toast.error("Failed to open checkout. Please try again.");
    } finally {
      setIsOpening(false);
    }
  };

  const buttonText = children || "Subscribe on Web";

  return (
    <Button
      onClick={handleOpenWebCheckout}
      disabled={disabled || isOpening || !email}
      className={className}
      size="lg"
    >
      <ExternalLink className="h-4 w-4 mr-2" />
      {isOpening ? "Opening..." : buttonText}
    </Button>
  );
}

/**
 * Restore Purchases - For reader apps, this directs users to sign in
 * if they already have an account/subscription.
 */
export function RestorePurchasesButton({ 
  className,
  onRestore 
}: { 
  className?: string;
  onRestore?: () => void;
}) {
  const { isNative } = usePlatform();

  // Only show on native platforms
  if (!isNative) return null;

  const handleRestore = () => {
    // For reader app model, "restore" means signing in with existing account
    toast.info("If you have an existing subscription, please sign in with your account.");
    onRestore?.();
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleRestore}
      className={className}
    >
      Already subscribed? Sign in
    </Button>
  );
}
