import { useCallback } from "react";
import { Capacitor } from "@capacitor/core";

/**
 * Web-first payment model hook.
 * All payments are processed through secure web checkout.
 * iOS users subscribe via the website (email-driven flow).
 * Android users can be directed to web checkout from the app.
 */
export function usePurchases() {
  const isNative = Capacitor.isNativePlatform();

  // Open web checkout in external browser
  const openWebCheckout = useCallback((checkoutPath: string = "/family-purchase") => {
    const webUrl = `https://familybridgeapp.com${checkoutPath}`;
    
    if (isNative) {
      // Open in external browser on native platforms
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
