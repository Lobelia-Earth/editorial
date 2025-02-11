import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import {
  EditorialDataObjectSchema,
  EditorialDataSchema,
  EditorialSchemaSchema,
} from '@isardsat/editorial-common';
import type { Storage } from '../lib/storage.js';

export function createDataRoutes(storage: Storage) {
  const app = new OpenAPIHono();

  app.openapi(
    createRoute({
      method: 'get',
      path: '/schema',
      responses: {
        200: {
          content: {
            'application/json': {
              schema: EditorialSchemaSchema,
            },
          },
          description: 'Get Editorial schema',
        },
      },
    }),
    async (c) => {
      const schema = await storage.getSchema();

      return c.json(schema);
    }
  );

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
          description: 'Get all Editorial data',
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
          description: 'Get objects by type',
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
          description: 'Get object data',
        },
      },
    }),
    async (c) => {
      const { itemType, id } = c.req.valid('param');
      const content = await storage.getContent();

      return c.json(content[itemType][id]);
    }
  );

  app.openapi(
    createRoute({
      method: 'put',
      path: '/data/{itemType}/{id}',
      request: {
        params: z.object({
          itemType: z.string().openapi({
            param: { name: 'itemType', in: 'path' },
            example: 'newsItem',
          }),
          id: z.string().openapi({
            param: { name: 'id', in: 'path' },
            example: 'learn-about-us',
          }),
        }),
        body: {
          content: {
            'application/json': {
              schema: EditorialDataObjectSchema,
            },
          },
          required: true,
        },
      },
      responses: {
        200: {
          content: {
            'application/json': {
              schema: EditorialDataObjectSchema,
            },
          },
          description: 'Create a new object',
        },
      },
    }),
    async (c) => {
      const itemAtts = await c.req.json();
      const newItem = await storage.createItem(itemAtts);

      return c.json(newItem);
    }
  );

  app.openapi(
    createRoute({
      method: 'patch',
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
        body: {
          content: {
            'application/json': {
              schema: EditorialDataObjectSchema,
            },
          },
          required: true,
        },
      },
      responses: {
        200: {
          content: {
            'application/json': {
              schema: EditorialDataSchema,
            },
          },
          description: 'Update object',
        },
      },
    }),
    async (c) => {
      const itemAtts = await c.req.json();
      const newItem = await storage.updateItem(itemAtts);

      return c.json(newItem);
    }
  );

  app.openapi(
    createRoute({
      method: 'delete',
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
              schema: z.boolean(),
            },
          },
          description: 'Delete object',
        },
      },
    }),
    async (c) => {
      const { itemType, id } = c.req.valid('param');
      await storage.deleteItem({ type: itemType, id });

      return c.json(true, 200);
    }
  );

  return app;
}
