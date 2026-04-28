import "server-only";

import { parse } from "node:path";

import { db } from "@/db/client";
import { documents, ingestionJobs } from "@/db/schema";
import {
  DocumentUploadProcessingError,
  DocumentUploadValidationError,
} from "@/server/documents/errors";
import { validatePdfUpload } from "@/server/documents/upload-validation";
import {
  computeSha256Hex,
  createDocumentStorageKey,
  getObjectStorageService,
} from "@/server/storage";
import { and, eq, sql } from "drizzle-orm";

function deriveTitleFromFilename(filename: string) {
  const stem = parse(filename).name.trim();
  return stem || "Uploaded document";
}

function resolveUploadTitle(input: { title?: string | undefined; filename: string }) {
  const title = input.title?.trim() || deriveTitleFromFilename(input.filename);

  if (title.length > 255) {
    throw new DocumentUploadValidationError("Document titles must be 255 characters or fewer.");
  }

  return title;
}

async function ensureTitleIsAvailable(ownerId: number, title: string) {
  const [existingDocument] = await db
    .select({ id: documents.id })
    .from(documents)
    .where(
      and(
        eq(documents.ownerId, ownerId),
        sql`lower(${documents.title}) = lower(${title})`,
      ),
    )
    .limit(1);

  if (existingDocument) {
    throw new DocumentUploadValidationError("A document with this title already exists.");
  }
}

function isDocumentTitleUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown; constraint?: unknown }).code === "23505" &&
    (error as { constraint?: unknown }).constraint ===
      "documents_owner_id_lower_title_unique_idx"
  );
}

export async function uploadPdfDocument(params: {
  ownerId: number;
  file: File;
  title?: string;
}) {
  const storage = getObjectStorageService();
  const validatedFile = validatePdfUpload({
    filename: params.file.name,
    contentType: params.file.type,
    byteSize: params.file.size,
  });
  const title = resolveUploadTitle({
    title: params.title,
    filename: validatedFile.originalFilename,
  });

  await ensureTitleIsAvailable(params.ownerId, title);

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
    await storage.deleteObject(storedObject.key).catch((cleanupError) => {
      console.error("Failed to clean up uploaded object after database error", {
        storageKey: storedObject.key,
        cleanupError,
      });
    });

    if (isDocumentTitleUniqueViolation(error)) {
      throw new DocumentUploadValidationError("A document with this title already exists.");
    }

    console.error("Failed to persist uploaded PDF document", {
      ownerId: params.ownerId,
      storageKey: storedObject.key,
      error,
    });

    throw error;
  }
}
