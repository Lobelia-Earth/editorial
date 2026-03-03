import { z } from "@hono/zod-openapi";

export const EditorialConfigSchema = z.object({
  name: z.string(),
  publicUrl: z.url(),
  publicDir: z.string().default("public/files"),
  publicDeletedDir: z.string().default("public/files/.deleted"),
  filesUrl: z.url(),
  largeFilesUrl: z.url(),
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

export const EditorialDataObjectWithTypeSchema = z.looseObject({
  id: z.string(),
  type: z.string(),
});

export const EditorialDataItemSchema = z.looseObject({
  id: z.string(),
  isDraft: z.boolean().default(false),
  createdAt: z.iso.datetime().default(() => new Date().toISOString()),
  updatedAt: z.iso.datetime().default(() => new Date().toISOString()),
});

export const EditorialDataTypeSchema = z.record(
  z.string(),
  EditorialDataItemSchema,
);

export const EditorialDataSchema = z.record(
  z.string(),
  EditorialDataTypeSchema,
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
  "select",
  "multiselect",
]);

export const RGBColorSchema = z
  .string()
  .regex(
    /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/,
    "Must be a valid RGB color format: rgb(r, g, b)",
  )
  .refine((value) => {
    const match = value.match(
      /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/,
    );
    if (!match) return false;
    const [, r, g, b] = match;
    return (
      Number(r) >= 0 &&
      Number(r) <= 255 &&
      Number(g) >= 0 &&
      Number(g) <= 255 &&
      Number(b) >= 0 &&
      Number(b) <= 255
    );
  }, "RGB values must be between 0 and 255");

export const EditorialSchemaItemFieldSchema = z.looseObject({
  type: EditorialSchemaItemFieldType,
  displayName: z.string(),
  displayExtra: z.string().optional(),
  placeholder: z.string().optional(),
  optional: z.boolean().optional().default(false),
  showInSummary: z.boolean().optional(),
  options: z.array(z.string()).optional(),
  maxSelectedOptions: z.number().optional(),
  minSelectedOptions: z.number().optional(),
  isUploadedFile: z.boolean().optional(),
});

export const EditorialSchemaItemSchema = z.object({
  displayName: z.string(),
  filterBy: z.string().optional(),
  singleton: z.boolean().optional(),
  fields: z.record(z.string(), EditorialSchemaItemFieldSchema),
});

export const EditorialSchemaSchema = z.record(
  z.string(),
  EditorialSchemaItemSchema,
);

export const BaseEditorialFileSchema = z.object({
  name: z.string(),
  type: z.enum(["file", "directory"]),
  path: z.string(),
  relativePath: z.string(),
  size: z.number(),
  isLarge: z.boolean().optional(),
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

const itemStatus = ["added", "modified", "deleted"] as const;

export const EditorialDiffResponseSchema = z.object({
  collections: z.record(
    z.string(),
    z.object({
      added: z.array(
        z.object({
          id: z.string(),
          item: EditorialDataItemSchema,
          updatedAt: z.string().optional(),
        }),
      ),
      modified: z.array(
        z.object({
          id: z.string(),
          preview: EditorialDataItemSchema,
          production: EditorialDataItemSchema,
          updatedAt: z.string().optional(),
          changedFields: z.array(z.string()),
        }),
      ),
      deleted: z.array(
        z.object({
          id: z.string(),
          item: EditorialDataItemSchema,
        }),
      ),
    }),
  ),
  singles: z.record(
    z.string(),
    z.object({
      status: z.enum(itemStatus),
      preview: EditorialDataItemSchema.optional(),
      production: EditorialDataItemSchema.optional(),
      updatedAt: z.string().optional(),
      changedFields: z.array(z.string()).optional(),
    }),
  ),
});

export type EditorialFile = z.infer<typeof EditorialFileSchema>;
export type EditorialFiles = z.infer<typeof EditorialFilesSchema>;
export type EditorialFilesResponse = z.infer<
  typeof EditorialFilesResponseSchema
>;
export type EditorialDiffResponse = z.infer<typeof EditorialDiffResponseSchema>;
export type EditorialDataItemStatus = (typeof itemStatus)[number];
