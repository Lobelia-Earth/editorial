import { serveStatic } from "@hono/node-server/serve-static";
import { OpenAPIHono } from "@hono/zod-openapi";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

export function createAdminRoutes() {
  const app = new OpenAPIHono();

  // route that directs all /admin/* to the admin index.html
  // we should point to the node modules folder for the admin package
  const currentDir = dirname(fileURLToPath(import.meta.url));

  const adminIndex = path.join(
    currentDir,
    "..",
    "..",
    "node_modules",
    "@isardsat/editorial-admin",
    "build",
    "client",
    "index.html"
  );

  app.get("/*", serveStatic({ root: adminIndex }));

  return app;
}
