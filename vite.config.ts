import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Publishable Lovable Cloud values. These are safe to ship in the browser
// bundle (RLS protects the data). They are used as a build-time fallback so a
// production build never ends up with an undefined Supabase URL/key — which
// otherwise crashes the published site with "supabaseUrl is required".
const FALLBACK_SUPABASE_URL = "https://lljqptscpeamwfkzsezo.supabase.co";
const FALLBACK_SUPABASE_PUBLISHABLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxsanFwdHNjcGVhbXdma3pzZXpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5NTkxNzUsImV4cCI6MjA4MjUzNTE3NX0.4kl5BeK-UaULlo7ISxxdjGShxiuHtiXDstyVUdZoPhM";
const FALLBACK_SUPABASE_PROJECT_ID = "lljqptscpeamwfkzsezo";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  define: {
    "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(
      process.env.VITE_SUPABASE_URL || FALLBACK_SUPABASE_URL,
    ),
    "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY || FALLBACK_SUPABASE_PUBLISHABLE_KEY,
    ),
    "import.meta.env.VITE_SUPABASE_PROJECT_ID": JSON.stringify(
      process.env.VITE_SUPABASE_PROJECT_ID || FALLBACK_SUPABASE_PROJECT_ID,
    ),
  },
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;

          if (id.includes("recharts")) return "vendor-recharts";
          if (id.includes("@supabase")) return "vendor-supabase";
          if (id.includes("@radix-ui")) return "vendor-radix";
          if (id.includes("react-router") || id.includes("@remix-run")) return "vendor-router";
          if (id.includes("@tanstack/react-query")) return "vendor-react-query";
          if (id.includes("date-fns")) return "vendor-datefns";
          if (id.includes("react-markdown")) return "vendor-markdown";
          if (id.includes("lucide-react")) return "vendor-icons";
          if (id.includes("react") || id.includes("react-dom")) return "vendor-react";
        },
      },
    },
  },
}));
