import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import {
  EditorialDataItemSchema,
  EditorialDataSchema,
  EditorialSchemaSchema,
  type EditorialConfig,
} from "@isardsat/editorial-common";
import type { Storage } from "../lib/storage.js";

export function createDataRoutes(config: EditorialConfig, storage: Storage) {
  const app = new OpenAPIHono();

  const publicFilesUrl = config.filesUrl;

  app.openapi(
    createRoute({
      method: "get",
      path: "/schema",
      responses: {
        200: {
          content: {
            "application/json": {
              schema: EditorialSchemaSchema,
            },
          },
          description: "Get Editorial schema",
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
      method: "get",
      path: "/data",
      responses: {
        200: {
          content: {
            "application/json": {
              schema: EditorialDataSchema,
            },
          },
          description: "Get all Editorial data",
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
      method: "get",
      path: "/data/{itemType}",
      request: {
        params: z.object({
          itemType: z.string().openapi({
            param: { name: "itemType", in: "path" },
            example: "newsItem",
          }),
        }),
        query: z.object({
          lang: z
            .string()
            .optional()
            .openapi({
              param: { name: "lang", in: "query" },
              example: "es_ES",
            }),
          preview: z.string().optional(),
        }),
      },
      responses: {
        200: {
          content: {
            "application/json": {
              schema: EditorialDataSchema,
            },
          },
          description: "Get objects by type",
        },
        404: {
          description: "Collection not found",
        },
      },
    }),
    async (c) => {
      const { itemType } = c.req.valid("param");
      const { lang, preview } = c.req.valid("query");

      const origin = preview ? new URL(c.req.url).origin : publicFilesUrl;
      const content = await storage.getContent();
      const schema = await storage.getSchema();
      const collection = content[itemType];

      if (!collection) {
        return c.notFound();
      }

      // TODO: Formalize this process.
      if (lang) {
        const messages = await storage.getLocalisationMessages(lang);

        for (const [key, message] of Object.entries(messages)) {
          const [contentKey, typeKey, fieldKey] = key.split(".");

          if (contentKey === itemType) {
            collection[typeKey][fieldKey] = (message as any).defaultMessage;
          }
        }
      }

      for (const [itemKey, itemValue] of Object.entries(collection)) {
        for (const [key, value] of Object.entries(itemValue)) {
          if (!schema[itemType].fields[key]?.isUploadedFile) continue;
          if ((value as string).startsWith("http")) continue;

          collection[itemKey][key] = `${origin}/${value}`;
        }
      }

      return c.json(collection);
    }
  );

  app.openapi(
    createRoute({
      method: "get",
      path: "/data/{itemType}/ids",
      request: {
        params: z.object({
          itemType: z.string().openapi({
            param: { name: "itemType", in: "path" },
            example: "newsItem",
          }),
        }),
      },
      responses: {
        200: {
          content: {
            "application/json": {
              schema: z.array(z.string()),
            },
          },
          description: "Get object ids by type",
        },
      },
    }),
    async (c) => {
      const { itemType } = c.req.valid("param");
      const content = await storage.getContent();

      return c.json(Object.keys(content[itemType]));
    }
  );

  app.openapi(
    createRoute({
      method: "get",
      path: "/data/{itemType}/{id}",
      request: {
        params: z.object({
          itemType: z.string().openapi({
            param: { name: "itemType", in: "path" },
            example: "newsItem",
          }),
          id: z.string().openapi({
            param: { name: "id", in: "path" },
            example: "about-us",
          }),
        }),
        query: z.object({
          lang: z
            .string()
            .optional()
            .openapi({
              param: { name: "lang", in: "query" },
              example: "es_ES",
            }),
          preview: z.string().optional(),
        }),
      },
      responses: {
        200: {
          content: {
            "application/json": {
              schema: EditorialDataSchema,
            },
          },
          description: "Get object data",
        },
        404: {
          description: "Collection or item not found",
        },
      },
    }),
    async (c) => {
      const { itemType, id } = c.req.valid("param");
      const { lang, preview } = c.req.valid("query");

      const origin = preview ? new URL(c.req.url).origin : publicFilesUrl;
      const content = await storage.getContent();
      const schema = await storage.getSchema();
      const collection = content[itemType];

      if (!collection) {
        return c.notFound();
      }

      const item = collection[id];

      if (!item) {
        return c.notFound();
      }

      // TODO: Formalize this process.
      if (lang) {
        const messages = await storage.getLocalisationMessages(lang);

        for (const [key, message] of Object.entries(messages)) {
          const [, typeKey, fieldKey] = key.split(".");

          if (typeKey === id) {
            item[fieldKey] = (message as any).defaultMessage;
          }
        }
      }

      for (const [key, value] of Object.entries(item)) {
        if (!schema[itemType].fields[key]?.isUploadedFile) continue;
        if ((value as string).startsWith("http")) continue;

        item[key] = `${origin}/${value}`;
      }

      return c.json(item);
    }
  );

  app.openapi(
    createRoute({
      method: "put",
      path: "/data/{itemType}/{id}",
      request: {
        params: z.object({
          itemType: z.string().openapi({
            param: { name: "itemType", in: "path" },
            example: "newsItem",
          }),
          id: z.string().openapi({
            param: { name: "id", in: "path" },
            example: "learn-about-us",
          }),
        }),
        body: {
          content: {
            "application/json": {
              schema: EditorialDataItemSchema,
            },
          },
          required: true,
        },
      },
      responses: {
        200: {
          content: {
            "application/json": {
              schema: EditorialDataItemSchema,
            },
          },
          description: "Create a new object",
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
      method: "patch",
      path: "/data/{itemType}/{id}",
      request: {
        params: z.object({
          itemType: z.string().openapi({
            param: { name: "itemType", in: "path" },
            example: "newsItem",
          }),
          id: z.string().openapi({
            param: { name: "id", in: "path" },
            example: "about-us",
          }),
        }),
        body: {
          content: {
            "application/json": {
              schema: EditorialDataItemSchema,
            },
          },
          required: true,
        },
      },
      responses: {
        200: {
          content: {
            "application/json": {
              schema: EditorialDataSchema,
            },
          },
          description: "Update object",
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
      method: "delete",
      path: "/data/{itemType}/{id}",
      request: {
        params: z.object({
          itemType: z.string().openapi({
            param: { name: "itemType", in: "path" },
            example: "newsItem",
          }),
          id: z.string().openapi({
            param: { name: "id", in: "path" },
            example: "about-us",
          }),
        }),
      },
      responses: {
        200: {
          content: {
            "application/json": {
              schema: z.boolean(),
            },
          },
          description: "Delete object",
        },
      },
    }),
    async (c) => {
      const { itemType, id } = c.req.valid("param");
      await storage.deleteItem({ type: itemType, id });

      return c.json(true, 200);
    }
  );

  return app;
}
