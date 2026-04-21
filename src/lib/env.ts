import "server-only";

import { z } from "zod";

import {
  DEFAULT_EMBEDDING_DIMENSION,
  DEFAULT_INGESTION_QUERY_MATCH_LIMIT,
} from "@/lib/constants";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: z.string().url(),
  DATABASE_URL: z.string().min(1),
  TEST_DATABASE_URL: z.string().min(1).optional(),
  NEXTAUTH_SECRET: z.string().min(1),
  NEXTAUTH_URL: z.string().url(),
  OPENAI_API_KEY: z.string().min(1),
  OPENAI_GENERATION_MODEL: z.string().min(1),
  OPENAI_EMBEDDING_MODEL: z.string().min(1),
  EMBEDDING_DIMENSION: z.coerce
    .number()
    .int()
    .positive()
    .refine((value) => value === DEFAULT_EMBEDDING_DIMENSION, {
      message: `This starter expects ${DEFAULT_EMBEDDING_DIMENSION}-dimension embeddings. Update the schema and migrations before changing it.`,
    }),
  OBJECT_STORAGE_DRIVER: z.enum(["local", "s3"]).default("local"),
  LOCAL_STORAGE_ROOT: z.string().min(1),
  WORKER_POLL_INTERVAL_MS: z.coerce.number().int().positive().default(5000),
  INGESTION_MAX_CHUNK_SIZE: z.coerce.number().int().positive().default(1200),
  INGESTION_CHUNK_OVERLAP: z.coerce.number().int().min(0).default(200),
  INGESTION_QUERY_MATCH_LIMIT: z.coerce
    .number()
    .int()
    .positive()
    .default(DEFAULT_INGESTION_QUERY_MATCH_LIMIT),
  DEMO_USER_EMAIL: z.string().email(),
  DEMO_USER_PASSWORD: z.string().min(8),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(
    `Invalid environment configuration:\n${parsed.error.issues
      .map((issue) => `- ${issue.path.join(".")}: ${issue.message}`)
      .join("\n")}`,
  );
}

export const env = parsed.data;
