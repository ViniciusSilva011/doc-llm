import { eq } from "drizzle-orm";
import { vi } from "vitest";

import { db } from "@/db/client";
import { documents, ingestionJobs, users } from "@/db/schema";
import { getSeededUser } from "../../helpers/db";
import { createPdfFile, createTextFile } from "../../helpers/files";
import { getTestRequestUrl } from "../../helpers/test-env";

const requireApiSessionMock = vi.hoisted(() => vi.fn());
const storageFixture = vi.hoisted(() => ({
  storage: {
    backend: "local" as const,
    putObject: vi.fn(
      async ({
        key,
        body,
        contentType,
        originalFilename,
        checksum,
      }: {
        key: string;
        body: Buffer;
        contentType: string;
        originalFilename: string;
        checksum?: string;
      }) => ({
        backend: "local" as const,
        key,
        originalFilename,
        contentType,
        byteSize: body.byteLength,
        checksum: checksum ?? null,
      }),
    ),
    getObjectStream: vi.fn(),
    getObjectBuffer: vi.fn(),
    deleteObject: vi.fn(),
    exists: vi.fn(),
    getPublicUrl: vi.fn(() => null),
  },
}));

vi.mock("@/auth/session", () => ({
  UnauthorizedError: class UnauthorizedError extends Error {},
  requireApiSession: requireApiSessionMock,
}));

vi.mock("@/server/storage", async () => {
  const actual = await vi.importActual<typeof import("@/server/storage")>("@/server/storage");

  return {
    ...actual,
    getObjectStorageService: () => storageFixture.storage,
  };
});

import { POST } from "@/app/api/documents/upload/route";

describe("POST /api/documents/upload", () => {
  it("returns 401 for unauthenticated uploads", async () => {
    const UnauthorizedError = (await import("@/auth/session")).UnauthorizedError;
    requireApiSessionMock.mockRejectedValue(new UnauthorizedError("Authentication required"));

    const formData = new FormData();
    formData.append("file", createPdfFile());

    const response = await POST(
      new Request(getTestRequestUrl("/api/documents/upload"), {
        method: "POST",
        body: formData,
      }),
    );

    expect(response.status).toBe(401);
  });

  it("stores uploaded pdfs and creates queued document records", async () => {
    const seededUser = await getSeededUser();
    requireApiSessionMock.mockResolvedValue({
      user: {
        id: seededUser.id,
        email: seededUser.email,
        role: seededUser.role,
      },
    });

    const formData = new FormData();
    formData.append("title", "  Strategy memo  ");
    formData.append("file", createPdfFile("strategy-memo.pdf"));

    const response = await POST(
      new Request(getTestRequestUrl("/api/documents/upload"), {
        method: "POST",
        body: formData,
      }),
    );

    expect(response.status).toBe(201);

    const payload = (await response.json()) as {
      documentId: number;
      filename: string;
      status: string;
      backend: string;
    };

    const [document] = await db
      .select()
      .from(documents)
      .where(eq(documents.id, payload.documentId))
      .limit(1);
    const [job] = await db
      .select()
      .from(ingestionJobs)
      .where(eq(ingestionJobs.documentId, payload.documentId))
      .limit(1);

    expect(payload.status).toBe("queued");
    expect(payload.backend).toBe("local");
    expect(document?.title).toBe("Strategy memo");
    expect(document?.originalFilename).toBe("strategy-memo.pdf");
    expect(document?.storageBackend).toBe("local");
    expect(document?.status).toBe("queued");
    expect(job?.status).toBe("pending");
    expect(storageFixture.storage.putObject).toHaveBeenCalledTimes(1);
  });

  it("defaults blank titles to the uploaded pdf filename stem", async () => {
    const seededUser = await getSeededUser();
    requireApiSessionMock.mockResolvedValue({
      user: {
        id: seededUser.id,
        email: seededUser.email,
        role: seededUser.role,
      },
    });

    const formData = new FormData();
    formData.append("title", "   ");
    formData.append("file", createPdfFile("quarterly-report.pdf"));

    const response = await POST(
      new Request(getTestRequestUrl("/api/documents/upload"), {
        method: "POST",
        body: formData,
      }),
    );

    expect(response.status).toBe(201);

    const payload = (await response.json()) as { documentId: number };
    const [document] = await db
      .select()
      .from(documents)
      .where(eq(documents.id, payload.documentId))
      .limit(1);

    expect(document?.title).toBe("quarterly-report");
  });

  it("rejects duplicate document titles for the same user", async () => {
    const seededUser = await getSeededUser();
    requireApiSessionMock.mockResolvedValue({
      user: {
        id: seededUser.id,
        email: seededUser.email,
        role: seededUser.role,
      },
    });

    const firstFormData = new FormData();
    firstFormData.append("title", "Strategy memo");
    firstFormData.append("file", createPdfFile("strategy-memo.pdf"));

    const firstResponse = await POST(
      new Request(getTestRequestUrl("/api/documents/upload"), {
        method: "POST",
        body: firstFormData,
      }),
    );

    expect(firstResponse.status).toBe(201);

    const duplicateFormData = new FormData();
    duplicateFormData.append("title", "Strategy memo");
    duplicateFormData.append("file", createPdfFile("strategy-memo-copy.pdf"));

    const duplicateResponse = await POST(
      new Request(getTestRequestUrl("/api/documents/upload"), {
        method: "POST",
        body: duplicateFormData,
      }),
    );

    expect(duplicateResponse.status).toBe(400);
    await expect(duplicateResponse.json()).resolves.toEqual({
      error: "A document with this title already exists.",
    });
    expect(storageFixture.storage.putObject).toHaveBeenCalledTimes(1);
  });

  it("rejects case-insensitive duplicate document titles for the same user", async () => {
    const seededUser = await getSeededUser();
    requireApiSessionMock.mockResolvedValue({
      user: {
        id: seededUser.id,
        email: seededUser.email,
        role: seededUser.role,
      },
    });

    const firstFormData = new FormData();
    firstFormData.append("title", "Report");
    firstFormData.append("file", createPdfFile("report.pdf"));

    const firstResponse = await POST(
      new Request(getTestRequestUrl("/api/documents/upload"), {
        method: "POST",
        body: firstFormData,
      }),
    );

    expect(firstResponse.status).toBe(201);

    const duplicateFormData = new FormData();
    duplicateFormData.append("title", "report");
    duplicateFormData.append("file", createPdfFile("report-copy.pdf"));

    const duplicateResponse = await POST(
      new Request(getTestRequestUrl("/api/documents/upload"), {
        method: "POST",
        body: duplicateFormData,
      }),
    );

    expect(duplicateResponse.status).toBe(400);
    await expect(duplicateResponse.json()).resolves.toEqual({
      error: "A document with this title already exists.",
    });
  });

  it("allows the same document title for different users", async () => {
    const seededUser = await getSeededUser();
    const [otherUser] = await db
      .insert(users)
      .values({
        name: "Other User",
        email: "other@example.com",
        role: "user",
        updatedAt: new Date(),
      })
      .returning();

    if (!otherUser) {
      throw new Error("Failed to create second test user.");
    }

    requireApiSessionMock
      .mockResolvedValueOnce({
        user: {
          id: seededUser.id,
          email: seededUser.email,
          role: seededUser.role,
        },
      })
      .mockResolvedValueOnce({
        user: {
          id: otherUser.id,
          email: otherUser.email,
          role: otherUser.role,
        },
      });

    const firstFormData = new FormData();
    firstFormData.append("title", "Shared report");
    firstFormData.append("file", createPdfFile("shared-report.pdf"));

    const firstResponse = await POST(
      new Request(getTestRequestUrl("/api/documents/upload"), {
        method: "POST",
        body: firstFormData,
      }),
    );

    const secondFormData = new FormData();
    secondFormData.append("title", "Shared report");
    secondFormData.append("file", createPdfFile("shared-report.pdf"));

    const secondResponse = await POST(
      new Request(getTestRequestUrl("/api/documents/upload"), {
        method: "POST",
        body: secondFormData,
      }),
    );

    expect(firstResponse.status).toBe(201);
    expect(secondResponse.status).toBe(201);
  });

  it("rejects invalid uploads with a 400 response", async () => {
    const seededUser = await getSeededUser();
    requireApiSessionMock.mockResolvedValue({
      user: {
        id: seededUser.id,
        email: seededUser.email,
        role: seededUser.role,
      },
    });

    const formData = new FormData();
    formData.append("file", createTextFile());

    const response = await POST(
      new Request(getTestRequestUrl("/api/documents/upload"), {
        method: "POST",
        body: formData,
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringMatching(/PDF|application\/pdf/),
    });
  });

  it("returns a safe 500 response when storage fails", async () => {
    const seededUser = await getSeededUser();
    requireApiSessionMock.mockResolvedValue({
      user: {
        id: seededUser.id,
        email: seededUser.email,
        role: seededUser.role,
      },
    });
    storageFixture.storage.putObject.mockRejectedValueOnce(new Error("storage unavailable"));

    const formData = new FormData();
    formData.append("file", createPdfFile());

    const response = await POST(
      new Request(getTestRequestUrl("/api/documents/upload"), {
        method: "POST",
        body: formData,
      }),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "An unexpected server error occurred",
    });
  });
});
