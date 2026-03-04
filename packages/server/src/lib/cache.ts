import {
  type EditorialData,
  type EditorialSchema,
} from "@isardsat/editorial-common";
import type { Storage } from "../lib/storage.js";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export function createCache() {
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
