import { z } from "zod";

const serverEnvSchema = z.object({
  AUTH_SECRET: z.string().min(32).optional(),
  DATABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_APP_NAME: z.string().min(1).default("Amorta"),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function parseServerEnv(
  source: Record<string, string | undefined>,
): ServerEnv {
  return serverEnvSchema.parse(source);
}

export const serverEnv = parseServerEnv(process.env);
