import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

/** Same path prefixes nginx routes to the API in production. */
const API_PREFIXES =
  "^/(auth|units|stock|donors|camps|wallet|requisitions|sync|admin|barcodes|health|citizen|organizers|stream)(/|$)";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  // Local UI → deployed API (or local backend). Empty VITE_API_URL uses this proxy (avoids CORS).
  const apiTarget = (env.VITE_API_PROXY_TARGET || env.VITE_API_URL || "http://localhost:8000").replace(
    /\/$/,
    ""
  );

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      port: 3000,
      proxy: {
        [API_PREFIXES]: {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
        },
        // Legacy /api prefix kept for older docs/scripts
        "/api": {
          target: apiTarget,
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api/, ""),
        },
      },
    },
  };
});
