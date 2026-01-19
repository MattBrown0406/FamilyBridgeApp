import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.feec162303784a959c1635217b29129c',
  appName: 'FamilyBridge',
  webDir: 'dist',
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
