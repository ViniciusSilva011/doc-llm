import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
  vector,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

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

export const documentChatRoleEnum = pgEnum("document_chat_role", [
  "user",
  "assistant",
]);

export const documentChatJobStatusEnum = pgEnum("document_chat_job_status", [
  "queued",
  "processing",
  "completed",
  "failed",
]);

export const documents = pgTable(
  "documents",
  {
    id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
    ownerId: integer("owner_id")
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
    ownerTitleUniqueIndex: uniqueIndex("documents_owner_id_lower_title_unique_idx").on(
      table.ownerId,
      sql`lower(${table.title})`,
    ),
  }),
);

export const documentChunks = pgTable(
  "document_chunks",
  {
    id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
    documentId: integer("document_id")
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
    id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
    documentId: integer("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
    createdByUserId: integer("created_by_user_id")
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

export const documentChatMessages = pgTable(
  "document_chat_messages",
  {
    id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
    documentId: integer("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: documentChatRoleEnum("role").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", {
      mode: "date",
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    documentCreatedAtIndex: index("document_chat_messages_document_created_at_idx").on(
      table.documentId,
      table.createdAt,
    ),
    userDocumentIndex: index("document_chat_messages_user_document_idx").on(
      table.userId,
      table.documentId,
    ),
  }),
);

export const documentChatJobs = pgTable(
  "document_chat_jobs",
  {
    id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
    documentId: integer("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    userMessageId: integer("user_message_id")
      .notNull()
      .references(() => documentChatMessages.id, { onDelete: "cascade" }),
    status: documentChatJobStatusEnum("status").notNull().default("queued"),
    error: text("error"),
    createdAt: timestamp("created_at", {
      mode: "date",
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    startedAt: timestamp("started_at", {
      mode: "date",
      withTimezone: true,
    }),
    completedAt: timestamp("completed_at", {
      mode: "date",
      withTimezone: true,
    }),
  },
  (table) => ({
    statusCreatedAtIndex: index("document_chat_jobs_status_created_at_idx").on(
      table.status,
      table.createdAt,
    ),
    userDocumentIndex: index("document_chat_jobs_user_document_idx").on(
      table.userId,
      table.documentId,
    ),
    userMessageIndex: index("document_chat_jobs_user_message_id_idx").on(
      table.userMessageId,
    ),
  }),
);
