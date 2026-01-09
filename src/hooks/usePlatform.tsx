import { useState, useEffect } from "react";
import { Capacitor } from "@capacitor/core";

export type Platform = "ios" | "android" | "web";

export interface PlatformInfo {
  platform: Platform;
  isNative: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isWeb: boolean;
  paymentMethod: "apple" | "google" | "square";
}

export function usePlatform(): PlatformInfo {
  const [platformInfo, setPlatformInfo] = useState<PlatformInfo>(() => {
    // Default to web during SSR/initial render
    return {
      platform: "web",
      isNative: false,
      isIOS: false,
      isAndroid: false,
      isWeb: true,
      paymentMethod: "square",
    };
  });

  useEffect(() => {
    const detectPlatform = () => {
      const isNative = Capacitor.isNativePlatform();
      const nativePlatform = Capacitor.getPlatform();
      
      let platform: Platform = "web";
      let paymentMethod: "apple" | "google" | "square" = "square";
      
      if (isNative) {
        if (nativePlatform === "ios") {
          platform = "ios";
          paymentMethod = "apple";
        } else if (nativePlatform === "android") {
          platform = "android";
          paymentMethod = "google";
        }
      }

      setPlatformInfo({
        platform,
        isNative,
        isIOS: platform === "ios",
        isAndroid: platform === "android",
        isWeb: platform === "web",
        paymentMethod,
      });
    };

    detectPlatform();
  }, []);

  return platformInfo;
}
