import { OpenAPIHono, z } from "@hono/zod-openapi";
import { EditorialVersionResponseSchema } from "@isardsat/editorial-common";
import type { Hooks } from "../lib/hooks.js";
import { getCurrentAndLatestVersion } from "../lib/utils/version.js";

export function createVersionRoutes(hooks: Hooks) {
  const app = new OpenAPIHono();

  app.openapi(
    {
      method: "get",
      path: "/version",
      summary: "Get Editorial version",
      responses: {
        200: {
          content: {
            "application/json": {
              schema: EditorialVersionResponseSchema,
            },
          },
          description: "Editorial version",
        },
        500: {
          content: {
            "application/json": { schema: z.object({ error: z.string() }) },
          },
          description: "Server error",
        },
      },
      tags: ["Version"],
    },
    async (c) => {
      try {
        const { current, latest } = await getCurrentAndLatestVersion();
        return c.json({ current, latest }, 200);
      } catch (error) {
        return c.json(
          { error: "Failed to fetch latest version from npm registry" },
          500,
        );
      }
    },
  );

  app.openapi(
    {
      method: "post",
      path: "/version/upgrade",
      summary: "Trigger Editorial upgrade hook",
      description:
        "Triggers a placeholder hook to start upgrade flow. Replace hook implementation with real deployment/migration logic.",
      responses: {
        202: {
          content: {
            "application/json": {
              schema: z.boolean(),
            },
          },
          description: "Upgrade request accepted",
        },
        500: {
          content: {
            "application/json": { schema: z.object({ error: z.string() }) },
          },
          description: "Server error",
        },
      },
      tags: ["Version"],
    },
    async (c) => {
      try {
        await hooks.onUpgrade();
      } catch (error) {
        console.error("Error executing onUpgrade script:", error);
        return c.json({ error: "Failed upgrade Editorial version" }, 500);
      }

      return c.json(true, 202);
    },
  );

  return app;
}
