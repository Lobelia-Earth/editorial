import { z } from '@hono/zod-openapi';

export const EditorialConfigSchema = z.object({
  name: z.string(),
  publicUrl: z.string().url(),
  previewUrl: z.string().optional(),
  silent: z.boolean().optional(),
});
export type EditorialConfig = z.infer<typeof EditorialConfigSchema>;

export const EditorialDataSchema = z.record(z.string(), z.object({}));
