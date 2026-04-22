DO $$
BEGIN
  CREATE TYPE "storage_backend" AS ENUM ('local', 's3');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

ALTER TABLE "documents" RENAME COLUMN "source_object_key" TO "storage_key";
ALTER TABLE "documents" RENAME COLUMN "source_mime_type" TO "content_type";
ALTER TABLE "documents" RENAME COLUMN "source_checksum" TO "checksum";

ALTER TABLE "documents"
  ADD COLUMN IF NOT EXISTS "storage_backend" "storage_backend",
  ADD COLUMN IF NOT EXISTS "original_filename" varchar(255),
  ADD COLUMN IF NOT EXISTS "byte_size" integer;

UPDATE "documents"
SET
  "storage_backend" = COALESCE("storage_backend", 'local'::storage_backend),
  "original_filename" = COALESCE(
    "original_filename",
    CONCAT(
      COALESCE(NULLIF(regexp_replace(lower("title"), '[^a-z0-9]+', '-', 'g'), ''), 'document'),
      CASE
        WHEN "content_type" = 'application/pdf' THEN '.pdf'
        WHEN "content_type" = 'application/json' THEN '.json'
        ELSE '.txt'
      END
    )
  ),
  "byte_size" = COALESCE("byte_size", 0);

ALTER TABLE "documents"
  ALTER COLUMN "storage_backend" SET NOT NULL,
  ALTER COLUMN "storage_backend" SET DEFAULT 'local'::storage_backend,
  ALTER COLUMN "original_filename" SET NOT NULL,
  ALTER COLUMN "byte_size" SET NOT NULL;

ALTER TYPE "document_status" RENAME TO "document_status_old";

CREATE TYPE "document_status" AS ENUM ('uploaded', 'queued', 'processing', 'processed', 'failed');

ALTER TABLE "documents" ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "documents"
  ALTER COLUMN "status" TYPE "document_status"
  USING (
    CASE
      WHEN "status"::text = 'pending' THEN 'queued'
      WHEN "status"::text = 'processing' THEN 'processing'
      WHEN "status"::text = 'ready' THEN 'processed'
      WHEN "status"::text = 'failed' THEN 'failed'
      ELSE 'uploaded'
    END
  )::"document_status";

ALTER TABLE "documents"
  ALTER COLUMN "status" SET DEFAULT 'uploaded'::document_status;

DROP TYPE "document_status_old";

CREATE INDEX IF NOT EXISTS "documents_storage_backend_idx" ON "documents" ("storage_backend");
