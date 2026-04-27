import { and, asc, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { documentChatMessages } from "@/db/schema";

export type DocumentChatRole = typeof documentChatMessages.$inferSelect["role"];

export async function listDocumentChatMessages(input: {
  documentId: number;
  userId: number;
}) {
  return db
    .select({
      id: documentChatMessages.id,
      role: documentChatMessages.role,
      content: documentChatMessages.content,
      createdAt: documentChatMessages.createdAt,
    })
    .from(documentChatMessages)
    .where(
      and(
        eq(documentChatMessages.documentId, input.documentId),
        eq(documentChatMessages.userId, input.userId),
      ),
    )
    .orderBy(asc(documentChatMessages.createdAt), asc(documentChatMessages.id));
}

export async function createDocumentChatMessage(input: {
  documentId: number;
  userId: number;
  role: DocumentChatRole;
  content: string;
}) {
  const [message] = await db
    .insert(documentChatMessages)
    .values({
      documentId: input.documentId,
      userId: input.userId,
      role: input.role,
      content: input.content,
    })
    .returning({
      id: documentChatMessages.id,
      role: documentChatMessages.role,
      content: documentChatMessages.content,
      createdAt: documentChatMessages.createdAt,
    });

  if (!message) {
    throw new Error("Failed to create chat message.");
  }

  return message;
}
