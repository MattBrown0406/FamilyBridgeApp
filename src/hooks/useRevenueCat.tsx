import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Purchases, type CustomerInfo, type PurchasesOffering, type PurchasesPackage } from "@revenuecat/purchases-capacitor";
import { useAuth } from "@/hooks/useAuth";
import {
  ensureRevenueCatConfigured,
  getRevenueCatOffering,
  getRevenueCatPackageByProductId,
  hasRevenueCatEntitlement,
  isRevenueCatEnabled,
} from "@/lib/revenuecat";

interface RevenueCatContextValue {
  isSupported: boolean;
  isReady: boolean;
  customerInfo: CustomerInfo | null;
  refreshCustomerInfo: () => Promise<CustomerInfo | null>;
  getOffering: (offeringId: string) => Promise<PurchasesOffering | null>;
  getPackageByProductId: (productId: string) => Promise<PurchasesPackage | null>;
  purchasePackage: (aPackage: PurchasesPackage) => Promise<CustomerInfo | null>;
  purchasePackageWithResult: (aPackage: PurchasesPackage) => Promise<{
    productIdentifier: string;
    customerInfo: CustomerInfo;
    transaction?: {
      transactionIdentifier?: string;
      productIdentifier?: string;
      purchaseDate?: string;
    };
  } | null>;
  restorePurchases: () => Promise<CustomerInfo | null>;
  hasEntitlement: (entitlementId: string) => boolean;
}

const RevenueCatContext = createContext<RevenueCatContextValue | undefined>(undefined);

export function RevenueCatProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isReady, setIsReady] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const isSupported = isRevenueCatEnabled();

  useEffect(() => {
    let mounted = true;
    let listenerId: string | null = null;

    const setup = async () => {
      if (!isSupported || !user?.id) {
        if (mounted) {
          setIsReady(false);
          setCustomerInfo(null);
        }
        return;
      }

      try {
        await ensureRevenueCatConfigured(user.id);

        const { customerInfo: initialCustomerInfo } = await Purchases.getCustomerInfo();

        listenerId = await Purchases.addCustomerInfoUpdateListener((nextCustomerInfo) => {
          if (mounted) {
            setCustomerInfo(nextCustomerInfo);
          }
        });

        if (mounted) {
          setCustomerInfo(initialCustomerInfo);
          setIsReady(true);
        }
      } catch (error) {
        console.error("RevenueCat setup error:", error);
        if (mounted) {
          setIsReady(false);
          setCustomerInfo(null);
        }
      }
    };

    void setup();

    return () => {
      mounted = false;
      if (listenerId) {
        void Purchases.removeCustomerInfoUpdateListener({ listenerToRemove: listenerId });
      }
    };
  }, [isSupported, user?.id]);

  const refreshCustomerInfo = useCallback(async () => {
    if (!isSupported || !user?.id) return null;
    const { customerInfo } = await Purchases.getCustomerInfo();
    setCustomerInfo(customerInfo);
    return customerInfo;
  }, [isSupported, user?.id]);

  const getOffering = useCallback(async (offeringId: string) => {
    if (!isSupported || !user?.id) return null;
    return getRevenueCatOffering(offeringId);
  }, [isSupported, user?.id]);

  const getPackageByProductId = useCallback(async (productId: string) => {
    if (!isSupported || !user?.id) return null;
    return getRevenueCatPackageByProductId(productId);
  }, [isSupported, user?.id]);

  const purchasePackage = useCallback(async (aPackage: PurchasesPackage) => {
    if (!isSupported || !user?.id) return null;
    const result = await Purchases.purchasePackage({ aPackage });
    setCustomerInfo(result.customerInfo);
    return result.customerInfo;
  }, [isSupported, user?.id]);

  const purchasePackageWithResult = useCallback(async (aPackage: PurchasesPackage) => {
    if (!isSupported || !user?.id) return null;
    const result = await Purchases.purchasePackage({ aPackage });
    setCustomerInfo(result.customerInfo);
    return result;
  }, [isSupported, user?.id]);

  const restorePurchases = useCallback(async () => {
    if (!isSupported || !user?.id) return null;
    const { customerInfo } = await Purchases.restorePurchases();
    setCustomerInfo(customerInfo);
    return customerInfo;
  }, [isSupported, user?.id]);

  const hasEntitlement = useCallback((entitlementId: string) => {
    return hasRevenueCatEntitlement(customerInfo, entitlementId);
  }, [customerInfo]);

  const value = useMemo(() => ({
    isSupported,
    isReady,
    customerInfo,
    refreshCustomerInfo,
    getOffering,
    getPackageByProductId,
    purchasePackage,
    purchasePackageWithResult,
    restorePurchases,
    hasEntitlement,
  }), [customerInfo, getOffering, getPackageByProductId, hasEntitlement, isReady, isSupported, purchasePackage, purchasePackageWithResult, refreshCustomerInfo, restorePurchases]);

  return <RevenueCatContext.Provider value={value}>{children}</RevenueCatContext.Provider>;
}

export function useRevenueCat() {
  const context = useContext(RevenueCatContext);

  if (!context) {
    throw new Error("useRevenueCat must be used within a RevenueCatProvider");
  }

  return context;
}
