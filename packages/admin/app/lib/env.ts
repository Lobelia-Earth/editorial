import { z } from "zod";

export const ClientEnvSchema = z
  .object({
    EDITORIAL_API_URL: z.string().url(),
    FIREBASE_API_KEY: z.string().min(1),
    FIREBASE_AUTH_DOMAIN: z.string().min(1),
    FIREBASE_DATABASE_URL: z.string().url(),
    FIREBASE_PROJECT_ID: z.string().min(1),
    FIREBASE_STORAGE_BUCKET: z.string().optional(),
    FIREBASE_MESSAGING_SENDER_ID: z.string().optional(),
    FIREBASE_DB_USERS_PATH: z.string().min(1),
  })
  .strict();

export const clientEnv = ClientEnvSchema.parse({
  EDITORIAL_API_URL: import.meta.env.VITE_EDITORIAL_API_URL,
  FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  FIREBASE_DATABASE_URL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID: import.meta.env
    .VITE_FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_DB_USERS_PATH: import.meta.env.VITE_FIREBASE_DB_USERS_PATH,
});

export type ClientEnv = z.infer<typeof ClientEnvSchema>;
