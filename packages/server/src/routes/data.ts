import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import type { Storage } from '../lib/storage.js';

const EditorialDataSchema = z.record(z.string(), z.object({}));

export function createDataRoutes(storage: Storage) {
  const app = new OpenAPIHono();

  const route = createRoute({
    method: 'get',
    path: '/data',
    responses: {
      200: {
        content: {
          'application/json': {
            schema: EditorialDataSchema,
          },
        },
        description: 'Get all editorial data',
      },
    },
  });

  app.openapi(route, (c) => {
    return c.json(storage.getContent());
  });

  return app;
}
