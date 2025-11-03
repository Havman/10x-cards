// @ts-check
import { defineConfig } from "astro/config";

import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import node from "@astrojs/node";

// https://astro.build/config
export default defineConfig({
  output: "server",
  integrations: [react()],
  server: {
    port: 3000,
    host: true, // Enable network access
  },
  vite: {
    plugins: [tailwindcss()],
    server: {
      watch: {
        // Watch additional files
        ignored: ["**/node_modules/**", "**/.git/**"],
      },
      hmr: {
        // Hot Module Replacement configuration
        overlay: true, // Show errors as overlay
      },
    },
  },
  adapter: node({
    mode: "standalone",
  }),
});
