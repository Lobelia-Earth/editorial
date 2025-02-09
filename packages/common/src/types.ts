import type { z } from 'zod';
import type {
  EditorialConfigSchema,
  EditorialDataObjectSchema,
  EditorialDataSchema,
  EditorialSchemaItemFieldSchema,
  EditorialSchemaItemSchema,
  EditorialSchemaSchema,
} from './schemas.js';

export type EditorialConfig = z.infer<typeof EditorialConfigSchema>;
export type EditorialDataObject = z.infer<typeof EditorialDataObjectSchema>;
export type EditorialData = z.infer<typeof EditorialDataSchema>;
export type EditorialSchemaItemField = z.infer<
  typeof EditorialSchemaItemFieldSchema
>;
export type EditorialSchemaItem = z.infer<typeof EditorialSchemaItemSchema>;
export type EditorialSchema = z.infer<typeof EditorialSchemaSchema>;
