import { useCallback } from "react";
import { Capacitor } from "@capacitor/core";

/**
 * External checkout helper for web and Android support flows.
 * Do not use this helper for iOS purchase initiation.
 */
export function usePurchases() {
  const isNative = Capacitor.isNativePlatform();

  // Open an external checkout or account page when that flow is allowed.
  const openWebCheckout = useCallback((checkoutPath: string = "/family-purchase") => {
    const webUrl = `https://familybridgeapp.com${checkoutPath}`;
    
    if (isNative) {
      // Open in the external browser on supported native flows.
      window.open(webUrl, "_system");
    } else {
      // Navigate directly on web
      window.location.href = checkoutPath;
    }
  }, [isNative]);

  return {
    isNative,
    openWebCheckout,
  };
}
