import { OpenAPIHono } from '@hono/zod-openapi';
import { logger } from 'hono/logger';
import data from './routes/data.js';

export function createEditorialServer() {
  const app = new OpenAPIHono();

  app.use(logger());

  app.route('/api/v1', data);

  app.doc('/doc', {
    openapi: '3.0.0',
    info: {
      version: '1.0.0',
      title: 'My API',
    },
  });

  return app;
}
