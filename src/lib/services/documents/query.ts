import "server-only";

import { and, eq, inArray, sql } from "drizzle-orm";

import { db } from "@/db/client";
import { documentChunks, documents } from "@/db/schema";
import { env } from "@/lib/env";
import { createOpenAIService } from "@/lib/services/openai/service";
import type { QueryResultChunk } from "@/types/ingestion";

export async function queryDocumentChunks(input: {
  userId: string;
  question: string;
  documentIds?: string[];
}): Promise<QueryResultChunk[]> {
  const openAI = createOpenAIService();
  const [embedding] = await openAI.createEmbeddings([input.question]);

  if (!embedding) {
    throw new Error("Failed to generate a query embedding.");
  }

  const embeddingLiteral = `[${embedding.join(",")}]`;

  const rows = await db
    .select({
      id: documentChunks.id,
      documentId: documentChunks.documentId,
      content: documentChunks.content,
      score: sql<number>`1 - (${documentChunks.embedding} <=> ${embeddingLiteral}::vector)`.mapWith(Number),
    })
    .from(documentChunks)
    .innerJoin(documents, eq(documentChunks.documentId, documents.id))
    .where(
      and(
        eq(documents.ownerId, input.userId),
        input.documentIds?.length
          ? inArray(documentChunks.documentId, input.documentIds)
          : undefined,
      ),
    )
    .orderBy(sql`${documentChunks.embedding} <=> ${embeddingLiteral}::vector`)
    .limit(env.INGESTION_QUERY_MATCH_LIMIT);

  return rows;
}

export async function generateAnswerFromDocuments(input: {
  userId: string;
  question: string;
  documentIds?: string[];
}) {
  const matches = await queryDocumentChunks(input);

  if (matches.length === 0) {
    return {
      answer:
        "No indexed chunks matched this question yet. Add a document and let the ingestion worker process it first.",
      matches: [],
    };
  }

  const openAI = createOpenAIService();
  const context = matches
    .map(
      (match, index) =>
        `Source ${index + 1} (document ${match.documentId}, score ${match.score.toFixed(3)}):\n${match.content}`,
    )
    .join("\n\n");

  const answer = await openAI.generateText({
    instructions:
      "Answer only from the supplied document context. If the context is insufficient, say so clearly.",
    input: `Question:\n${input.question}\n\nContext:\n${context}`,
  });

  return {
    answer,
    matches,
  };
}
