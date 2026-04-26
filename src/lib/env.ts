import { z } from "zod";

import {
  DEFAULT_EMBEDDING_DIMENSION,
  DEFAULT_INGESTION_QUERY_MATCH_LIMIT,
  DEFAULT_MAX_UPLOAD_SIZE_BYTES,
} from "@/lib/constants";

const booleanStringSchema = z
  .union([z.literal("true"), z.literal("false"), z.boolean()])
  .transform((value) => value === true || value === "true");

const optionalEnvString = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    schema.optional(),
  );

const rawEnv = {
  ...process.env,
  STORAGE_BACKEND:
    process.env.STORAGE_BACKEND ?? process.env.OBJECT_STORAGE_DRIVER ?? "local",
  STORAGE_LOCAL_DIR:
    process.env.STORAGE_LOCAL_DIR ?? process.env.LOCAL_STORAGE_ROOT ?? "./data/uploads",
  STORAGE_MAX_UPLOAD_SIZE_BYTES:
    process.env.STORAGE_MAX_UPLOAD_SIZE_BYTES ??
    process.env.UPLOAD_MAX_FILE_SIZE_BYTES ??
    String(DEFAULT_MAX_UPLOAD_SIZE_BYTES),
};

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: z.string().url(),
  DATABASE_URL: z.string().min(1),
  TEST_DATABASE_URL: z.string().min(1).optional(),
  NEXTAUTH_SECRET: z.string().min(1),
  NEXTAUTH_URL: z.string().url(),
  OPENAI_API_KEY: z.string().min(1),
  OPENAI_BASE_URL: optionalEnvString(z.string().url()),
  OPENAI_GENERATION_MODEL: z.string().min(1),
  EMBEDDING_MODEL: z.string().min(1),
  EMBEDDING_DIMENSION: z.coerce
    .number()
    .int()
    .positive()
    .refine((value) => value === DEFAULT_EMBEDDING_DIMENSION, {
      message: `This starter expects ${DEFAULT_EMBEDDING_DIMENSION}-dimension embeddings. Update the schema and migrations before changing it.`,
    }),
  STORAGE_BACKEND: z.enum(["local", "s3"]).default("local"),
  STORAGE_LOCAL_DIR: z.string().min(1),
  STORAGE_MAX_UPLOAD_SIZE_BYTES: z.coerce
    .number()
    .int()
    .positive()
    .default(DEFAULT_MAX_UPLOAD_SIZE_BYTES),
  AWS_REGION: optionalEnvString(z.string().min(1)),
  AWS_S3_BUCKET: optionalEnvString(z.string().min(1)),
  AWS_ACCESS_KEY_ID: optionalEnvString(z.string().min(1)),
  AWS_SECRET_ACCESS_KEY: optionalEnvString(z.string().min(1)),
  AWS_S3_ENDPOINT: optionalEnvString(z.string().url()),
  AWS_S3_FORCE_PATH_STYLE: booleanStringSchema.optional().default(false),
  AWS_S3_PREFIX: optionalEnvString(z.string()),
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

const parsed = envSchema.safeParse(rawEnv);

if (!parsed.success) {
  throw new Error(
    `Invalid environment configuration:\n${parsed.error.issues
      .map((issue) => `- ${issue.path.join(".")}: ${issue.message}`)
      .join("\n")}`,
  );
}

export const env = parsed.data;
