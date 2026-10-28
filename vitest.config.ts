import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Each project uses the vitest.config.ts in its package
    projects: ["packages/common", "packages/server", "packages/admin"],
  },
});
