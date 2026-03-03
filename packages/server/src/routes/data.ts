import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import {
  EditorialDataItemSchema,
  EditorialDataSchema,
  EditorialDiffResponseSchema,
  EditorialSchemaSchema,
  getOptionsReference,
  type EditorialConfig,
  type EditorialData,
  type EditorialDataItem,
  type EditorialDiffResponse,
  type EditorialSchema,
} from "@isardsat/editorial-common";
import type { Storage } from "../lib/storage.js";
import { generateMetaSchema } from "../lib/utils/schema.js";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

function createCache() {
  let schemaCache: CacheEntry<EditorialSchema> | null = null;
  const contentCache = new Map<string, CacheEntry<EditorialData>>();
  const ttl = 5 * 60 * 1000; // 5 minutes TTL

  function isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > ttl;
  }

  return {
    async getSchema(storage: Storage): Promise<EditorialSchema> {
      if (schemaCache && !isExpired(schemaCache)) {
        return schemaCache.data;
      }

      const schema = await storage.getSchema();
      schemaCache = { data: schema, timestamp: Date.now() };
      return schema;
    },

    async getContent(
      storage: Storage,
      options: { production?: boolean; lang?: string } = {},
    ): Promise<EditorialData> {
      const mode = options.production ? "production" : "preview";
      const langSuffix = options.lang ? `-${options.lang}` : "";
      const cacheKey = `${mode}${langSuffix}`;
      const cachedEntry = contentCache.get(cacheKey);

      if (cachedEntry && !isExpired(cachedEntry)) {
        return cachedEntry.data;
      }

      const content = await storage.getContent(options);
      contentCache.set(cacheKey, { data: content, timestamp: Date.now() });
      return content;
    },

    invalidateSchema(): void {
      schemaCache = null;
    },

    invalidateContent(): void {
      contentCache.clear();
    },
  };
}

/**
 * Resolves uploaded file paths to full URLs for an item.
 */
function resolveFileUrls(
  item: EditorialDataItem,
  schema: EditorialSchema,
  itemType: string,
  origin: string,
): EditorialDataItem {
  const resolvedItem = { ...item };
  const itemSchema = schema[itemType];

  if (!itemSchema) return resolvedItem;

  for (const [key, value] of Object.entries(resolvedItem)) {
    if (!itemSchema.fields[key]?.isUploadedFile) continue;
    if (typeof value !== "string") continue;
    if (value.startsWith("http")) continue;

    resolvedItem[key] = `${origin}/${value}`;
  }

  return resolvedItem;
}

/**
 * Resolves referenced fields in an item, replacing IDs with full objects.
 * Recursively resolves nested references.
 */
function resolveReferences(
  item: EditorialDataItem,
  schema: EditorialSchema,
  itemType: string,
  content: EditorialData,
  origin: string,
  resolvedIds: Set<string> = new Set(),
): EditorialDataItem {
  const itemIdentifier = `${itemType}:${item.id}`;

  // Prevent circular references
  if (resolvedIds.has(itemIdentifier)) {
    return resolveFileUrls(item, schema, itemType, origin);
  }

  resolvedIds.add(itemIdentifier);

  // First resolve file URLs for the current item
  let resolvedItem = resolveFileUrls(item, schema, itemType, origin);
  const itemSchema = schema[itemType];

  if (!itemSchema) return resolvedItem;

  for (const [fieldKey, fieldConfig] of Object.entries(itemSchema.fields)) {
    if (fieldConfig.type !== "select" && fieldConfig.type !== "multiselect") {
      continue;
    }

    const referencedType = getOptionsReference(fieldConfig.options);
    if (!referencedType) continue;

    const referencedCollection = content[referencedType];
    if (!referencedCollection) continue;

    const fieldValue = item[fieldKey];

    if (fieldConfig.type === "select" && typeof fieldValue === "string") {
      // Single reference - replace ID with full object
      const referencedItem = referencedCollection[fieldValue];
      if (referencedItem) {
        // Recursively resolve nested references
        resolvedItem[fieldKey] = resolveReferences(
          referencedItem,
          schema,
          referencedType,
          content,
          origin,
          new Set(resolvedIds),
        );
      }
    } else if (
      fieldConfig.type === "multiselect" &&
      Array.isArray(fieldValue)
    ) {
      // Multiple references - replace IDs with full objects
      resolvedItem[fieldKey] = fieldValue
        .map((id) => {
          const referencedItem = referencedCollection[id];
          if (!referencedItem) return null;
          // Recursively resolve nested references
          return resolveReferences(
            referencedItem,
            schema,
            referencedType,
            content,
            origin,
            new Set(resolvedIds),
          );
        })
        .filter(Boolean);
    }
  }

  return resolvedItem;
}

/**
 * Resolves all references in a collection.
 */
function resolveCollectionReferences(
  collection: Record<string, EditorialDataItem>,
  schema: EditorialSchema,
  itemType: string,
  content: EditorialData,
  origin: string,
): Record<string, EditorialDataItem> {
  const resolvedCollection: Record<string, EditorialDataItem> = {};

  for (const [itemKey, item] of Object.entries(collection)) {
    resolvedCollection[itemKey] = resolveReferences(
      item,
      schema,
      itemType,
      content,
      origin,
    );
  }

  return resolvedCollection;
}

/**
 * Compares two items and returns the list of fields that have changed.
 * Excludes metadata fields like 'updatedAt'.
 */
function getChangedFields(
  previewItem: EditorialDataItem,
  productionItem: EditorialDataItem,
): string[] {
  const changedFields: string[] = [];
  const excludedFields = ["updatedAt", "createdAt"];

  // Get all unique keys from both items
  const allKeys = new Set([
    ...Object.keys(previewItem),
    ...Object.keys(productionItem),
  ]);

  for (const key of allKeys) {
    if (excludedFields.includes(key)) continue;

    const previewValue = previewItem[key];
    const productionValue = productionItem[key];

    if (!deepEqual(previewValue, productionValue)) {
      changedFields.push(key);
    }
  }

  return changedFields;
}

/**
 * Deep equality comparison for values.
 */
function deepEqual(value1: unknown, value2: unknown): boolean {
  if (value1 === value2) return true;
  if (value1 == null || value2 == null) return false;
  if (typeof value1 !== typeof value2) return false;

  if (typeof value1 !== "object") {
    return value1 === value2;
  }

  if (Array.isArray(value1) !== Array.isArray(value2)) return false;

  if (Array.isArray(value1)) {
    if (value1.length !== (value2 as unknown[]).length) return false;
    return value1.every((item, index) =>
      deepEqual(item, (value2 as unknown[])[index]),
    );
  }

  const keys1 = Object.keys(value1);
  const keys2 = Object.keys(value2 as object);

  if (keys1.length !== keys2.length) return false;

  return keys1.every((key) =>
    deepEqual(
      (value1 as Record<string, unknown>)[key],
      (value2 as Record<string, unknown>)[key],
    ),
  );
}

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
      summary: "Create or update object data by type and id",
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
      tags: ["Data"],
    }),
    async (c) => {
      const itemAtts = await c.req.json();
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
          description: "Update object",
        },
      },
      tags: ["Data"],
    }),
    async (c) => {
      const itemAtts = await c.req.json();
      const newItem = await storage.updateItem(itemAtts);

      cache.invalidateContent();

      return c.json(newItem);
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
    }),
    async (c) => {
      const { itemType, id } = c.req.valid("param");
      await storage.deleteItem({ type: itemType, id });

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
      path: "/diff",
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
    }),
    async (c) => {
      // Fetch both preview and production content
      const [previewContent, productionContent, schema] = await Promise.all([
        cache.getContent(storage, { production: false }),
        cache.getContent(storage, { production: true }),
        cache.getSchema(storage),
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
