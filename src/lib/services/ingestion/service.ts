import { createDocument } from "@/lib/services/documents/repository";
import { createIngestionJob } from "@/lib/services/ingestion/jobs";
import {
  computeSha256Hex,
  createDocumentStorageKey,
  getObjectStorageService,
  sanitizeFilename,
} from "@/server/storage";
import type { CreateIngestionJobInput } from "@/lib/validations/ingestion";

export async function enqueueIngestionJob(
  userId: number,
  input: CreateIngestionJobInput,
) {
  const storage = getObjectStorageService();
  const extension = input.mimeType.includes("json") ? "json" : "txt";
  const originalFilename = sanitizeFilename(`${input.title}.${extension}`);
  const objectKey = createDocumentStorageKey({
    ownerId: userId,
    originalFilename: `${originalFilename.replace(/\.[^.]+$/, "")}.pdf`,
  }).replace(/\.pdf$/, `.${extension}`);
  const body = Buffer.from(input.content, "utf8");
  const checksum = computeSha256Hex(body);

  const storedObject = await storage.putObject({
    key: objectKey,
    body,
    originalFilename,
    contentType: input.mimeType,
    checksum,
  });

  const document = await createDocument(
    input.metadata
      ? {
          ownerId: userId,
          title: input.title,
          originalFilename: storedObject.originalFilename,
          storageBackend: storedObject.backend,
          storageKey: storedObject.key,
          contentType: storedObject.contentType,
          byteSize: storedObject.byteSize,
          checksum,
          status: "queued",
          metadata: input.metadata,
        }
      : {
          ownerId: userId,
          title: input.title,
          originalFilename: storedObject.originalFilename,
          storageBackend: storedObject.backend,
          storageKey: storedObject.key,
          contentType: storedObject.contentType,
          byteSize: storedObject.byteSize,
          checksum,
          status: "queued",
        },
  );

  const job = await createIngestionJob({
    documentId: document.id,
    createdByUserId: userId,
  });

  return { document, job };
}
