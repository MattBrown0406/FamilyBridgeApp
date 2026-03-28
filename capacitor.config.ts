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
  // Live reload is DEV-ONLY. Do not allow a remote server URL in production builds.
  ...(process.env.CAPACITOR_LIVE_RELOAD === 'true'
    ? (() => {
        if (process.env.NODE_ENV === 'production') {
          throw new Error('CAPACITOR_LIVE_RELOAD cannot be enabled in production');
        }

        return {
          server: {
            url: 'https://feec1623-0378-4a95-9c16-35217b29129c.lovableproject.com?forceHideBadge=true',
            // Allow http cleartext only for local/dev workflows.
            cleartext: true,
          },
        };
      })()
    : {}),
};

export default config;
