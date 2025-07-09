import type { Config } from "@react-router/dev/config";

export default {
  async prerender() {
    return ["/", "/admin"];
  },
  // Server-side render by default, to enable SPA mode set this to `false`
  ssr: false,
} satisfies Config;
