import { serveStatic } from '@hono/node-server/serve-static';
import { swaggerUI } from '@hono/swagger-ui';
import { OpenAPIHono } from '@hono/zod-openapi';
import type { EditorialConfig } from '@isardsat/editorial-common';
import { logger } from 'hono/logger';
import { createConfig } from './lib/config.js';
import { createStorage, type Storage } from './lib/storage.js';
import { createActionRoutes } from './routes/actions.js';
import { createDataRoutes } from './routes/data.js';
import { createFilesRoutes } from './routes/files.js';

export const BASE_EDITORIAL_PATH = './editorial';

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

  app.use(logger());

  app.route('/api/v1', createDataRoutes(storage));
  app.route('/api/v1', createFilesRoutes());
  app.route('/api/v1', createActionRoutes(storage));

  app.use(
    '/public/*',
    serveStatic({
      root: './',
    })
  );

  app.doc('/doc', {
    openapi: '3.0.0',
    info: {
      version: '1.0.0',
      title: `Editorial API: ${config.name}`,
    },
  });
  app.get('/doc/ui', swaggerUI({ url: '/doc' }));

  return {
    app,
    config,
    storage,
  };
}
