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
 * Native setup-email button used for Android-style web handoff flows.
 * iOS should avoid using this until real in-app purchases are wired.
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

  // Currently used for Android/native email handoff flows.
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
 * Existing-account sign-in button for native platforms.
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
