import { z } from "zod";

export const ClientEnvSchema = z
  .object({
    EDITORIAL_API_URL: z.string().url(),
    PREVIEW_URL: z.string().url(),
  })
  .strict();

export const clientEnv = ClientEnvSchema.parse({
  EDITORIAL_API_URL: import.meta.env.VITE_EDITORIAL_API_URL,
  PREVIEW_URL: import.meta.env.VITE_PREVIEW_URL,
});

export type ClientEnv = z.infer<typeof ClientEnvSchema>;
