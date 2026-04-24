import { vi } from "vitest";

const mocks = vi.hoisted(() => ({
  pdfParse: vi.fn(),
}));

vi.mock("@cedrugs/pdf-parse", () => ({
  default: mocks.pdfParse,
}));

import { TextExtractionService } from "@/lib/services/ingestion/extractor";

describe("TextExtractionService", () => {
  it("extracts trimmed text and metadata from pdf input", async () => {
    mocks.pdfParse.mockResolvedValue({
      text: "  Extracted pdf text  ",
      numpages: 3,
      info: { Title: "Memo" },
    });

    const service = new TextExtractionService();
    const result = await service.extract({
      body: Buffer.from("pdf-bytes", "utf8"),
      contentType: "application/pdf",
      objectKey: "documents/user-1/memo.pdf",
    });

    expect(mocks.pdfParse).toHaveBeenCalledWith(Buffer.from("pdf-bytes", "utf8"));
    expect(result).toEqual({
      text: "Extracted pdf text",
      metadata: {
        objectKey: "documents/user-1/memo.pdf",
        extractedAs: "pdf",
        pageCount: 3,
        info: { Title: "Memo" },
      },
    });
  });

  it("formats json content for ingestion", async () => {
    const service = new TextExtractionService();
    const result = await service.extract({
      body: Buffer.from(JSON.stringify({ title: "Memo", priority: 1 }), "utf8"),
      contentType: "application/json",
      objectKey: "documents/user-1/memo.json",
    });

    expect(result).toEqual({
      text: '{\n  "title": "Memo",\n  "priority": 1\n}',
      metadata: {
        objectKey: "documents/user-1/memo.json",
        extractedAs: "json",
      },
    });
  });

  it("passes through text content unchanged", async () => {
    const service = new TextExtractionService();
    const result = await service.extract({
      body: Buffer.from("plain text body", "utf8"),
      contentType: "text/plain",
      objectKey: "documents/user-1/notes.txt",
    });

    expect(result).toEqual({
      text: "plain text body",
      metadata: {
        objectKey: "documents/user-1/notes.txt",
        extractedAs: "text",
      },
    });
  });

  it("falls back to utf8 text for unsupported mime types", async () => {
    const service = new TextExtractionService();
    const result = await service.extract({
      body: Buffer.from("fallback body", "utf8"),
      contentType: "application/octet-stream",
      objectKey: "documents/user-1/blob.bin",
    });

    expect(result).toEqual({
      text: "fallback body",
      metadata: {
        objectKey: "documents/user-1/blob.bin",
        extractedAs: "fallback-text",
      },
    });
  });
});
