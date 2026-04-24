import { vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createDocument: vi.fn(),
  createIngestionJob: vi.fn(),
  getObjectStorageService: vi.fn(),
  computeSha256Hex: vi.fn(),
  createDocumentStorageKey: vi.fn(),
  sanitizeFilename: vi.fn(),
}));

vi.mock("@/lib/services/documents/repository", () => ({
  createDocument: mocks.createDocument,
}));

vi.mock("@/lib/services/ingestion/jobs", () => ({
  createIngestionJob: mocks.createIngestionJob,
}));

vi.mock("@/server/storage", () => ({
  getObjectStorageService: mocks.getObjectStorageService,
  computeSha256Hex: mocks.computeSha256Hex,
  createDocumentStorageKey: mocks.createDocumentStorageKey,
  sanitizeFilename: mocks.sanitizeFilename,
}));

import { enqueueIngestionJob } from "@/lib/services/ingestion/service";

describe("enqueueIngestionJob", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("stores text content and creates a queued ingestion job", async () => {
    const storage = {
      putObject: vi.fn().mockResolvedValue({
        backend: "local",
        key: "documents/user-1/support-notes.txt",
        originalFilename: "Support notes.txt",
        contentType: "text/plain",
        byteSize: 18,
        checksum: "sha-text",
      }),
    };

    mocks.getObjectStorageService.mockReturnValue(storage);
    mocks.computeSha256Hex.mockReturnValue("sha-text");
    mocks.createDocumentStorageKey.mockReturnValue("documents/user-1/support-notes.pdf");
    mocks.sanitizeFilename.mockImplementation((value: string) => value);
    mocks.createDocument.mockResolvedValue({ id: "doc-1" });
    mocks.createIngestionJob.mockResolvedValue({ id: "job-1" });

    const result = await enqueueIngestionJob("user-1", {
      title: "Support notes",
      content: "hello from support",
      mimeType: "text/plain",
      metadata: { source: "manual" },
    });

    expect(storage.putObject).toHaveBeenCalledWith({
      key: "documents/user-1/support-notes.txt",
      body: Buffer.from("hello from support", "utf8"),
      originalFilename: "Support notes.txt",
      contentType: "text/plain",
      checksum: "sha-text",
    });
    expect(mocks.createDocument).toHaveBeenCalledWith({
      ownerId: "user-1",
      title: "Support notes",
      originalFilename: "Support notes.txt",
      storageBackend: "local",
      storageKey: "documents/user-1/support-notes.txt",
      contentType: "text/plain",
      byteSize: 18,
      checksum: "sha-text",
      status: "queued",
      metadata: { source: "manual" },
    });
    expect(mocks.createIngestionJob).toHaveBeenCalledWith({
      documentId: "doc-1",
      createdByUserId: "user-1",
    });
    expect(result).toEqual({
      document: { id: "doc-1" },
      job: { id: "job-1" },
    });
  });

  it("stores json content with a json extension", async () => {
    const storage = {
      putObject: vi.fn().mockResolvedValue({
        backend: "local",
        key: "documents/user-1/export.json",
        originalFilename: "Export.json",
        contentType: "application/json",
        byteSize: 14,
        checksum: "sha-json",
      }),
    };

    mocks.getObjectStorageService.mockReturnValue(storage);
    mocks.computeSha256Hex.mockReturnValue("sha-json");
    mocks.createDocumentStorageKey.mockReturnValue("documents/user-1/export.pdf");
    mocks.sanitizeFilename.mockImplementation((value: string) => value);
    mocks.createDocument.mockResolvedValue({ id: "doc-2" });
    mocks.createIngestionJob.mockResolvedValue({ id: "job-2" });

    await enqueueIngestionJob("user-1", {
      title: "Export",
      content: '{"ok": true }',
      mimeType: "application/json",
    });

    expect(storage.putObject).toHaveBeenCalledWith(
      expect.objectContaining({
        key: "documents/user-1/export.json",
        originalFilename: "Export.json",
        contentType: "application/json",
      }),
    );
  });
});
