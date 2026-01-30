import { useState, useEffect, useCallback } from "react";
import { Capacitor } from "@capacitor/core";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ALL_PRODUCT_IDS, BUNDLE_ID } from "@/lib/products";

// RevenueCat types (will be available when plugin is installed)
interface CustomerInfo {
  activeSubscriptions: string[];
  entitlements: {
    active: Record<string, {
      identifier: string;
      productIdentifier: string;
      isActive: boolean;
      willRenew: boolean;
      expirationDate: string | null;
    }>;
  };
  originalAppUserId: string;
  latestExpirationDate: string | null;
}

interface PurchaseResult {
  customerInfo: CustomerInfo;
  productIdentifier: string;
  transaction?: {
    transactionIdentifier: string;
    purchaseDate: string;
  };
}

interface StoreProduct {
  identifier: string;
  title: string;
  description: string;
  price: number;
  priceString: string;
  currencyCode: string;
}

interface PurchasesState {
  isInitialized: boolean;
  isLoading: boolean;
  customerInfo: CustomerInfo | null;
  products: StoreProduct[];
  error: string | null;
}

// Dynamic import for RevenueCat - only available on native platforms
let Purchases: any = null;

export function usePurchases() {
  const [state, setState] = useState<PurchasesState>({
    isInitialized: false,
    isLoading: true,
    customerInfo: null,
    products: [],
    error: null,
  });

  const isNative = Capacitor.isNativePlatform();

  // Initialize RevenueCat SDK
  const initialize = useCallback(async () => {
    if (!isNative) {
      setState(prev => ({ ...prev, isLoading: false, isInitialized: true }));
      return;
    }

    try {
      // Dynamically import RevenueCat only on native platforms
      const RevenueCatModule = await import("@revenuecat/purchases-capacitor");
      Purchases = RevenueCatModule.Purchases;

      // Get the API key from environment or use a placeholder
      // In production, you'd want to get this from a secure source
      const apiKey = Capacitor.getPlatform() === "ios"
        ? import.meta.env.VITE_REVENUECAT_IOS_KEY || ""
        : import.meta.env.VITE_REVENUECAT_ANDROID_KEY || "";

      if (!apiKey) {
        console.warn("RevenueCat API key not configured");
        setState(prev => ({
          ...prev,
          isLoading: false,
          isInitialized: false,
          error: "Purchase system not configured",
        }));
        return;
      }

      // Configure RevenueCat
      await Purchases.configure({
        apiKey,
        appUserID: null, // Let RevenueCat generate anonymous ID, we'll identify later
      });

      // Get initial customer info
      const { customerInfo } = await Purchases.getCustomerInfo();

      // Fetch available products
      const { products } = await Purchases.getProducts({
        productIdentifiers: ALL_PRODUCT_IDS,
      });

      setState({
        isInitialized: true,
        isLoading: false,
        customerInfo,
        products,
        error: null,
      });

      console.log("RevenueCat initialized successfully");
    } catch (error) {
      console.error("Failed to initialize RevenueCat:", error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        isInitialized: false,
        error: error instanceof Error ? error.message : "Failed to initialize purchases",
      }));
    }
  }, [isNative]);

  // Initialize on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Identify user with RevenueCat (call after auth)
  const identifyUser = useCallback(async (userId: string) => {
    if (!isNative || !Purchases) return;

    try {
      const { customerInfo } = await Purchases.logIn({ appUserID: userId });
      setState(prev => ({ ...prev, customerInfo }));
    } catch (error) {
      console.error("Failed to identify user:", error);
    }
  }, [isNative]);

  // Purchase a product
  const purchaseProduct = useCallback(async (
    productId: string,
    email: string,
    subscriptionType: "family" | "provider",
    couponCode?: string
  ): Promise<{ success: boolean; inviteCode?: string; error?: string }> => {
    if (!isNative) {
      return { success: false, error: "Purchases only available on mobile devices" };
    }

    if (!Purchases) {
      return { success: false, error: "Purchase system not initialized" };
    }

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      // First get the store product, then make purchase with correct API
      const { products } = await Purchases.getProducts({
        productIdentifiers: [productId],
      });
      
      if (!products || products.length === 0) {
        throw new Error("Product not found in store");
      }
      
      // Make the purchase through RevenueCat using the correct v12+ API
      const result: PurchaseResult = await Purchases.purchase({
        aPackage: null,
        product: products[0],
      });
      console.log("Purchase successful:", result);

      // Get the transaction identifier
      const transactionId = result.transaction?.transactionIdentifier || 
        `${Capacitor.getPlatform()}_${Date.now()}`;

      // Verify the purchase with our backend
      const { data, error } = await supabase.functions.invoke("verify-app-store-purchase", {
        body: {
          platform: Capacitor.getPlatform() === "ios" ? "apple" : "google",
          transactionId,
          productId,
          email,
          subscriptionType,
          couponCode: couponCode?.trim().toUpperCase() || null,
          // Send the customer info for server-side verification
          customerInfo: {
            originalAppUserId: result.customerInfo.originalAppUserId,
            activeSubscriptions: result.customerInfo.activeSubscriptions,
            latestExpirationDate: result.customerInfo.latestExpirationDate,
          },
        },
      });

      if (error) {
        throw new Error(error.message || "Verification failed");
      }

      if (data.success && data.inviteCode) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          customerInfo: result.customerInfo,
        }));
        return { success: true, inviteCode: data.inviteCode };
      }

      throw new Error(data.error || "Purchase verification failed");
    } catch (error: any) {
      console.error("Purchase error:", error);
      
      // Handle specific RevenueCat errors
      const errorMessage = error.code === "PURCHASE_CANCELLED_ERROR"
        ? "Purchase was cancelled"
        : error.message || "Purchase failed";

      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      return { success: false, error: errorMessage };
    }
  }, [isNative]);

  // Restore purchases
  const restorePurchases = useCallback(async (): Promise<CustomerInfo | null> => {
    if (!isNative || !Purchases) {
      toast.error("Restore only available on mobile devices");
      return null;
    }

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const { customerInfo } = await Purchases.restorePurchases();
      setState(prev => ({ ...prev, isLoading: false, customerInfo }));
      
      if (customerInfo.activeSubscriptions.length > 0) {
        toast.success("Purchases restored successfully!");
      } else {
        toast.info("No previous purchases found");
      }
      
      return customerInfo;
    } catch (error) {
      console.error("Restore error:", error);
      setState(prev => ({ ...prev, isLoading: false }));
      toast.error("Failed to restore purchases");
      return null;
    }
  }, [isNative]);

  // Check if user has active subscription
  const hasActiveSubscription = useCallback((entitlementId?: string): boolean => {
    if (!state.customerInfo) return false;
    
    if (entitlementId) {
      return !!state.customerInfo.entitlements.active[entitlementId]?.isActive;
    }
    
    return state.customerInfo.activeSubscriptions.length > 0;
  }, [state.customerInfo]);

  // Get product by ID
  const getProduct = useCallback((productId: string): StoreProduct | undefined => {
    return state.products.find(p => p.identifier === productId);
  }, [state.products]);

  return {
    ...state,
    isNative,
    initialize,
    identifyUser,
    purchaseProduct,
    restorePurchases,
    hasActiveSubscription,
    getProduct,
  };
}
