import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import type { Storage } from '../lib/storage.js';
import { EditorialDataSchema } from '../lib/schemas.js';

export function createDataRoutes(storage: Storage) {
  const app = new OpenAPIHono();

  app.openapi(
    createRoute({
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
    }),
    async (c) => {
      const content = await storage.getContent();

      return c.json(content);
    }
  );

  app.openapi(
    createRoute({
      method: 'get',
      path: '/data/{itemType}',
      request: {
        params: z.object({
          itemType: z.string().openapi({
            param: { name: 'itemType', in: 'path' },
            example: 'newsItem',
          }),
        }),
      },
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
    }),
    async (c) => {
      const { itemType } = c.req.valid('param');
      const content = await storage.getContent();

      return c.json(content[itemType]);
    }
  );

  app.openapi(
    createRoute({
      method: 'get',
      path: '/data/{itemType}/{id}',
      request: {
        params: z.object({
          itemType: z.string().openapi({
            param: { name: 'itemType', in: 'path' },
            example: 'newsItem',
          }),
          id: z.string().openapi({
            param: { name: 'id', in: 'path' },
            example: 'about-us',
          }),
        }),
      },
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
    }),
    async (c) => {
      const { itemType, id } = c.req.valid('param');
      const content = await storage.getContent();

      return c.json(content[itemType][id]);
    }
  );

  return app;
}
