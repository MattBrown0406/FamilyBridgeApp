import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.familybridgeapp.app',
  appName: 'FamilyBridge',
  webDir: 'dist',
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystorePassword: undefined,
      keystoreAlias: undefined,
      keystoreAliasPassword: undefined,
      releaseType: 'AAB',
    }
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1a1a2e',
      showSpinner: false,
    }
  },
  ...(process.env.CAPACITOR_LIVE_RELOAD === 'true'
    ? {
        server: {
          url: 'https://feec1623-0378-4a95-9c16-35217b29129c.lovableproject.com?forceHideBadge=true',
          cleartext: true,
        },
      }
    : {}),
};

export default config;
