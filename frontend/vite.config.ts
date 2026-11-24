import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  envPrefix: ["VITE_", "NEXT_PUBLIC_"],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    target: "esnext",
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("react-router-dom") || id.includes("react-dom") || id.includes("react/") || id.includes("scheduler")) {
              return "vendor-react";
            }
            if (id.includes("recharts") || id.includes("d3-") || id.includes("victory-vendor")) {
              return "vendor-charts";
            }
            if (id.includes("lucide-react")) {
              return "vendor-icons";
            }
          }
        },
      },
    },
    chunkSizeWarningLimit: 800,
  },
  server: {
    port: 3000,
    open: false,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
      "/static": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
});
