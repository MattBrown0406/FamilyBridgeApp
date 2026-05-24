/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_REVENUECAT_APPLE_API_KEY?: string;
  readonly VITE_REVENUECAT_GOOGLE_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
