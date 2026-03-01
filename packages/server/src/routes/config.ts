import { OpenAPIHono } from "@hono/zod-openapi";
import type { EditorialConfig } from "@isardsat/editorial-common";
import { EditorialConfigSchema } from "@isardsat/editorial-common";

export function createConfigRoutes(config: EditorialConfig) {
  const app = new OpenAPIHono();

  app.openapi(
    {
      method: "get",
      path: "/config",
      summary: "Get Editorial configuration",
      responses: {
        200: {
          content: {
            "application/json": {
              schema: EditorialConfigSchema,
            },
          },
          description: "Editorial configuration",
        },
      },
      tags: ["Config"],
    },
    (c) => {
      return c.json(config);
    },
  );

  return app;
}
