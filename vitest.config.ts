import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    // Test environment
    environment: "jsdom",

    // Global test utilities
    globals: true,

    // Setup files
    setupFiles: ["./src/__tests__/setup.ts"],

    // Coverage configuration
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      exclude: ["node_modules/", "src/__tests__/", "**/*.d.ts", "**/*.config.*", "**/mockData", "dist/", ".astro/"],
      // Target coverage thresholds from test plan
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },

    // Test file patterns
    include: [
      "src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
      "src/__tests__/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
    ],

    // Exclude patterns
    exclude: ["node_modules", "dist", ".astro", "e2e"],
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@/components": path.resolve(__dirname, "./src/components"),
      "@/lib": path.resolve(__dirname, "./src/lib"),
      "@/db": path.resolve(__dirname, "./src/db"),
      "@/types": path.resolve(__dirname, "./src/types.ts"),
    },
  },
});
