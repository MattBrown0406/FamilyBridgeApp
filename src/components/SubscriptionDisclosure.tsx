import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";

interface SubscriptionDisclosureProps {
  subscriptionTitle: string;
  price: string;
  period: string;
  isNative?: boolean;
  className?: string;
}

/**
 * Apple-compliant subscription disclosure component.
 * Displays all required information per App Store Guideline 3.1.2:
 * - Subscription title matching IAP product name
 * - Clear price and duration
 * - Auto-renewal terms
 * - Payment and cancellation info
 * - Links to Terms of Use and Privacy Policy
 */
export const SubscriptionDisclosure = ({
  subscriptionTitle,
  price,
  period,
  isNative = false,
  className = "",
}: SubscriptionDisclosureProps) => {
  return (
    <div className={`bg-muted/30 border rounded-lg p-4 space-y-3 ${className}`}>
      {/* Subscription Details Header */}
      <div className="text-center border-b pb-3">
        <p className="text-sm font-semibold">{subscriptionTitle}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {price} · {period}
        </p>
      </div>
      
      {/* Auto-Renewal Terms */}
      <div className="text-xs text-muted-foreground space-y-2">
        <p className="font-medium text-foreground">Subscription Terms:</p>
        
        {isNative ? (
          <>
            <p>
              • Payment will be charged to your {isNative ? "Apple ID" : ""} account at confirmation of purchase.
            </p>
            <p>
              • Subscription automatically renews unless cancelled at least 24 hours before the end of the current period.
            </p>
            <p>
              • Your account will be charged for renewal within 24 hours prior to the end of the current period.
            </p>
            <p>
              • Subscriptions may be managed and auto-renewal turned off in your device's Account Settings after purchase.
            </p>
            <p>
              • Any unused portion of a free trial period will be forfeited when you purchase a subscription.
            </p>
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
          By subscribing, you agree to our:
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
