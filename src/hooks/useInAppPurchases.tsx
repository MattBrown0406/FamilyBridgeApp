import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { useToast } from '@/hooks/use-toast';

// Product IDs - these must match what you configure in App Store Connect and Google Play Console
const PRODUCT_IDS = {
  MONTHLY_SUBSCRIPTION: 'familybridge_monthly',
  YEARLY_SUBSCRIPTION: 'familybridge_yearly',
};

interface Product {
  id: string;
  title: string;
  description: string;
  price: string;
  priceMicros: number;
  currency: string;
}

interface PurchaseState {
  isReady: boolean;
  isLoading: boolean;
  products: Product[];
  activeSubscription: string | null;
  error: string | null;
}

declare global {
  interface Window {
    CdvPurchase?: any;
  }
}

export const useInAppPurchases = () => {
  const { toast } = useToast();
  const [state, setState] = useState<PurchaseState>({
    isReady: false,
    isLoading: true,
    products: [],
    activeSubscription: null,
    error: null,
  });

  const isNativePlatform = Capacitor.isNativePlatform();

  useEffect(() => {
    if (!isNativePlatform) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'In-app purchases are only available in the native app',
      }));
      return;
    }

    initializeStore();
  }, [isNativePlatform]);

  const initializeStore = async () => {
    try {
      // Wait for the plugin to be ready
      const store = window.CdvPurchase?.store;
      if (!store) {
        console.log('Store not available yet, waiting...');
        setTimeout(initializeStore, 500);
        return;
      }

      const { ProductType, Platform } = window.CdvPurchase;

      // Register products
      store.register([
        {
          id: PRODUCT_IDS.MONTHLY_SUBSCRIPTION,
          type: ProductType.PAID_SUBSCRIPTION,
          platform: Platform.APPLE_APPSTORE,
        },
        {
          id: PRODUCT_IDS.MONTHLY_SUBSCRIPTION,
          type: ProductType.PAID_SUBSCRIPTION,
          platform: Platform.GOOGLE_PLAY,
        },
        {
          id: PRODUCT_IDS.YEARLY_SUBSCRIPTION,
          type: ProductType.PAID_SUBSCRIPTION,
          platform: Platform.APPLE_APPSTORE,
        },
        {
          id: PRODUCT_IDS.YEARLY_SUBSCRIPTION,
          type: ProductType.PAID_SUBSCRIPTION,
          platform: Platform.GOOGLE_PLAY,
        },
      ]);

      // Set up event handlers
      store.when()
        .productUpdated((product: any) => {
          console.log('Product updated:', product);
          updateProducts(store);
        })
        .approved((transaction: any) => {
          console.log('Purchase approved:', transaction);
          transaction.verify();
        })
        .verified((receipt: any) => {
          console.log('Purchase verified:', receipt);
          receipt.finish();
          handlePurchaseSuccess(receipt);
        })
        .finished((transaction: any) => {
          console.log('Purchase finished:', transaction);
        })
        .receiptUpdated((receipt: any) => {
          console.log('Receipt updated:', receipt);
          checkActiveSubscription(store);
        });

      // Handle errors
      store.error((error: any) => {
        console.error('Store error:', error);
        setState(prev => ({ ...prev, error: error.message }));
        toast({
          title: 'Purchase Error',
          description: error.message,
          variant: 'destructive',
        });
      });

      // Initialize the store
      await store.initialize([
        Platform.APPLE_APPSTORE,
        Platform.GOOGLE_PLAY,
      ]);

      // Refresh products
      await store.update();

      updateProducts(store);
      checkActiveSubscription(store);

      setState(prev => ({
        ...prev,
        isReady: true,
        isLoading: false,
      }));

    } catch (error) {
      console.error('Failed to initialize store:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to initialize in-app purchases',
      }));
    }
  };

  const updateProducts = (store: any) => {
    const products: Product[] = [];
    
    Object.values(PRODUCT_IDS).forEach(productId => {
      const product = store.get(productId);
      if (product && product.offers && product.offers.length > 0) {
        const offer = product.offers[0];
        products.push({
          id: product.id,
          title: product.title || productId,
          description: product.description || '',
          price: offer.pricingPhases?.[0]?.price || 'N/A',
          priceMicros: offer.pricingPhases?.[0]?.priceMicros || 0,
          currency: offer.pricingPhases?.[0]?.currency || 'USD',
        });
      }
    });

    setState(prev => ({ ...prev, products }));
  };

  const checkActiveSubscription = (store: any) => {
    let activeSubscription: string | null = null;

    Object.values(PRODUCT_IDS).forEach(productId => {
      const product = store.get(productId);
      if (product?.owned) {
        activeSubscription = productId;
      }
    });

    setState(prev => ({ ...prev, activeSubscription }));
  };

  const handlePurchaseSuccess = (receipt: any) => {
    toast({
      title: 'Subscription Active',
      description: 'Thank you for subscribing to FamilyBridge!',
    });
    
    // Here you would typically:
    // 1. Send the receipt to your backend for verification
    // 2. Update the user's subscription status in your database
    // 3. Grant access to premium features
  };

  const purchase = useCallback(async (productId: string) => {
    if (!isNativePlatform) {
      toast({
        title: 'Not Available',
        description: 'In-app purchases are only available in the native app.',
        variant: 'destructive',
      });
      return;
    }

    const store = window.CdvPurchase?.store;
    if (!store) {
      toast({
        title: 'Store Not Ready',
        description: 'Please try again in a moment.',
        variant: 'destructive',
      });
      return;
    }

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const product = store.get(productId);
      if (!product) {
        throw new Error('Product not found');
      }

      const offer = product.getOffer();
      if (!offer) {
        throw new Error('No offer available for this product');
      }

      await offer.order();
    } catch (error: any) {
      console.error('Purchase error:', error);
      toast({
        title: 'Purchase Failed',
        description: error.message || 'Unable to complete purchase',
        variant: 'destructive',
      });
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [isNativePlatform, toast]);

  const restorePurchases = useCallback(async () => {
    if (!isNativePlatform) {
      toast({
        title: 'Not Available',
        description: 'This feature is only available in the native app.',
        variant: 'destructive',
      });
      return;
    }

    const store = window.CdvPurchase?.store;
    if (!store) return;

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      await store.restorePurchases();
      toast({
        title: 'Purchases Restored',
        description: 'Your previous purchases have been restored.',
      });
    } catch (error: any) {
      console.error('Restore error:', error);
      toast({
        title: 'Restore Failed',
        description: error.message || 'Unable to restore purchases',
        variant: 'destructive',
      });
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [isNativePlatform, toast]);

  const manageSubscription = useCallback(() => {
    if (!isNativePlatform) return;

    const store = window.CdvPurchase?.store;
    if (store) {
      store.manageSubscriptions();
    }
  }, [isNativePlatform]);

  return {
    ...state,
    isNativePlatform,
    purchase,
    restorePurchases,
    manageSubscription,
    PRODUCT_IDS,
  };
};

export { PRODUCT_IDS };
