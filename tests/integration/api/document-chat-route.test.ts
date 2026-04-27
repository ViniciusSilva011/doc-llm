import { eq } from "drizzle-orm";
import { vi } from "vitest";

import { db } from "@/db/client";
import {
  documentChatJobs,
  documentChatMessages,
  documents,
  users,
} from "@/db/schema";
import {
  claimNextDocumentChatJob,
  createDocumentChatJob,
  createDocumentChatMessage,
  listDocumentChatMessages,
} from "@/lib/services/documents/chat";
import { getSeededUser } from "../../helpers/db";
import { getTestRequestUrl } from "../../helpers/test-env";

const requireApiSessionMock = vi.hoisted(() => vi.fn());
const generateAnswerFromDocumentsMock = vi.hoisted(() => vi.fn());

vi.mock("@/auth/session", () => ({
  UnauthorizedError: class UnauthorizedError extends Error {},
  requireApiSession: requireApiSessionMock,
}));

vi.mock("@/lib/services/documents/query", () => ({
  generateAnswerFromDocuments: generateAnswerFromDocumentsMock,
}));

import { POST } from "@/app/api/documents/[id]/chat/route";

describe("POST /api/documents/[id]/chat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects chats for documents owned by another user", async () => {
    const seededUser = await getSeededUser();
    requireApiSessionMock.mockResolvedValue({
      user: {
        id: seededUser.id,
        email: seededUser.email,
        role: seededUser.role,
      },
    });

    const [otherUser] = await db
      .insert(users)
      .values({
        email: "chat-owner@example.com",
        role: "user",
      })
      .returning();

    if (!otherUser) {
      throw new Error("Failed to create secondary user.");
    }

    const [document] = await db
      .insert(documents)
      .values({
        ownerId: otherUser.id,
        title: "Foreign PDF",
        originalFilename: "foreign.pdf",
        status: "processed",
        storageBackend: "local",
        storageKey: "documents/foreign.pdf",
        contentType: "application/pdf",
        byteSize: 512,
      })
      .returning();

    if (!document) {
      throw new Error("Failed to create foreign document.");
    }

    const response = await POST(
      new Request(getTestRequestUrl(`/api/documents/${document.id}/chat`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: "What is this about?" }),
      }),
      { params: Promise.resolve({ id: String(document.id) }) },
    );

    expect(response.status).toBe(404);
    expect(generateAnswerFromDocumentsMock).not.toHaveBeenCalled();
  });

  it("persists a user message and queues a chat job for an owned processed document", async () => {
    const seededUser = await getSeededUser();
    requireApiSessionMock.mockResolvedValue({
      user: {
        id: seededUser.id,
        email: seededUser.email,
        role: seededUser.role,
      },
    });

    const [document] = await db
      .insert(documents)
      .values({
        ownerId: seededUser.id,
        title: "Owned PDF",
        originalFilename: "owned.pdf",
        status: "processed",
        storageBackend: "local",
        storageKey: "documents/owned.pdf",
        contentType: "application/pdf",
        byteSize: 512,
      })
      .returning();

    if (!document) {
      throw new Error("Failed to create owned document.");
    }

    const response = await POST(
      new Request(getTestRequestUrl(`/api/documents/${document.id}/chat`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: "Summarize it." }),
      }),
      { params: Promise.resolve({ id: String(document.id) }) },
    );

    const payload = (await response.json()) as {
      jobId: number;
      message: { id: number; role: string; content: string };
    };

    expect(response.status).toBe(200);
    expect(payload.message).toMatchObject({
      role: "user",
      content: "Summarize it.",
    });
    expect(generateAnswerFromDocumentsMock).not.toHaveBeenCalled();

    const messages = await db
      .select()
      .from(documentChatMessages)
      .orderBy(documentChatMessages.id);

    expect(messages).toEqual([
      expect.objectContaining({
        documentId: document.id,
        userId: seededUser.id,
        role: "user",
        content: "Summarize it.",
      }),
    ]);

    const [job] = await db
      .select()
      .from(documentChatJobs)
      .where(eq(documentChatJobs.id, payload.jobId))
      .limit(1);

    expect(job).toMatchObject({
      documentId: document.id,
      userId: seededUser.id,
      userMessageId: payload.message.id,
      status: "queued",
    });
  });

  it("returns prior messages ordered by creation time and id", async () => {
    const seededUser = await getSeededUser();
    const [document] = await db
      .insert(documents)
      .values({
        ownerId: seededUser.id,
        title: "Ordered PDF",
        originalFilename: "ordered.pdf",
        status: "processed",
        storageBackend: "local",
        storageKey: "documents/ordered.pdf",
        contentType: "application/pdf",
        byteSize: 512,
      })
      .returning();

    if (!document) {
      throw new Error("Failed to create ordered document.");
    }

    await db.insert(documentChatMessages).values([
      {
        documentId: document.id,
        userId: seededUser.id,
        role: "user",
        content: "First",
      },
      {
        documentId: document.id,
        userId: seededUser.id,
        role: "assistant",
        content: "Second",
      },
    ]);

    const messages = await listDocumentChatMessages({
      documentId: document.id,
      userId: seededUser.id,
    });

    expect(messages.map((message) => message.content)).toEqual([
      "First",
      "Second",
    ]);
  });

  it("claims queued chat jobs without returning the same job twice", async () => {
    const seededUser = await getSeededUser();
    const [document] = await db
      .insert(documents)
      .values({
        ownerId: seededUser.id,
        title: "Claim PDF",
        originalFilename: "claim.pdf",
        status: "processed",
        storageBackend: "local",
        storageKey: "documents/claim.pdf",
        contentType: "application/pdf",
        byteSize: 512,
      })
      .returning();

    if (!document) {
      throw new Error("Failed to create claim document.");
    }

    const firstMessage = await createDocumentChatMessage({
      documentId: document.id,
      userId: seededUser.id,
      role: "user",
      content: "First question",
    });
    const secondMessage = await createDocumentChatMessage({
      documentId: document.id,
      userId: seededUser.id,
      role: "user",
      content: "Second question",
    });

    await createDocumentChatJob({
      documentId: document.id,
      userId: seededUser.id,
      userMessageId: firstMessage.id,
    });
    await createDocumentChatJob({
      documentId: document.id,
      userId: seededUser.id,
      userMessageId: secondMessage.id,
    });

    const claimedJobs = await Promise.all([
      claimNextDocumentChatJob(),
      claimNextDocumentChatJob(),
    ]);

    expect(new Set(claimedJobs.map((job) => job?.id)).size).toBe(2);
    expect(claimedJobs.map((job) => job?.status)).toEqual([
      "processing",
      "processing",
    ]);
    expect(claimedJobs.map((job) => job?.question).sort()).toEqual([
      "First question",
      "Second question",
    ]);
  });
});
