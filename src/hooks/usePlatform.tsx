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

// Detect platform synchronously - Capacitor APIs are synchronous
function detectPlatform(): PlatformInfo {
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

  return {
    platform,
    isNative,
    isIOS: platform === "ios",
    isAndroid: platform === "android",
    isWeb: platform === "web",
    paymentMethod,
  };
}

// Cache the result since platform doesn't change during runtime
const platformInfo = detectPlatform();

export function usePlatform(): PlatformInfo {
  return platformInfo;
}
