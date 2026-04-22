import {
  getDocumentById,
  replaceDocumentChunks,
  updateDocumentStatus,
} from "@/lib/services/documents/repository";
import {
  completeIngestionJob,
  failIngestionJob,
} from "@/lib/services/ingestion/jobs";
import { chunkText } from "@/lib/services/ingestion/chunking";
import { TextExtractionService } from "@/lib/services/ingestion/extractor";
import type { OpenAIService } from "@/lib/services/openai/service";
import {
  getObjectStorageService,
  StorageObjectNotFoundError,
  type ObjectStorageService,
} from "@/server/storage";

export class IngestionProcessor {
  constructor(
    private readonly dependencies: {
      extractor: TextExtractionService;
      openAI: OpenAIService;
      storage?: ObjectStorageService;
    },
  ) {}

  async process(job: {
    id: string;
    documentId: string;
  }): Promise<{ chunkCount: number }> {
    const storage = this.dependencies.storage ?? getObjectStorageService();
    const document = await getDocumentById(job.documentId);

    if (!document) {
      await failIngestionJob(job.id, `Document ${job.documentId} was not found.`, {
        retryable: false,
      });
      throw new Error(`Document ${job.documentId} was not found.`);
    }

    await updateDocumentStatus({
      documentId: document.id,
      status: "processing",
    });

    try {
      const source = await storage.getObjectBuffer(document.storageKey);
      const extracted = await this.dependencies.extractor.extract({
        body: source,
        contentType: document.contentType,
        objectKey: document.storageKey,
      });
      const chunks = chunkText(extracted.text);
      const embeddings = await this.dependencies.openAI.createEmbeddings(
        chunks.map((chunk) => chunk.content),
      );

      await replaceDocumentChunks(document.id, chunks, embeddings);
      await updateDocumentStatus({
        documentId: document.id,
        status: "processed",
        lastIngestedAt: new Date(),
      });
      await completeIngestionJob(job.id);

      return { chunkCount: chunks.length };
    } catch (error) {
      const failedJob = await failIngestionJob(
        job.id,
        error instanceof Error ? error.message : "Unknown ingestion error",
        {
          retryable: !(error instanceof StorageObjectNotFoundError),
        },
      );

      await updateDocumentStatus({
        documentId: document.id,
        status: failedJob?.willRetry ? "queued" : "failed",
      });
      throw error;
    }
  }
}
