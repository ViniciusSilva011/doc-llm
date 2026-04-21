import { createHash, randomUUID } from "node:crypto";

import { createDocument } from "@/lib/services/documents/repository";
import { createIngestionJob } from "@/lib/services/ingestion/jobs";
import { createObjectStorage } from "@/lib/services/storage";
import type { CreateIngestionJobInput } from "@/lib/validations/ingestion";

export async function enqueueIngestionJob(
  userId: string,
  input: CreateIngestionJobInput,
) {
  const storage = createObjectStorage();
  const extension = input.mimeType.includes("json") ? "json" : "txt";
  const objectKey = storage.createObjectKey([
    "documents",
    userId,
    `${randomUUID()}.${extension}`,
  ]);
  const body = Buffer.from(input.content, "utf8");
  const checksum = createHash("sha256").update(body).digest("hex");

  await storage.putObject({
    key: objectKey,
    body,
    contentType: input.mimeType,
    metadata: {
      title: input.title,
      checksum,
    },
  });

  const document = await createDocument(
    input.metadata
      ? {
          ownerId: userId,
          title: input.title,
          sourceObjectKey: objectKey,
          sourceMimeType: input.mimeType,
          sourceChecksum: checksum,
          metadata: input.metadata,
        }
      : {
          ownerId: userId,
          title: input.title,
          sourceObjectKey: objectKey,
          sourceMimeType: input.mimeType,
          sourceChecksum: checksum,
        },
  );

  const job = await createIngestionJob({
    documentId: document.id,
    createdByUserId: userId,
  });

  return { document, job };
}
