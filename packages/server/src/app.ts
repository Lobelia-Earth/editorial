import { serveStatic } from "@hono/node-server/serve-static";
import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono } from "@hono/zod-openapi";
import type { EditorialConfig } from "@isardsat/editorial-common";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { createConfig } from "./lib/config.js";
import { createHooks } from "./lib/hooks.js";
import { createStorage, type Storage } from "./lib/storage.js";
import { createActionRoutes } from "./routes/actions.js";
import { createAdminRoutes } from "./routes/admin.js";
import { createConfigRoutes } from "./routes/config.js";
import { createDataRoutes } from "./routes/data.js";
import { createFilesRoutes } from "./routes/files.js";

export const BASE_EDITORIAL_PATH = "./editorial";

export interface EditorialServerConfig {
  configDirectory?: string;
  editorialDirectory?: string;
}

export interface EditorialServer {
  app: OpenAPIHono;
  config: EditorialConfig;
  storage: Storage;
}

export async function createEditorialServer({
  configDirectory = BASE_EDITORIAL_PATH,
  editorialDirectory = BASE_EDITORIAL_PATH,
}: EditorialServerConfig): Promise<EditorialServer> {
  const app = new OpenAPIHono();

  const config = await createConfig(configDirectory);
  const storage = createStorage(editorialDirectory);
  const hooks = await createHooks(configDirectory);

  app.use(logger());

  // TODO: Formalize cors configuration
  app.use(
    "/api/v1/*",
    cors({
      origin: "*",
    })
  );
  app.route("/api/v1", createConfigRoutes(config));
  app.route("/api/v1", createDataRoutes(storage));
  app.route("/api/v1", createFilesRoutes());
  app.route("/api/v1", createActionRoutes(storage, hooks));
  app.route("/", createAdminRoutes(config));

  app.doc("/doc", {
    openapi: "3.0.0",
    info: {
      version: "1.0.0",
      title: `Editorial API: ${config.name}`,
    },
  });
  app.get("/doc/ui", swaggerUI({ url: "/doc" }));

  app.use(
    "/public/*",
    serveStatic({
      root: "./",
    })
  );

  return {
    app,
    config,
    storage,
  };
}
