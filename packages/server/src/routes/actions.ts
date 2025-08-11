import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import type { Hooks } from "../lib/hooks.js";
import type { Storage } from "../lib/storage.js";

const ActionRequestSchema = z.object({
  author: z.string(),
});

export function createActionRoutes(storage: Storage, hooks: Hooks) {
  const app = new OpenAPIHono();

  app.openapi(
    createRoute({
      method: "post",
      path: "/publish",
      request: {
        body: {
          content: {
            "application/json": {
              schema: ActionRequestSchema,
            },
          },
        },
      },
      responses: {
        202: {
          content: {
            "application/json": {
              schema: z.boolean(),
            },
          },
          description: "Trigger the publishing process",
        },
      },
    }),
    // TODO: Don't async, let the promises run in the background.
    async (c) => {
      const { author } = c.req.valid("json");
      await storage.saveContent({ production: true });
      const content = await storage.getContent({ production: true });
      const schema = await storage.getSchema();

      try {
        const scriptResult = await hooks.onLocalize(content, schema);
        if (scriptResult) {
          await storage.saveLocalisationMessages(scriptResult);
        }
      } catch (error) {
        console.error("Error executing onLocalize script:", error);
        return c.json(false);
      }

      try {
        await hooks.onPublish(content, schema);
      } catch (error) {
        console.error("Error executing onPublish script:", error);
        return c.json(false);
      }

      try {
        await hooks.onPush(author);
      } catch (error) {
        console.error("Error executing onPush script:", error);
        return c.json(false);
      }

      return c.json(true);
    }
  );

  app.openapi(
    createRoute({
      method: "post",
      path: "/pull",
      request: {
        body: {
          content: {
            "application/json": {
              schema: ActionRequestSchema,
            },
          },
        },
      },
      responses: {
        200: {
          description: "Trigger the pull process",
        },
      },
    }),
    async (c) => {
      const { author } = c.req.valid("json");

      await hooks.onPull(author);

      return c.json(true);
    }
  );

  app.openapi(
    createRoute({
      method: "post",
      path: "/push",
      request: {
        body: {
          content: {
            "application/json": {
              schema: ActionRequestSchema,
            },
          },
        },
      },
      responses: {
        200: {
          description: "Trigger the push process",
        },
      },
    }),
    async (c) => {
      const { author } = c.req.valid("json");

      await hooks.onPush(author);

      return c.json(true);
    }
  );

  return app;
}
