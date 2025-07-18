import { serveStatic } from "@hono/node-server/serve-static";
import { OpenAPIHono } from "@hono/zod-openapi";
import { createRequire } from "node:module";
import path from "path";
import { z } from "@hono/zod-openapi";
import type { EditorialConfig } from "@isardsat/editorial-common";

export function createAdminRoutes(config: EditorialConfig) {
  const app = new OpenAPIHono();

  // TODO: This is package manager dependent
  const require = createRequire(import.meta.url);
  const adminPackagePath = require.resolve(
    "@isardsat/editorial-admin/package.json"
  );
  const adminPath = path.join(
    path.dirname(adminPackagePath),
    "build",
    "client"
  );
  const relativeAdminPath = path.relative(process.cwd(), adminPath);

  // Admin config endpoint
  app.openapi(
    {
      method: "get",
      path: "/admin/config",
      summary: "Get Firebase configuration for admin",
      responses: {
        200: {
          content: {
            "application/json": {
              schema: z.object({
                firebase: z.object({
                  apiKey: z.string(),
                  authDomain: z.string(),
                  databaseURL: z.string(),
                  projectId: z.string(),
                  storageBucket: z.string(),
                  messagingSenderId: z.string(),
                  dbUsersPath: z.string(),
                }).optional(),
              }),
            },
          },
          description: "Firebase configuration for admin",
        },
      },
    },
    (c) => {
      return c.json({ firebase: config.firebase });
    }
  );

  app.use(
    "/admin/*",
    serveStatic({
      root: relativeAdminPath,
      rewriteRequestPath(path) {
        return path.split("/admin/")[0];
      },
      onNotFound(path, c) {
        console.log("onNotFound", path, c);
      },
    })
  );

  app.use(
    "/assets/*",
    serveStatic({
      root: relativeAdminPath,
    })
  );

  return app;
}
