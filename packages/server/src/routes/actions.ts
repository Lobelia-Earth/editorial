import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import type { Storage } from '../lib/storage.js';

export function createActionRoutes(storage: Storage) {
  const app = new OpenAPIHono();

  app.openapi(
    createRoute({
      method: 'post',
      path: '/publish',
      responses: {
        202: {
          content: {
            'application/json': {
              schema: z.boolean(),
            },
          },
          description: 'Trigger the publishing process',
        },
      },
    }),
    (c) => {
      storage.saveProdContent();

      // TODO: Allow running of automated builds
      // runScript('build');

      return c.json(true, 202);
    }
  );

  return app;
}
