import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { usePlatform } from "@/hooks/usePlatform";

interface EmailSetupButtonProps {
  email: string;
  accountType?: "family" | "provider";
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Apple App Store compliant email collection button for native platforms.
 * Collects email and sends setup instructions via email.
 * No references to purchasing, pricing, or external checkout.
 */
export function AppStorePurchaseButton({
  email,
  accountType = "family",
  disabled,
  className,
  children,
}: EmailSetupButtonProps) {
  const [isSending, setIsSending] = useState(false);
  const { isNative } = usePlatform();

  const handleSendSetupInfo = async () => {
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setIsSending(true);
    
    try {
      const { error } = await supabase.functions.invoke("send-welcome-email", {
        body: { email, accountType },
      });
      
      if (error) throw error;
      
      toast.success("Check your email for setup instructions!");
    } catch (error) {
      console.error("Failed to send setup info:", error);
      toast.error("Failed to send setup information. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  // On native platforms, only show email collection
  if (isNative) {
    const buttonText = children || "Send Setup Information";

    return (
      <Button
        onClick={handleSendSetupInfo}
        disabled={disabled || isSending || !email}
        className={className}
        size="lg"
      >
        <Mail className="h-4 w-4 mr-2" />
        {isSending ? "Sending..." : buttonText}
      </Button>
    );
  }

  // On web, this component should not be used - web has its own flows
  return null;
}

/**
 * Sign In Button - Apple App Store compliant
 * Directs users to sign in if they already have an account.
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

  const handleSignIn = () => {
    toast.info("If you have an existing account, please sign in.");
    onRestore?.();
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleSignIn}
      className={className}
    >
      Already have an account? Sign In
    </Button>
  );
}
