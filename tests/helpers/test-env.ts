export const TEST_USER_EMAIL = "demo@example.com";
export const TEST_USER_PASSWORD = "ChangeMe123!";

export function applyTestEnv() {
  Object.assign(process.env, {
    NODE_ENV: "test",
    APP_URL: process.env.APP_URL ?? "http://127.0.0.1:3000",
    DATABASE_URL:
      process.env.TEST_DATABASE_URL ??
      process.env.DATABASE_URL ??
      "postgres://postgres:postgres@127.0.0.1:5432/doc_llm_test",
    TEST_DATABASE_URL:
      process.env.TEST_DATABASE_URL ??
      process.env.DATABASE_URL ??
      "postgres://postgres:postgres@127.0.0.1:5432/doc_llm_test",
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ?? "test-secret",
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? "http://127.0.0.1:3000",
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? "test-openai-key",
    OPENAI_GENERATION_MODEL:
      process.env.OPENAI_GENERATION_MODEL ?? "gpt-5-mini",
    OPENAI_EMBEDDING_MODEL:
      process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small",
    EMBEDDING_DIMENSION: process.env.EMBEDDING_DIMENSION ?? "1536",
    STORAGE_BACKEND:
      process.env.STORAGE_BACKEND ?? process.env.OBJECT_STORAGE_DRIVER ?? "local",
    STORAGE_LOCAL_DIR:
      process.env.STORAGE_LOCAL_DIR ?? process.env.LOCAL_STORAGE_ROOT ?? "./data/uploads",
    STORAGE_MAX_UPLOAD_SIZE_BYTES:
      process.env.STORAGE_MAX_UPLOAD_SIZE_BYTES ?? "26214400",
    WORKER_POLL_INTERVAL_MS: process.env.WORKER_POLL_INTERVAL_MS ?? "10",
    INGESTION_MAX_CHUNK_SIZE: process.env.INGESTION_MAX_CHUNK_SIZE ?? "1200",
    INGESTION_CHUNK_OVERLAP: process.env.INGESTION_CHUNK_OVERLAP ?? "200",
    INGESTION_QUERY_MATCH_LIMIT:
      process.env.INGESTION_QUERY_MATCH_LIMIT ?? "5",
    AWS_S3_FORCE_PATH_STYLE: process.env.AWS_S3_FORCE_PATH_STYLE ?? "false",
    DEMO_USER_EMAIL: process.env.DEMO_USER_EMAIL ?? TEST_USER_EMAIL,
    DEMO_USER_PASSWORD: process.env.DEMO_USER_PASSWORD ?? TEST_USER_PASSWORD,
  });
}
