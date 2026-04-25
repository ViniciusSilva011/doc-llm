import "server-only";

import { basename } from "node:path";

import { db } from "@/db/client";
import { documents, ingestionJobs } from "@/db/schema";
import { DocumentUploadProcessingError } from "@/server/documents/errors";
import { validatePdfUpload } from "@/server/documents/upload-validation";
import {
  computeSha256Hex,
  createDocumentStorageKey,
  getObjectStorageService,
} from "@/server/storage";

function deriveTitleFromFilename(filename: string) {
  const stem = basename(filename, ".pdf").replace(/[-_]+/g, " ").trim();
  return stem || "Uploaded document";
}

export async function uploadPdfDocument(params: {
  ownerId: string;
  file: File;
  title?: string;
}) {
  const storage = getObjectStorageService();
  const validatedFile = validatePdfUpload({
    filename: params.file.name,
    contentType: params.file.type,
    byteSize: params.file.size,
  });
  const body = Buffer.from(await params.file.arrayBuffer());
  const checksum = computeSha256Hex(body);
  const storageKey = createDocumentStorageKey({
    ownerId: params.ownerId,
    originalFilename: validatedFile.originalFilename,
  });

  const storedObject = await storage.putObject({
    key: storageKey,
    body,
    originalFilename: validatedFile.originalFilename,
    contentType: validatedFile.contentType,
    checksum,
  });

  try {
    const title = params.title?.trim() || deriveTitleFromFilename(validatedFile.originalFilename);
    const document = await db.transaction(async (tx) => {
      const [document] = await tx
        .insert(documents)
        .values({
          ownerId: params.ownerId,
          title,
          originalFilename: storedObject.originalFilename,
          status: "queued",
          storageBackend: storedObject.backend,
          storageKey: storedObject.key,
          contentType: storedObject.contentType,
          byteSize: storedObject.byteSize,
          checksum: storedObject.checksum ?? checksum,
          metadata: {
            uploadSource: "pdf-upload",
          },
        })
        .returning();

      if (!document) {
        throw new DocumentUploadProcessingError("The uploaded document record could not be created.");
      }

      const [job] = await tx
        .insert(ingestionJobs)
        .values({
          documentId: document.id,
          createdByUserId: params.ownerId,
        })
        .returning();

      if (!job) {
        throw new DocumentUploadProcessingError("The ingestion job could not be created.");
      }

      return document;
    });

    return {
      documentId: document.id,
      filename: storedObject.originalFilename,
      size: storedObject.byteSize,
      backend: storedObject.backend,
      status: "queued" as const,
    };
  } catch (error) {
    console.error("Failed to persist uploaded PDF document", {
      ownerId: params.ownerId,
      storageKey: storedObject.key,
      error,
    });

    await storage.deleteObject(storedObject.key).catch((cleanupError) => {
      console.error("Failed to clean up uploaded object after database error", {
        storageKey: storedObject.key,
        cleanupError,
      });
    });

    throw error;
  }
}
