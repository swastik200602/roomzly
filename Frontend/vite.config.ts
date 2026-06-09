import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  build: {
    outDir: "dist/client",
    emptyOutDir: true,
    target: "es2020",
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("leaflet")) return "leaflet";
            if (id.includes("@tanstack")) return "tanstack";
            if (id.includes("framer-motion")) return "framer-motion";
            if (id.includes("lucide-react")) return "lucide-react";
            return "vendor";
          }
        },
      },
    },
  },
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "unsafe-none",
    },
  },
  preview: {
    headers: {
      "Cross-Origin-Opener-Policy": "unsafe-none",
    },
  },
  plugins: [
    tsconfigPaths(),
    tailwindcss(),
    tanstackStart({
      server: { entry: "src/server.ts" },
    }),
    react(),
  ],
});
