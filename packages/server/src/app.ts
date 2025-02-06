import { OpenAPIHono, z } from '@hono/zod-openapi';
import { logger } from 'hono/logger';
import { createStorage, type Storage } from './lib/storage.js';
import { createDataRoutes } from './routes/data.js';
import { createConfig } from './lib/config.js';
import type { EditorialConfig } from './lib/schemas.js';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

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

  app.doc('/doc', {
    openapi: '3.0.0',
    info: {
      version: '1.0.0',
      title: `Editorial API: ${config.name}`,
    },
  });

  return {
    app,
    config,
    storage,
  };
}
