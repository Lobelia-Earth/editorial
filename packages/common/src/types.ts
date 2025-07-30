import type { z } from "zod";
import type {
  EditorialConfigSchema,
  EditorialDataItemSchema,
  EditorialDataObjectWithTypeSchema,
  EditorialDataSchema,
  EditorialDataTypeSchema,
  EditorialSchemaItemFieldSchema,
  EditorialSchemaItemSchema,
  EditorialSchemaSchema,
} from "./schemas.js";

export interface LargeFileHandler {
  list: () => Promise<object[]>;
  delete: () => Promise<void>;
  upload: () => Promise<void>;
}

export type EditorialConfig = z.infer<typeof EditorialConfigSchema>;
export type EditorialData = z.infer<typeof EditorialDataSchema>;
export type EditorialDataType = z.infer<typeof EditorialDataTypeSchema>;
export type EditorialDataItem = z.infer<typeof EditorialDataItemSchema>;
export type EditorialDataObjectWithType = z.infer<
  typeof EditorialDataObjectWithTypeSchema
>;
export type EditorialSchemaItemField = z.infer<
  typeof EditorialSchemaItemFieldSchema
>;
export type EditorialSchemaItem = z.infer<typeof EditorialSchemaItemSchema>;
export type EditorialSchema = z.infer<typeof EditorialSchemaSchema>;
