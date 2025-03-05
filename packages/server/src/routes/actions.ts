import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import type { Hooks } from '../lib/hooks.js';
import type { Storage } from '../lib/storage.js';

export function createActionRoutes(storage: Storage, hooks: Hooks) {
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
    // TODO: Don't async, let the promises run in the background.
    async (c) => {
      await storage.saveProdContent();

      const content = await storage.getContent();
      const schema = await storage.getSchema();

      try {
        const scriptResult = await hooks.onLocalize(content, schema);
        await storage.saveLocalisationMessages(scriptResult);
      } catch (error) {
        console.error('Error executing script:', error);
        return c.json(false);
      }

      return c.json(true);
    }
  );

  return app;
}
