import { and, asc, eq, sql } from "drizzle-orm";
import type { PoolClient } from "pg";

import { db, pool } from "@/db/client";
import { documentChatJobs, documentChatMessages } from "@/db/schema";
import type { QueryResultChunk } from "@/types/ingestion";

export type DocumentChatRole = typeof documentChatMessages.$inferSelect["role"];
export type DocumentChatJob = typeof documentChatJobs.$inferSelect;

export const DOCUMENT_CHAT_EVENTS_CHANNEL = "document_chat_events";

export type DocumentChatCompletedEvent = {
  type: "chat.completed";
  jobId: number;
  documentId: number;
  userId: number;
  message: {
    id: number;
    role: "assistant";
    content: string;
    createdAt: string;
  };
  matches: QueryResultChunk[];
};

export type DocumentChatFailedEvent = {
  type: "chat.failed";
  jobId: number;
  documentId: number;
  userId: number;
  error: string;
};

export type DocumentChatEvent =
  | DocumentChatCompletedEvent
  | DocumentChatFailedEvent;

export type ClaimedDocumentChatJob = DocumentChatJob & {
  question: string;
};

function mapClaimedChatJobRow(row: Record<string, unknown>): ClaimedDocumentChatJob {
  return {
    id: row.id as number,
    documentId: row.document_id as number,
    userId: row.user_id as number,
    userMessageId: row.user_message_id as number,
    status: row.status as DocumentChatJob["status"],
    error: (row.error as string | null | undefined) ?? null,
    createdAt: row.created_at as Date,
    startedAt: (row.started_at as Date | null | undefined) ?? null,
    completedAt: (row.completed_at as Date | null | undefined) ?? null,
    question: row.question as string,
  };
}

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

export async function createDocumentChatJob(input: {
  documentId: number;
  userId: number;
  userMessageId: number;
}) {
  const [job] = await db
    .insert(documentChatJobs)
    .values({
      documentId: input.documentId,
      userId: input.userId,
      userMessageId: input.userMessageId,
    })
    .returning();

  if (!job) {
    throw new Error("Failed to create chat job.");
  }

  return job;
}

export async function claimNextDocumentChatJob() {
  const result = await db.execute(sql`
    with next_job as (
      select document_chat_jobs.id, user_message.content as question
      from document_chat_jobs
      inner join document_chat_messages user_message
        on user_message.id = document_chat_jobs.user_message_id
      where document_chat_jobs.status = 'queued'
      order by document_chat_jobs.created_at asc
      for update of document_chat_jobs skip locked
      limit 1
    )
    update document_chat_jobs
    set
      status = 'processing',
      error = null,
      started_at = now()
    from next_job
    where document_chat_jobs.id = next_job.id
    returning document_chat_jobs.*, next_job.question;
  `);

  const row = result.rows[0] as Record<string, unknown> | undefined;

  return row ? mapClaimedChatJobRow(row) : null;
}

export async function completeDocumentChatJob(jobId: number) {
  const [job] = await db
    .update(documentChatJobs)
    .set({
      status: "completed",
      error: null,
      completedAt: new Date(),
    })
    .where(eq(documentChatJobs.id, jobId))
    .returning();

  return job ?? null;
}

export async function failDocumentChatJob(jobId: number, error: string) {
  const [job] = await db
    .update(documentChatJobs)
    .set({
      status: "failed",
      error,
      completedAt: new Date(),
    })
    .where(eq(documentChatJobs.id, jobId))
    .returning();

  return job ?? null;
}

export async function publishDocumentChatEvent(event: DocumentChatEvent) {
  await pool.query("SELECT pg_notify($1, $2)", [
    DOCUMENT_CHAT_EVENTS_CHANNEL,
    JSON.stringify(event),
  ]);
}

export async function subscribeToDocumentChatEvents(
  onEvent: (event: DocumentChatEvent) => void,
) {
  const client = await pool.connect();

  client.on("notification", (message) => {
    if (
      message.channel !== DOCUMENT_CHAT_EVENTS_CHANNEL ||
      typeof message.payload !== "string"
    ) {
      return;
    }

    try {
      onEvent(JSON.parse(message.payload) as DocumentChatEvent);
    } catch (error) {
      console.error("Failed to parse document chat event.", error);
    }
  });

  await client.query(`LISTEN ${DOCUMENT_CHAT_EVENTS_CHANNEL}`);

  return {
    client,
    async close() {
      await closeDocumentChatEventSubscription(client);
    },
  };
}

async function closeDocumentChatEventSubscription(client: PoolClient) {
  try {
    await client.query(`UNLISTEN ${DOCUMENT_CHAT_EVENTS_CHANNEL}`);
  } finally {
    client.release();
  }
}
