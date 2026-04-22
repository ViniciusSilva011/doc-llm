import { eq } from "drizzle-orm";
import { vi } from "vitest";

import { db } from "@/db/client";
import { documents, ingestionJobs } from "@/db/schema";
import { getSeededUser } from "../../helpers/db";
import { createPdfFile, createTextFile } from "../../helpers/files";

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
      new Request("http://localhost/api/documents/upload", {
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
    formData.append("title", "Strategy memo");
    formData.append("file", createPdfFile("strategy-memo.pdf"));

    const response = await POST(
      new Request("http://localhost/api/documents/upload", {
        method: "POST",
        body: formData,
      }),
    );

    expect(response.status).toBe(201);

    const payload = (await response.json()) as {
      documentId: string;
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
    expect(document?.originalFilename).toBe("strategy-memo.pdf");
    expect(document?.storageBackend).toBe("local");
    expect(document?.status).toBe("queued");
    expect(job?.status).toBe("pending");
    expect(storageFixture.storage.putObject).toHaveBeenCalledTimes(1);
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
      new Request("http://localhost/api/documents/upload", {
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
      new Request("http://localhost/api/documents/upload", {
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
