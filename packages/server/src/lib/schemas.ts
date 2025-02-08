import { z } from '@hono/zod-openapi';

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
  type: EditorialSchemaItemFieldType,
  displayName: z.string(),
  placeholder: z.string().optional(),
  isRequired: z.boolean().optional(),
  showInSummary: z.boolean().optional(),
});

export const EditorialSchemaItemSchema = z.object({
  displayName: z.string(),
  singleton: z.boolean().optional(),
  fields: z.record(z.string(), EditorialSchemaItemFieldSchema),
});

export const EditorialSchemaSchema = z.record(
  z.string(),
  EditorialSchemaItemSchema
);
