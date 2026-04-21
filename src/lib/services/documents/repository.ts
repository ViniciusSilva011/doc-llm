import "server-only";

import { and, count, desc, eq, inArray, sql } from "drizzle-orm";

import { db } from "@/db/client";
import { documentChunks, documents, ingestionJobs } from "@/db/schema";
import type { TextChunk } from "@/types/ingestion";

export async function createDocument(input: {
  ownerId: string;
  title: string;
  sourceObjectKey: string;
  sourceMimeType: string;
  sourceChecksum?: string;
  metadata?: Record<string, unknown>;
}) {
  const [document] = await db
    .insert(documents)
    .values({
      ownerId: input.ownerId,
      title: input.title,
      sourceObjectKey: input.sourceObjectKey,
      sourceMimeType: input.sourceMimeType,
      sourceChecksum: input.sourceChecksum,
      metadata: input.metadata ?? {},
    })
    .returning();

  if (!document) {
    throw new Error("Failed to create document.");
  }

  return document;
}

export async function getDocumentById(documentId: string) {
  const [document] = await db
    .select()
    .from(documents)
    .where(eq(documents.id, documentId))
    .limit(1);

  return document ?? null;
}

export async function listDocumentsForUser(userId: string) {
  return db
    .select({
      id: documents.id,
      title: documents.title,
      status: documents.status,
      sourceMimeType: documents.sourceMimeType,
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

export async function replaceDocumentChunks(documentId: string, chunks: TextChunk[], embeddings: number[][]) {
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
  documentId: string;
  status: "pending" | "processing" | "ready" | "failed";
  lastIngestedAt?: Date;
}) {
  const updatePayload: {
    status: "pending" | "processing" | "ready" | "failed";
    updatedAt: Date;
    lastIngestedAt?: Date;
  } = {
    status: input.status,
    updatedAt: new Date(),
  };

  if (input.lastIngestedAt) {
    updatePayload.lastIngestedAt = input.lastIngestedAt;
  }

  const [document] = await db
    .update(documents)
    .set(updatePayload)
    .where(eq(documents.id, input.documentId))
    .returning();

  return document;
}

export async function countDashboardStats(userId: string) {
  const [documentCount] = await db
    .select({ value: count(documents.id) })
    .from(documents)
    .where(eq(documents.ownerId, userId));

  const [jobCount] = await db
    .select({ value: count(ingestionJobs.id) })
    .from(ingestionJobs)
    .where(eq(ingestionJobs.createdByUserId, userId));

  const [readyDocumentCount] = await db
    .select({ value: count(documents.id) })
    .from(documents)
    .where(and(eq(documents.ownerId, userId), eq(documents.status, "ready")));

  return {
    documentCount: documentCount?.value ?? 0,
    ingestionJobCount: jobCount?.value ?? 0,
    readyDocumentCount: readyDocumentCount?.value ?? 0,
  };
}

export async function ensureDocumentsBelongToUser(userId: string, documentIds: string[]) {
  if (documentIds.length === 0) {
    return true;
  }

  const rows = await db
    .select({ id: documents.id })
    .from(documents)
    .where(and(eq(documents.ownerId, userId), inArray(documents.id, documentIds)));

  return rows.length === documentIds.length;
}
