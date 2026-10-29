import { fileURLToPath } from "node:url";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // Same "@" alias as vite.config.ts. The React Router plugin is left out,
  // tests render the components directly.
  plugins: [tsconfigPaths()],
  resolve: {
    // Vitest resolves react-router and react-router-dom to different builds
    // (CommonJS and ES modules), which don't share the router context. Use the
    // ES module builds of both, like Node does.
    alias: ["react-router", "react-router-dom"].map((name) => ({
      find: new RegExp(`^${name}$`),
      replacement: fileURLToPath(import.meta.resolve(name)),
    })),
  },
  test: {
    name: "admin",
    environment: "jsdom",
    include: ["app/**/*.test.{ts,tsx}"],
    setupFiles: ["./test/setup.ts"],
    env: {
      // Never reach a real server, requests not stubbed by a test fail
      VITE_EDITORIAL_BASE_URL: "http://editorial.test/api/v1",
    },
  },
});
