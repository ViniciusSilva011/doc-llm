import path from "node:path";

import { env } from "@/lib/env";
import { DocumentUploadValidationError } from "@/server/documents/errors";
import { sanitizeFilename } from "@/server/storage";

export interface UploadFileMetadata {
  filename: string;
  contentType: string;
  byteSize: number;
}

export interface ValidatedPdfUpload {
  originalFilename: string;
  contentType: "application/pdf";
  byteSize: number;
}

const ACCEPTED_PDF_MIME_TYPES = new Set(["application/pdf"]);

export function validatePdfUpload(input: UploadFileMetadata): ValidatedPdfUpload {
  const originalFilename = sanitizeFilename(input.filename);

  if (input.byteSize <= 0) {
    throw new DocumentUploadValidationError("Uploaded files must not be empty.");
  }

  if (input.byteSize > env.STORAGE_MAX_UPLOAD_SIZE_BYTES) {
    throw new DocumentUploadValidationError(
      `Uploaded files must be ${env.STORAGE_MAX_UPLOAD_SIZE_BYTES} bytes or smaller.`,
    );
  }

  if (path.extname(originalFilename).toLowerCase() !== ".pdf") {
    throw new DocumentUploadValidationError("Only PDF files are accepted.");
  }

  if (!ACCEPTED_PDF_MIME_TYPES.has(input.contentType)) {
    throw new DocumentUploadValidationError("The uploaded file must have MIME type application/pdf.");
  }

  return {
    originalFilename,
    contentType: "application/pdf",
    byteSize: input.byteSize,
  };
}
