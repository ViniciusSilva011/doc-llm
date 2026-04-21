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
import { createObjectStorage, type ObjectStorage } from "@/lib/services/storage";

export class IngestionProcessor {
  constructor(
    private readonly dependencies: {
      extractor: TextExtractionService;
      openAI: OpenAIService;
      storage?: ObjectStorage;
    },
  ) {}

  async process(job: {
    id: string;
    documentId: string;
  }): Promise<{ chunkCount: number }> {
    const storage = this.dependencies.storage ?? createObjectStorage();
    const document = await getDocumentById(job.documentId);

    if (!document) {
      throw new Error(`Document ${job.documentId} was not found.`);
    }

    await updateDocumentStatus({
      documentId: document.id,
      status: "processing",
    });

    try {
      const source = await storage.getObject(document.sourceObjectKey);
      const extracted = await this.dependencies.extractor.extract({
        body: source.body,
        contentType: source.contentType || document.sourceMimeType,
        objectKey: document.sourceObjectKey,
      });
      const chunks = chunkText(extracted.text);
      const embeddings = await this.dependencies.openAI.createEmbeddings(
        chunks.map((chunk) => chunk.content),
      );

      await replaceDocumentChunks(document.id, chunks, embeddings);
      await updateDocumentStatus({
        documentId: document.id,
        status: "ready",
        lastIngestedAt: new Date(),
      });
      await completeIngestionJob(job.id);

      return { chunkCount: chunks.length };
    } catch (error) {
      await updateDocumentStatus({
        documentId: document.id,
        status: "failed",
      });
      await failIngestionJob(
        job.id,
        error instanceof Error ? error.message : "Unknown ingestion error",
      );
      throw error;
    }
  }
}
