import { validatePdfUpload } from "@/server/documents/upload-validation";

describe("validatePdfUpload", () => {
  it("accepts valid pdf metadata", () => {
    expect(
      validatePdfUpload({
        filename: "report.pdf",
        contentType: "application/pdf",
        byteSize: 1024,
      }),
    ).toMatchObject({
      originalFilename: "report.pdf",
      contentType: "application/pdf",
    });
  });

  it("rejects non-pdf mime types", () => {
    expect(() =>
      validatePdfUpload({
        filename: "report.pdf",
        contentType: "text/plain",
        byteSize: 1024,
      }),
    ).toThrow(/application\/pdf/);
  });

  it("rejects invalid extensions", () => {
    expect(() =>
      validatePdfUpload({
        filename: "report.txt",
        contentType: "application/pdf",
        byteSize: 1024,
      }),
    ).toThrow(/Only PDF files are accepted/);
  });

  it("rejects empty files", () => {
    expect(() =>
      validatePdfUpload({
        filename: "report.pdf",
        contentType: "application/pdf",
        byteSize: 0,
      }),
    ).toThrow(/must not be empty/);
  });

  it("rejects oversized files", () => {
    expect(() =>
      validatePdfUpload({
        filename: "report.pdf",
        contentType: "application/pdf",
        byteSize: 30 * 1024 * 1024,
      }),
    ).toThrow(/bytes or smaller/);
  });
});
