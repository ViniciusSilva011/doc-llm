DROP INDEX IF EXISTS "document_chunks_embedding_hnsw_idx";

DELETE FROM "document_chunks";

ALTER TABLE "document_chunks"
  ALTER COLUMN "embedding" TYPE vector(768);

CREATE INDEX IF NOT EXISTS "document_chunks_embedding_hnsw_idx"
  ON "document_chunks" USING hnsw ("embedding" vector_cosine_ops);
