import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import {
  EditorialDataItemSchema,
  EditorialDataSchema,
  EditorialDiffResponseSchema,
  EditorialSchemaSchema,
  EditorialUpdateDataItemSchema,
  type EditorialConfig,
  type EditorialData,
  type EditorialDiffResponse,
} from "@isardsat/editorial-common";
import { createCache } from "../lib/cache.js";
import { firebaseAuth } from "../lib/middleware/auth.js";
import type { Storage } from "../lib/storage.js";
import { getChangedFields } from "../lib/utils/diff.js";
import {
  resolveCollectionReferences,
  resolveReferences,
  updateOrRemoveReferences,
} from "../lib/utils/references.js";
import { generateMetaSchema } from "../lib/utils/schema.js";

export function createDataRoutes(config: EditorialConfig, storage: Storage) {
  const app = new OpenAPIHono();
  const cache = createCache();

  const publicFilesUrl = config.filesUrl;

  app.openapi(
    createRoute({
      method: "get",
      path: "/schema",
      summary: "Get Editorial schema",
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
      tags: ["Schema"],
    }),
    async (c) => {
      const schema = await cache.getSchema(storage);

      return c.json(schema);
    },
  );

  app.openapi(
    createRoute({
      method: "get",
      path: "/data",
      summary: "Get all Editorial data",
      request: {
        query: z.object({
          lang: z
            .string()
            .optional()
            .openapi({
              param: { name: "lang", in: "query" },
              example: "es_ES",
            }),
          preview: z.string().optional(),
          resolve: z
            .string()
            .optional()
            .openapi({
              param: { name: "resolve", in: "query" },
              description: "Resolve referenced fields to full objects",
            }),
        }),
      },
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
      tags: ["Data"],
    }),
    async (c) => {
      const { preview, resolve } = c.req.valid("query");
      const content = await cache.getContent(storage, { production: !preview });

      if (!resolve) {
        return c.json(content);
      }

      const origin = preview ? new URL(c.req.url).origin : publicFilesUrl;

      // Resolve references for all collections
      const schema = await cache.getSchema(storage);
      const resolvedContent: EditorialData = {};

      for (const [itemType, collection] of Object.entries(content)) {
        resolvedContent[itemType] = resolveCollectionReferences(
          collection,
          schema,
          itemType,
          content,
          origin,
        );
      }

      return c.json(resolvedContent);
    },
  );

  app.openapi(
    createRoute({
      method: "get",
      path: "/data/{itemType}",
      summary: "Get objects data by type",
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
          resolve: z
            .string()
            .optional()
            .openapi({
              param: { name: "resolve", in: "query" },
              description: "Resolve referenced fields to full objects",
            }),
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
      tags: ["Data"],
    }),
    async (c) => {
      const { itemType } = c.req.valid("param");
      const { lang, preview, resolve } = c.req.valid("query");

      const origin = preview ? new URL(c.req.url).origin : publicFilesUrl;
      const content = await cache.getContent(storage, {
        production: !preview,
        lang,
      });
      const schema = await cache.getSchema(storage);
      const collection = content[itemType];

      if (!collection && schema[itemType]) {
        return c.json({});
      }

      if (!collection) {
        return c.notFound();
      }

      // TODO: Formalize this process.
      if (lang) {
        const messages = await storage.getLocalisationMessages(lang);

        for (const [key, message] of Object.entries(messages)) {
          const [contentKey, typeKey, fieldKey] = key.split(".");

          if (contentKey === itemType) {
            if (!collection[typeKey]) continue;
            collection[typeKey][fieldKey] = (message as any).defaultMessage;
          }
        }
      }

      // Resolve references if requested (includes file URL resolution)
      if (resolve) {
        return c.json(
          resolveCollectionReferences(
            collection,
            schema,
            itemType,
            content,
            origin,
          ),
        );
      }

      // Apply file URL resolution for non-resolved requests
      for (const [itemKey, itemValue] of Object.entries(collection)) {
        for (const [key, value] of Object.entries(itemValue)) {
          if (!schema[itemType].fields[key]?.isUploadedFile) continue;
          if ((value as string).startsWith("http")) continue;

          collection[itemKey][key] = `${origin}/${value}`;
        }
      }

      return c.json(collection);
    },
  );

  app.openapi(
    createRoute({
      method: "get",
      path: "/data/{itemType}/ids",
      summary: "Get object ids by type",
      request: {
        params: z.object({
          itemType: z.string().openapi({
            param: { name: "itemType", in: "path" },
            example: "newsItem",
          }),
        }),
        query: z.object({
          preview: z.string().optional(),
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
        404: {
          description: "Item not found",
        },
      },
      tags: ["Data"],
    }),
    async (c) => {
      const { itemType } = c.req.valid("param");
      const { preview } = c.req.valid("query");

      const content = await cache.getContent(storage, { production: !preview });

      if (!content[itemType]) {
        return c.notFound();
      }

      return c.json(Object.keys(content[itemType]));
    },
  );

  app.openapi(
    createRoute({
      method: "get",
      path: "/data/{itemType}/{id}",
      summary: "Get object data by type and id",
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
          resolve: z
            .string()
            .optional()
            .openapi({
              param: { name: "resolve", in: "query" },
              description: "Resolve referenced fields to full objects",
            }),
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
      tags: ["Data"],
    }),
    async (c) => {
      const { itemType, id } = c.req.valid("param");
      const { lang, preview, resolve } = c.req.valid("query");

      const origin = preview ? new URL(c.req.url).origin : publicFilesUrl;
      const content = await cache.getContent(storage, {
        production: !preview,
        lang,
      });
      const schema = await cache.getSchema(storage);
      const collection = content[itemType];

      if (!collection) {
        return c.notFound();
      }

      let item = collection[id];

      if (!item) {
        return c.notFound();
      }

      // TODO: Formalize this process.
      if (lang) {
        const messages = await storage.getLocalisationMessages(lang);

        for (const [key, message] of Object.entries(messages)) {
          const [contentKey, typeKey, fieldKey] = key.split(".");

          if (contentKey === itemType && typeKey === id) {
            item[fieldKey] = (message as any).defaultMessage;
          }
        }
      }

      // Resolve references if requested (includes file URL resolution)
      if (resolve) {
        item = resolveReferences(item, schema, itemType, content, origin);
        return c.json(item);
      }

      // Apply file URL resolution for non-resolved requests
      for (const [key, value] of Object.entries(item)) {
        if (!schema[itemType].fields[key]?.isUploadedFile) continue;
        if ((value as string).startsWith("http")) continue;

        item[key] = `${origin}/${value}`;
      }

      return c.json(item);
    },
  );

  app.openapi(
    createRoute({
      method: "put",
      path: "/data/{itemType}/{id}",
      summary: "Create object data by type and id",
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
        409: {
          description: "Item with this type and id already exists",
        },
      },
      tags: ["Data"],
      middleware: [firebaseAuth(config.firebase?.projectId || "")],
      security: [{ bearerAuth: [] }],
    }),
    async (c) => {
      const itemAtts = await c.req.json();
      const itemExists = await storage.checkItemExists({
        type: itemAtts.type,
        id: itemAtts.id,
      });
      if (itemExists) {
        return c.json(
          { error: "Item with this type and id already exists" },
          409,
        );
      }
      const newItem = await storage.createItem(itemAtts);

      cache.invalidateContent();

      return c.json(newItem);
    },
  );

  app.openapi(
    createRoute({
      method: "patch",
      path: "/data/{itemType}/{id}",
      summary: "Update object data by type and id",
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
              schema: EditorialUpdateDataItemSchema,
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
          description: "Update object",
        },
        409: {
          description: "Item with this type and id already exists",
        },
      },
      tags: ["Data"],
      middleware: [firebaseAuth(config.firebase?.projectId || "")],
      security: [{ bearerAuth: [] }],
    }),
    async (c) => {
      const { itemType, id } = c.req.valid("param");
      const itemAtts = await c.req.json();

      if (itemAtts.newId) {
        const itemWithNewIdExists = await storage.checkItemExists({
          type: itemAtts.type,
          id: itemAtts.newId,
        });
        if (itemWithNewIdExists) {
          return c.json(
            { error: "Item with this type and this new id already exists" },
            409,
          );
        }
      }

      const oldId = id;
      const newId = itemAtts.newId || itemAtts.id || id;
      const renamed = oldId !== newId;

      // Update renamed item first
      const updatedItem = await storage.updateItem({
        ...itemAtts,
        type: itemType,
        id: oldId,
      });

      // Repair references if needed
      if (renamed) {
        const [schema, content] = await Promise.all([
          storage.getSchema(),
          storage.getContent({ production: false }), // preview/content being edited
        ]);

        await updateOrRemoveReferences({
          schema,
          content,
          storage,
          targetType: itemType,
          oldId,
          newId,
        });
      }

      cache.invalidateContent();
      return c.json(updatedItem);
    },
  );

  app.openapi(
    createRoute({
      method: "delete",
      path: "/data/{itemType}/{id}",
      summary: "Delete object by type and id",
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
      tags: ["Data"],
      middleware: [firebaseAuth(config.firebase?.projectId || "")],
      security: [{ bearerAuth: [] }],
    }),
    async (c) => {
      const { itemType, id } = c.req.valid("param");

      await storage.deleteItem({ type: itemType, id });

      // Remove references to the deleted item
      const [schema, content] = await Promise.all([
        storage.getSchema(),
        storage.getContent({ production: false }),
      ]);

      await updateOrRemoveReferences({
        schema,
        content,
        storage,
        targetType: itemType,
        oldId: id,
        newId: null,
      });

      cache.invalidateContent();

      return c.json(true, 200);
    },
  );

  app.openapi(
    createRoute({
      method: "get",
      path: "/meta-schema",
      summary: "Get Editorial meta-schema",
      request: {
        query: z.object({
          allowedExtraFields: z
            .string()
            .optional()
            .openapi({
              param: { name: "allowedExtraFields", in: "query" },
              example: "customField,legacyField",
              description:
                "Comma-separated list of extra field names that exist in the Editorial's schema but should not cause validation errors",
            }),
        }),
      },
      responses: {
        200: {
          content: {
            "application/json": {
              schema: z.record(z.string(), z.any()),
            },
          },
          description:
            "JSON Schema meta-schema for the Editorial configuration",
        },
      },
      tags: ["Schema"],
    }),
    async (c) => {
      const { allowedExtraFields: allowedExtraFieldsParam } =
        c.req.valid("query");
      const allowedExtraFields = allowedExtraFieldsParam
        ? allowedExtraFieldsParam.split(",").map((f) => f.trim())
        : [];

      const metaSchema = generateMetaSchema({ allowedExtraFields });
      return c.json(metaSchema);
    },
  );

  app.openapi(
    createRoute({
      method: "get",
      path: "/environments/diff",
      summary: "Get differences between preview and production data",
      responses: {
        200: {
          content: {
            "application/json": {
              schema: EditorialDiffResponseSchema,
            },
          },
          description: "Get differences between preview and production data",
        },
      },
      tags: ["Data"],
    }),
    async (c) => {
      // Fetch both preview and production content (not cached to ensure real-time diff)
      const [previewContent, productionContent, schema] = await Promise.all([
        storage.getContent({ production: false }),
        storage.getContent({ production: true }),
        storage.getSchema(),
      ]);

      const result: EditorialDiffResponse = {
        collections: {},
        singles: {},
      };

      // Get all item types from both preview and production
      const allItemTypes = new Set([
        ...Object.keys(previewContent),
        ...Object.keys(productionContent),
      ]);

      for (const itemType of allItemTypes) {
        const previewCollection = previewContent[itemType] || {};
        const productionCollection = productionContent[itemType] || {};
        const itemSchema = schema[itemType];

        // Check if this is a "singleton" type (only one item allowed)
        const isSingleton = itemSchema?.singleton === true;

        if (isSingleton) {
          // Compare the singleton item
          const previewKeys = Object.keys(previewCollection);
          const productionKeys = Object.keys(productionCollection);
          const singletonKey = previewKeys[0] || productionKeys[0];

          if (singletonKey) {
            const previewItem = previewCollection[singletonKey];
            const productionItem = productionCollection[singletonKey];

            if (previewItem && !productionItem) {
              // Singleton exists in preview but not in production = added
              result.singles[itemType] = {
                status: "added",
                preview: previewItem,
                updatedAt: previewItem.updatedAt,
                changedFields: Object.keys(previewItem).filter(
                  (k) => !["updatedAt", "createdAt"].includes(k),
                ),
              };
            } else if (!previewItem && productionItem) {
              // Singleton exists in production but not in preview = deleted
              result.singles[itemType] = {
                status: "deleted",
                production: productionItem,
              };
            } else if (previewItem?.updatedAt !== productionItem?.updatedAt) {
              // Singleton has different updatedAt = modified
              const changedFields = getChangedFields(
                previewItem,
                productionItem,
              );

              if (changedFields.length === 0) {
                // If there are no changed fields other than updatedAt, we can consider it as not modified
                continue;
              }
              result.singles[itemType] = {
                status: "modified",
                preview: previewItem,
                production: productionItem,
                updatedAt: previewItem?.updatedAt,
                changedFields,
              };
            }
          }
        } else {
          // Handle collections
          const added: EditorialDiffResponse["collections"][string]["added"] =
            [];
          const modified: EditorialDiffResponse["collections"][string]["modified"] =
            [];
          const deleted: EditorialDiffResponse["collections"][string]["deleted"] =
            [];

          // Find added and modified items
          for (const [id, previewItem] of Object.entries(previewCollection)) {
            const productionItem = productionCollection[id];

            if (!productionItem) {
              // Item exists in preview but not in production = added
              added.push({
                id,
                item: previewItem,
                updatedAt: previewItem.updatedAt,
              });
            } else if (previewItem.updatedAt !== productionItem.updatedAt) {
              // Item has different updatedAt = modified (not yet published)
              const changedFields = getChangedFields(
                previewItem,
                productionItem,
              );
              if (changedFields.length === 0) {
                // If there are no changed fields other than updatedAt, we can consider it as not modified
                continue;
              }
              modified.push({
                id,
                preview: previewItem,
                production: productionItem,
                updatedAt: previewItem.updatedAt,
                changedFields,
              });
            }
          }

          // Find deleted items (exist in production but not in preview)
          for (const [id, productionItem] of Object.entries(
            productionCollection,
          )) {
            if (!previewCollection[id]) {
              deleted.push({
                id,
                item: productionItem,
              });
            }
          }

          // Only include collections with changes
          if (added.length > 0 || modified.length > 0 || deleted.length > 0) {
            result.collections[itemType] = { added, modified, deleted };
          }
        }
      }

      return c.json(result);
    },
  );

  return app;
}
