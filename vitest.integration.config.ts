import path from "node:path";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    globals: true,
    environment: "node",
    include: ["tests/integration/**/*.test.ts"],
    setupFiles: ["./tests/setup/integration.ts"],
    maxWorkers: 1,
    minWorkers: 1,
  },
});
