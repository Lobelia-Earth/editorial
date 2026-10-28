import type { z } from "@hono/zod-openapi";
import type {
  EditorialConfigSchema,
  EditorialDataItemSchema,
  EditorialDataObjectWithTypeSchema,
  EditorialDataSchema,
  EditorialDataTypeSchema,
  EditorialSchemaBlockSchema,
  EditorialSchemaItemFieldSchema,
  EditorialSchemaItemSchema,
  EditorialSchemaSchema,
  EditorialUpdateDataItemSchema,
} from "./schemas.js";

export interface LargeFileHandler {
  list: () => Promise<object[]>;
  delete: () => Promise<void>;
  upload: (file: unknown, options?: unknown) => Promise<void>;
}

export type EditorialConfig = z.infer<typeof EditorialConfigSchema>;
export type EditorialData = z.infer<typeof EditorialDataSchema>;
export type EditorialDataType = z.infer<typeof EditorialDataTypeSchema>;
export type EditorialDataItem = z.infer<typeof EditorialDataItemSchema>;
export type EditorialUpdateDataItem = z.infer<
  typeof EditorialUpdateDataItemSchema
>;
export type EditorialDataObjectWithType = z.infer<
  typeof EditorialDataObjectWithTypeSchema
>;
export type EditorialSchemaItemField = z.infer<
  typeof EditorialSchemaItemFieldSchema
>;
export type EditorialSchemaBlock = z.infer<typeof EditorialSchemaBlockSchema>;
export type EditorialSchemaItem = z.infer<typeof EditorialSchemaItemSchema>;
export type EditorialSchema = z.infer<typeof EditorialSchemaSchema>;

/**
 * Stored value of a single block in a "blocks" field. `_block` is the block
 * type key as defined in the schema.
 */
export type EditorialBlockValue<TBlock extends string = string> = {
  _block: TBlock;
} & Record<string, unknown>;
