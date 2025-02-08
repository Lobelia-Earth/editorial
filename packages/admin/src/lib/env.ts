import { z } from 'zod';

export const ClientEnvSchema = z
  .object({
    NEXT_PUBLIC_EDITORIAL_API_URL: z.string().url(),
  })
  .strict();

export const clientEnv = ClientEnvSchema.parse({
  NEXT_PUBLIC_EDITORIAL_API_URL: process.env.NEXT_PUBLIC_EDITORIAL_API_URL,
});

export type ClientEnv = z.infer<typeof ClientEnvSchema>;
