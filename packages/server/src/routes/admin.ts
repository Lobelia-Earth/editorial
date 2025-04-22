import { serveStatic } from "@hono/node-server/serve-static";
import { OpenAPIHono } from "@hono/zod-openapi";
import path from "path";

export function createAdminRoutes() {
  const app = new OpenAPIHono();

  // TODO: This is package manager dependent
  const adminPath = path.join(
    import.meta.dirname,
    "..",
    "..",
    "node_modules",
    "@isardsat",
    "editorial-admin",
    "build",
    "client"
  );
  const relativeAdminPath = path.relative(process.cwd(), adminPath);

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
