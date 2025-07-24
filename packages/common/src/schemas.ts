import { z } from "@hono/zod-openapi";

export const EditorialConfigSchema = z.object({
  name: z.string(),
  publicUrl: z.string().url(),
  publicDir: z.string().default("public/files"),
  publicDeletedDir: z.string().default("public/files/.deleted"),
  previewUrl: z.string().optional(),
  silent: z.boolean().optional(),
  firebase: z
    .object({
      apiKey: z.string(),
      authDomain: z.string(),
      databaseURL: z.string(),
      projectId: z.string(),
      storageBucket: z.string(),
      messagingSenderId: z.string(),
      dbUsersPath: z.string(),
    })
    .optional(),
});

export const EditorialDataObjectWithTypeSchema = z
  .object({
    id: z.string(),
    type: z.string(),
  })
  .passthrough();

export const EditorialDataItemSchema = z
  .object({
    id: z.string(),
    createdAt: z
      .string()
      .datetime()
      .default(() => new Date().toISOString()),
    updatedAt: z
      .string()
      .datetime()
      .default(() => new Date().toISOString()),
  })
  .passthrough();

export const EditorialDataTypeSchema = z.record(
  z.string(),
  EditorialDataItemSchema
);

export const EditorialDataSchema = z.record(
  z.string(),
  EditorialDataTypeSchema
);

export const EditorialSchemaItemFieldType = z.enum([
  "string",
  "boolean",
  "date",
  "datetime",
  "markdown",
  "number",
  "color",
  "select",
  "url",
]);

export const EditorialSchemaItemFieldSchema = z
  .object({
    type: EditorialSchemaItemFieldType,
    displayName: z.string(),
    displayExtra: z.string().optional(),
    placeholder: z.string().optional(),
    isRequired: z.boolean().optional(),
    showInSummary: z.boolean().optional(),
  })
  .passthrough();

export const EditorialSchemaItemSchema = z.object({
  displayName: z.string(),
  singleton: z.boolean().optional(),
  fields: z.record(z.string(), EditorialSchemaItemFieldSchema),
});

export const EditorialSchemaSchema = z.record(
  z.string(),
  EditorialSchemaItemSchema
);

export const BaseEditorialFileSchema = z.object({
  name: z.string(),
  type: z.enum(["file", "directory"]),
  path: z.string(),
  size: z.number(),
});

export type BaseEditorialFile = z.infer<typeof BaseEditorialFileSchema> & {
  children?: BaseEditorialFile[];
};

export const EditorialFileSchema: z.ZodType<BaseEditorialFile> =
  BaseEditorialFileSchema.extend({
    children: z
      .lazy(() => EditorialFileSchema.array())
      .openapi({
        type: "array",
      }),
  });

export const EditorialFilesResponseSchema = z.object({
  files: z.array(EditorialFileSchema),
  totalSize: z.number(),
});

export const EditorialFilesSchema = z.array(EditorialFileSchema);
export type EditorialFile = z.infer<typeof EditorialFileSchema>;
export type EditorialFiles = z.infer<typeof EditorialFilesSchema>;
export type EditorialFilesResponse = z.infer<
  typeof EditorialFilesResponseSchema
>;
