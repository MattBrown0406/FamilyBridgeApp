import { useCallback } from "react";
import { Capacitor } from "@capacitor/core";

/**
 * Simplified purchases hook for reader app model.
 * All payments are processed through web checkout (Square).
 * This hook only provides platform detection for UI routing.
 */
export function usePurchases() {
  const isNative = Capacitor.isNativePlatform();

  // Open web checkout in external browser
  const openWebCheckout = useCallback((checkoutPath: string = "/family-purchase") => {
    // Get the web URL for checkout
    const webUrl = `https://familybridgeapp.lovable.app${checkoutPath}`;
    
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
    // Legacy compatibility - these are no longer used but kept for type safety
    isInitialized: true,
    isLoading: false,
    customerInfo: null,
    products: [],
    error: null,
  };
}
