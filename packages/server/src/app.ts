import { OpenAPIHono, z } from '@hono/zod-openapi';
import { logger } from 'hono/logger';
import { createStorage } from './lib/storage.js';
import { createDataRoutes } from './routes/data.js';

export interface EditorialServerConfig {
  editorialDirectory?: string;
}

export function createEditorialServer({
  editorialDirectory = './editorial',
}: EditorialServerConfig): OpenAPIHono {
  const app = new OpenAPIHono();
  const storage = createStorage(editorialDirectory);

  app.use(logger());

  app.route('/api/v1', createDataRoutes(storage));

  app.doc('/doc', {
    openapi: '3.0.0',
    info: {
      version: '1.0.0',
      title: 'My API',
    },
  });

  return app;
}
