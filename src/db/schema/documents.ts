import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
  vector,
} from "drizzle-orm/pg-core";

import { DEFAULT_EMBEDDING_DIMENSION } from "@/lib/constants";
import { users } from "@/db/schema/auth";

export const documentStatusEnum = pgEnum("document_status", [
  "uploaded",
  "queued",
  "processing",
  "processed",
  "failed",
]);

export const storageBackendEnum = pgEnum("storage_backend", ["local", "s3"]);

export const ingestionJobStatusEnum = pgEnum("ingestion_job_status", [
  "pending",
  "processing",
  "completed",
  "failed",
]);

export const documents = pgTable(
  "documents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    originalFilename: varchar("original_filename", { length: 255 }).notNull(),
    status: documentStatusEnum("status").notNull().default("uploaded"),
    storageBackend: storageBackendEnum("storage_backend").notNull().default("local"),
    storageKey: text("storage_key").notNull(),
    contentType: varchar("content_type", { length: 255 }).notNull(),
    byteSize: integer("byte_size").notNull(),
    checksum: varchar("checksum", { length: 128 }),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    lastIngestedAt: timestamp("last_ingested_at", {
      mode: "date",
      withTimezone: true,
    }),
    createdAt: timestamp("created_at", {
      mode: "date",
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", {
      mode: "date",
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    ownerIndex: index("documents_owner_id_idx").on(table.ownerId),
    statusIndex: index("documents_status_idx").on(table.status),
    storageBackendIndex: index("documents_storage_backend_idx").on(table.storageBackend),
  }),
);

export const documentChunks = pgTable(
  "document_chunks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    documentId: uuid("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
    chunkIndex: integer("chunk_index").notNull(),
    content: text("content").notNull(),
    tokenCount: integer("token_count").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    embedding: vector("embedding", {
      dimensions: DEFAULT_EMBEDDING_DIMENSION,
    }).notNull(),
    createdAt: timestamp("created_at", {
      mode: "date",
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    documentIndex: index("document_chunks_document_id_idx").on(table.documentId),
    documentChunkIndex: uniqueIndex("document_chunks_document_id_chunk_index_idx").on(
      table.documentId,
      table.chunkIndex,
    ),
  }),
);

export const ingestionJobs = pgTable(
  "ingestion_jobs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    documentId: uuid("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
    createdByUserId: uuid("created_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: ingestionJobStatusEnum("status").notNull().default("pending"),
    attemptCount: integer("attempt_count").notNull().default(0),
    maxAttempts: integer("max_attempts").notNull().default(3),
    errorMessage: text("error_message"),
    startedAt: timestamp("started_at", {
      mode: "date",
      withTimezone: true,
    }),
    finishedAt: timestamp("finished_at", {
      mode: "date",
      withTimezone: true,
    }),
    createdAt: timestamp("created_at", {
      mode: "date",
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", {
      mode: "date",
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    statusIndex: index("ingestion_jobs_status_idx").on(table.status),
    documentIndex: index("ingestion_jobs_document_id_idx").on(table.documentId),
  }),
);
