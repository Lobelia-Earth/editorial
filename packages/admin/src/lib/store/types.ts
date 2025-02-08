import { createStore } from './createStore';
import { z } from 'zod';

export type AppStore = ReturnType<typeof createStore>;

export const EditorialConfigSchema = z.object({
  name: z.string(),
  publicUrl: z.string().url(),
  previewUrl: z.string().optional(),
  silent: z.boolean().optional(),
});
export type EditorialConfig = z.infer<typeof EditorialConfigSchema>;

export const EditorialDataObjectSchema = z.object({
  id: z.string(),
  type: z.string(),
});
export type EditorialDataObject = z.infer<typeof EditorialDataObjectSchema>;

export const EditorialDataSchema = z.record(
  z.string(),
  EditorialDataObjectSchema
);

export const EditorialSchemaItemFieldType = z.enum([
  'string',
  'boolean',
  'date',
  'markdown',
  'number',
  'color',
  'select',
]);

export const EditorialSchemaItemFieldSchema = z.object({
  id: z.string(),
  type: EditorialSchemaItemFieldType,
  displayName: z.string(),
  placeholder: z.string().optional(),
  isRequired: z.boolean().optional(),
  showInSummary: z.boolean().optional(),
});
export type EditorialSchemaItemField = z.infer<
  typeof EditorialSchemaItemFieldSchema
>;

export const EditorialSchemaItemSchema = z.object({
  displayName: z.string(),
  singleton: z.boolean().optional(),
  fields: z.record(z.string(), EditorialSchemaItemFieldSchema),
});
export type EditorialSchemaItem = z.infer<typeof EditorialSchemaItemSchema>;

export const EditorialSchemaSchema = z.record(
  z.string(),
  EditorialSchemaItemSchema
);
export type EditorialSchema = z.infer<typeof EditorialSchemaSchema>;
