import { eq } from "drizzle-orm";
import { vi } from "vitest";

import { db } from "@/db/client";
import { documentChatJobs, documentChatMessages, documents } from "@/db/schema";
import {
  claimNextDocumentChatJob,
  createDocumentChatJob,
  createDocumentChatMessage,
} from "@/lib/services/documents/chat";
import { DocumentChatJobProcessor } from "@/worker/chat-processor";
import { runWorkerIteration } from "@/worker/runner";
import { getSeededUser } from "../../helpers/db";

async function createProcessedDocument() {
  const seededUser = await getSeededUser();
  const [document] = await db
    .insert(documents)
    .values({
      ownerId: seededUser.id,
      title: "Worker Chat PDF",
      originalFilename: "worker-chat.pdf",
      status: "processed",
      storageBackend: "local",
      storageKey: "documents/worker-chat.pdf",
      contentType: "application/pdf",
      byteSize: 512,
    })
    .returning();

  if (!document) {
    throw new Error("Failed to create worker chat document.");
  }

  return {
    document,
    user: seededUser,
  };
}

describe("DocumentChatJobProcessor", () => {
  it("completes a queued chat job and stores an assistant message", async () => {
    const { document, user } = await createProcessedDocument();
    const userMessage = await createDocumentChatMessage({
      documentId: document.id,
      userId: user.id,
      role: "user",
      content: "What changed?",
    });
    const job = await createDocumentChatJob({
      documentId: document.id,
      userId: user.id,
      userMessageId: userMessage.id,
    });
    const publishEvent = vi.fn().mockResolvedValue(undefined);
    const generateAnswer = vi.fn().mockResolvedValue({
      answer: "The document changed its onboarding process.",
      matches: [
        {
          id: 11,
          documentId: document.id,
          content: "Onboarding process",
          score: 0.83,
        },
      ],
    });

    await expect(
      runWorkerIteration({
        claimNextPendingJob: claimNextDocumentChatJob,
        processor: new DocumentChatJobProcessor({
          generateAnswer,
          publishEvent,
        }),
        sleep: vi.fn().mockResolvedValue(undefined),
        pollIntervalMs: 10,
        logger: { info: vi.fn(), error: vi.fn() },
      }),
    ).resolves.toEqual({ status: "processed", jobId: job.id });

    const [updatedJob] = await db
      .select()
      .from(documentChatJobs)
      .where(eq(documentChatJobs.id, job.id))
      .limit(1);
    const messages = await db
      .select()
      .from(documentChatMessages)
      .orderBy(documentChatMessages.id);

    expect(updatedJob).toMatchObject({
      status: "completed",
      error: null,
    });
    expect(updatedJob?.completedAt).toBeInstanceOf(Date);
    expect(messages).toEqual([
      expect.objectContaining({
        role: "user",
        content: "What changed?",
      }),
      expect.objectContaining({
        role: "assistant",
        content: "The document changed its onboarding process.",
      }),
    ]);
    expect(generateAnswer).toHaveBeenCalledWith({
      userId: user.id,
      question: "What changed?",
      documentIds: [document.id],
    });
    expect(publishEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "chat.completed",
        jobId: job.id,
        documentId: document.id,
        userId: user.id,
        message: expect.objectContaining({
          role: "assistant",
          content: "The document changed its onboarding process.",
        }),
      }),
    );
  });

  it("marks failed jobs and publishes a failure event", async () => {
    const { document, user } = await createProcessedDocument();
    const userMessage = await createDocumentChatMessage({
      documentId: document.id,
      userId: user.id,
      role: "user",
      content: "Will this fail?",
    });
    const job = await createDocumentChatJob({
      documentId: document.id,
      userId: user.id,
      userMessageId: userMessage.id,
    });
    const publishEvent = vi.fn().mockResolvedValue(undefined);

    await expect(
      runWorkerIteration({
        claimNextPendingJob: claimNextDocumentChatJob,
        processor: new DocumentChatJobProcessor({
          generateAnswer: vi.fn().mockRejectedValue(new Error("LLM unavailable")),
          publishEvent,
        }),
        sleep: vi.fn().mockResolvedValue(undefined),
        pollIntervalMs: 10,
        logger: { info: vi.fn(), error: vi.fn() },
      }),
    ).resolves.toEqual({
      status: "failed",
      jobId: job.id,
      error: expect.any(Error),
    });

    const [updatedJob] = await db
      .select()
      .from(documentChatJobs)
      .where(eq(documentChatJobs.id, job.id))
      .limit(1);
    const messages = await db
      .select()
      .from(documentChatMessages)
      .orderBy(documentChatMessages.id);

    expect(updatedJob).toMatchObject({
      status: "failed",
      error: "LLM unavailable",
    });
    expect(messages).toHaveLength(1);
    expect(publishEvent).toHaveBeenCalledWith({
      type: "chat.failed",
      jobId: job.id,
      documentId: document.id,
      userId: user.id,
      error: "LLM unavailable",
    });
  });
});
