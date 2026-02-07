import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import { usePlatform } from "@/hooks/usePlatform";

interface SubscriptionDisclosureProps {
  subscriptionTitle: string;
  price: string;
  period: string;
  isNative?: boolean;
  isOneTimePurchase?: boolean;
  className?: string;
}

/**
 * Subscription disclosure component for web checkout.
 * Displays required information for payment transparency:
 * - Subscription title and pricing
 * - Auto-renewal terms
 * - Payment and cancellation info
 * - Links to Terms of Use and Privacy Policy
 * 
 * Note: iOS users subscribe via web (email flow), so this component
 * is primarily shown on web and Android.
 */
export const SubscriptionDisclosure = ({
  subscriptionTitle,
  price,
  period,
  isNative = false,
  isOneTimePurchase = false,
  className = "",
}: SubscriptionDisclosureProps) => {
  const { isIOS, isAndroid } = usePlatform();
  
  // Get platform-specific account name
  const getAccountName = () => {
    return "payment method";
  };

  // Get platform-specific settings location
  const getSettingsLocation = () => {
    return "your account settings";
  };

  return (
    <div className={`bg-muted/30 border rounded-lg p-4 space-y-3 ${className}`}>
      {/* Subscription Details Header */}
      <div className="text-center border-b pb-3">
        <p className="text-sm font-semibold">{subscriptionTitle}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {price} · {period}
        </p>
      </div>
      
      {/* Terms */}
      <div className="text-xs text-muted-foreground space-y-2">
        <p className="font-medium text-foreground">
          {isOneTimePurchase ? "Purchase Terms:" : "Subscription Terms:"}
        </p>
        
        {isOneTimePurchase ? (
          <>
            <p>
              • Payment will be charged to your {getAccountName()} at confirmation of purchase.
            </p>
            <p>
              • This is a one-time purchase and does not automatically renew.
            </p>
            <p>
              • Service will be provided for the duration specified above.
            </p>
          </>
        ) : isNative ? (
          <>
            <p>
              • Payment will be charged to your {getAccountName()} at confirmation of purchase.
            </p>
            <p>
              • Subscription automatically renews unless cancelled at least 24 hours before the end of the current period.
            </p>
            <p>
              • Your account will be charged for renewal within 24 hours prior to the end of the current period.
            </p>
            <p>
              • Subscriptions may be managed and auto-renewal turned off in {getSettingsLocation()} after purchase.
            </p>
            {isIOS && (
              <p>
                • Any unused portion of a free trial period will be forfeited when you purchase a subscription.
              </p>
            )}
          </>
        ) : (
          <>
            <p>
              • Payment will be charged to your payment method at confirmation of purchase.
            </p>
            <p>
              • Subscription automatically renews at the end of each billing period.
            </p>
            <p>
              • You may cancel anytime from your account settings.
            </p>
          </>
        )}
      </div>
      
      {/* Legal Links - Prominent as required */}
      <div className="pt-2 border-t">
        <p className="text-xs text-muted-foreground mb-2">
          By {isOneTimePurchase ? "purchasing" : "subscribing"}, you agree to our:
        </p>
        <div className="flex flex-wrap justify-center gap-4 text-xs">
          <Link 
            to="/terms" 
            className="text-primary hover:underline inline-flex items-center gap-1 font-medium"
          >
            Terms of Use
            <ExternalLink className="h-3 w-3" />
          </Link>
          <Link 
            to="/privacy" 
            className="text-primary hover:underline inline-flex items-center gap-1 font-medium"
          >
            Privacy Policy
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
};
