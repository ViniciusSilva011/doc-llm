import { and, count, desc, eq, inArray, sql } from "drizzle-orm";

import { db } from "@/db/client";
import { documentChunks, documents, ingestionJobs } from "@/db/schema";
import type { TextChunk } from "@/types/ingestion";

export async function createDocument(input: {
  ownerId: number;
  title: string;
  originalFilename: string;
  storageBackend: "local" | "s3";
  storageKey: string;
  contentType: string;
  byteSize: number;
  checksum?: string;
  status?: "uploaded" | "queued" | "processing" | "processed" | "failed";
  metadata?: Record<string, unknown>;
}) {
  const [document] = await db
    .insert(documents)
    .values({
      ownerId: input.ownerId,
      title: input.title,
      originalFilename: input.originalFilename,
      status: input.status ?? "uploaded",
      storageBackend: input.storageBackend,
      storageKey: input.storageKey,
      contentType: input.contentType,
      byteSize: input.byteSize,
      checksum: input.checksum,
      metadata: input.metadata ?? {},
    })
    .returning();

  if (!document) {
    throw new Error("Failed to create document.");
  }

  return document;
}

export async function getDocumentById(documentId: number) {
  const [document] = await db
    .select()
    .from(documents)
    .where(eq(documents.id, documentId))
    .limit(1);

  return document ?? null;
}

export async function listDocumentsForUser(userId: number) {
  return db
    .select({
      id: documents.id,
      title: documents.title,
      originalFilename: documents.originalFilename,
      status: documents.status,
      storageBackend: documents.storageBackend,
      contentType: documents.contentType,
      byteSize: documents.byteSize,
      lastIngestedAt: documents.lastIngestedAt,
      createdAt: documents.createdAt,
      updatedAt: documents.updatedAt,
      chunkCount: sql<number>`count(${documentChunks.id})`.mapWith(Number),
    })
    .from(documents)
    .leftJoin(documentChunks, eq(documentChunks.documentId, documents.id))
    .where(eq(documents.ownerId, userId))
    .groupBy(documents.id)
    .orderBy(desc(documents.createdAt));
}

export async function replaceDocumentChunks(documentId: number, chunks: TextChunk[], embeddings: number[][]) {
  if (chunks.length !== embeddings.length) {
    throw new Error(
      `Chunk and embedding counts must match. Received ${chunks.length} chunks and ${embeddings.length} embeddings.`,
    );
  }

  await db.transaction(async (tx) => {
    await tx.delete(documentChunks).where(eq(documentChunks.documentId, documentId));

    if (chunks.length === 0) {
      return;
    }

    await tx.insert(documentChunks).values(
      chunks.map((chunk) => ({
        documentId,
        chunkIndex: chunk.index,
        content: chunk.content,
        tokenCount: chunk.tokenCount,
        metadata: chunk.metadata,
        embedding: embeddings[chunk.index] ?? [],
      })),
    );
  });
}

export async function updateDocumentStatus(input: {
  documentId: number;
  status: "uploaded" | "queued" | "processing" | "processed" | "failed";
  lastIngestedAt?: Date;
  metadata?: Record<string, unknown>;
}) {
  const updatePayload: {
    status: "uploaded" | "queued" | "processing" | "processed" | "failed";
    updatedAt: Date;
    lastIngestedAt?: Date;
    metadata?: Record<string, unknown>;
  } = {
    status: input.status,
    updatedAt: new Date(),
  };

  if (input.lastIngestedAt) {
    updatePayload.lastIngestedAt = input.lastIngestedAt;
  }

  if (input.metadata) {
    updatePayload.metadata = input.metadata;
  }

  const [document] = await db
    .update(documents)
    .set(updatePayload)
    .where(eq(documents.id, input.documentId))
    .returning();

  return document;
}

export async function countDashboardStats(userId: number) {
  const [documentCount] = await db
    .select({ value: count(documents.id) })
    .from(documents)
    .where(eq(documents.ownerId, userId));

  const [jobCount] = await db
    .select({ value: count(ingestionJobs.id) })
    .from(ingestionJobs)
    .where(eq(ingestionJobs.createdByUserId, userId));

  const [processedDocumentCount] = await db
    .select({ value: count(documents.id) })
    .from(documents)
    .where(and(eq(documents.ownerId, userId), eq(documents.status, "processed")));

  return {
    documentCount: documentCount?.value ?? 0,
    ingestionJobCount: jobCount?.value ?? 0,
    processedDocumentCount: processedDocumentCount?.value ?? 0,
  };
}

export async function ensureDocumentsBelongToUser(userId: number, documentIds: number[]) {
  if (documentIds.length === 0) {
    return true;
  }

  const rows = await db
    .select({ id: documents.id })
    .from(documents)
    .where(and(eq(documents.ownerId, userId), inArray(documents.id, documentIds)));

  return rows.length === documentIds.length;
}
