import { readFileSync } from "node:fs";
import path from "node:path";

let samplePdfBuffer: Buffer | undefined;

export function createPdfBuffer() {
  if (!samplePdfBuffer) {
    samplePdfBuffer = readFileSync(
      path.resolve(process.cwd(), "public", "demon_slayer_comments.pdf"),
    );
  }

  return Buffer.from(samplePdfBuffer);
}

export function createPdfFile(filename = "sample.pdf") {
  return new File([createPdfBuffer()], filename, {
    type: "application/pdf",
  });
}

export function createTextFile(
  filename = "sample.txt",
  content = "plain text",
) {
  return new File([Buffer.from(content, "utf8")], filename, {
    type: "text/plain",
  });
}
