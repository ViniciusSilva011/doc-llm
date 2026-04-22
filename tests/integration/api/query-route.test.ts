import { vi } from "vitest";

import { db } from "@/db/client";
import { documents, users } from "@/db/schema";
import { getSeededUser } from "../../helpers/db";

const requireApiSessionMock = vi.hoisted(() => vi.fn());
const generateAnswerFromDocumentsMock = vi.hoisted(() => vi.fn());

vi.mock("@/auth/session", () => ({
  UnauthorizedError: class UnauthorizedError extends Error {},
  requireApiSession: requireApiSessionMock,
}));

vi.mock("@/lib/services/documents/query", () => ({
  generateAnswerFromDocuments: generateAnswerFromDocumentsMock,
}));

import { POST } from "@/app/api/query/route";

describe("POST /api/query", () => {
  it("rejects document IDs owned by another user", async () => {
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
        email: "other@example.com",
        role: "user",
      })
      .returning();

    if (!otherUser) {
      throw new Error("Failed to create the secondary user.");
    }

    const [foreignDocument] = await db
      .insert(documents)
      .values({
        ownerId: otherUser.id,
        title: "Other team doc",
        originalFilename: "other.pdf",
        storageBackend: "local",
        storageKey: "documents/other.pdf",
        contentType: "application/pdf",
        byteSize: 512,
      })
      .returning();

    if (!foreignDocument) {
      throw new Error("Failed to create the foreign document.");
    }

    const response = await POST(
      new Request("http://localhost/api/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: "What is in this document?",
          documentIds: [foreignDocument.id],
        }),
      }),
    );

    expect(response.status).toBe(403);
    expect(generateAnswerFromDocumentsMock).not.toHaveBeenCalled();
  });

  it("returns the generated answer for allowed documents", async () => {
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
        title: "Owned doc",
        originalFilename: "owned.pdf",
        storageBackend: "local",
        storageKey: "documents/owned.pdf",
        contentType: "application/pdf",
        byteSize: 512,
      })
      .returning();

    if (!document) {
      throw new Error("Failed to create the owned document.");
    }

    generateAnswerFromDocumentsMock.mockResolvedValue({
      answer: "Mock answer",
      matches: [],
    });

    const response = await POST(
      new Request("http://localhost/api/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: "Summarize the document.",
          documentIds: [document.id],
        }),
      }),
    );

    const payload = (await response.json()) as { answer: string };

    expect(response.status).toBe(200);
    expect(payload.answer).toBe("Mock answer");
  });
});
