/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_REVENUECAT_APPLE_API_KEY?: string;
  readonly VITE_REVENUECAT_GOOGLE_API_KEY?: string;
}

/** The published blog articles, newest first (built from src/content/blog by scripts/blog/vite-plugin.mjs). */
declare module 'virtual:familybridge-blog' {
  export interface BlogPostSummary {
    slug: string;
    path: string;
    title: string;
    seoTitle: string;
    description: string;
    topic: string;
    topicName: string;
    date: string;
    minutes: number;
  }
  export const blogPosts: BlogPostSummary[];
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
