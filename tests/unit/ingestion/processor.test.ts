import { vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getDocumentById: vi.fn(),
  replaceDocumentChunks: vi.fn(),
  updateDocumentStatus: vi.fn(),
  completeIngestionJob: vi.fn(),
  failIngestionJob: vi.fn(),
}));

vi.mock("@/lib/services/documents/repository", () => ({
  getDocumentById: mocks.getDocumentById,
  replaceDocumentChunks: mocks.replaceDocumentChunks,
  updateDocumentStatus: mocks.updateDocumentStatus,
}));

vi.mock("@/lib/services/ingestion/jobs", () => ({
  completeIngestionJob: mocks.completeIngestionJob,
  failIngestionJob: mocks.failIngestionJob,
}));

import { IngestionProcessor } from "@/lib/services/ingestion/processor";

describe("IngestionProcessor", () => {
  it("fetches bytes through the storage abstraction", async () => {
    mocks.getDocumentById.mockResolvedValue({
      id: "doc-1",
      storageKey: "documents/user-1/file.pdf",
      contentType: "application/pdf",
    });
    mocks.replaceDocumentChunks.mockResolvedValue(undefined);
    mocks.updateDocumentStatus.mockResolvedValue(undefined);
    mocks.completeIngestionJob.mockResolvedValue(undefined);
    mocks.failIngestionJob.mockResolvedValue({ willRetry: false });

    const storage = {
      backend: "local" as const,
      putObject: vi.fn(),
      getObjectStream: vi.fn(),
      getObjectBuffer: vi.fn().mockResolvedValue(Buffer.from("pdf-bytes", "utf8")),
      deleteObject: vi.fn(),
      exists: vi.fn(),
      getPublicUrl: vi.fn(),
    };
    const extractor = {
      extract: vi.fn().mockResolvedValue({
        text: "Extracted text from pdf",
        metadata: {},
      }),
    };
    const openAI = {
      createEmbeddings: vi.fn().mockResolvedValue([Array.from({ length: 1536 }, () => 0.1)]),
    };

    const processor = new IngestionProcessor({
      storage,
      extractor: extractor as never,
      openAI: openAI as never,
    });

    await processor.process({
      id: "job-1",
      documentId: "doc-1",
    });

    expect(storage.getObjectBuffer).toHaveBeenCalledWith("documents/user-1/file.pdf");
    expect(extractor.extract).toHaveBeenCalled();
    expect(mocks.replaceDocumentChunks).toHaveBeenCalled();
  });
});
