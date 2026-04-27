import "dotenv/config";

import { env } from "@/lib/env";
import { claimNextDocumentChatJob } from "@/lib/services/documents/chat";
import { claimNextPendingJob } from "@/lib/services/ingestion/jobs";
import { IngestionProcessor } from "@/lib/services/ingestion/processor";
import { TextExtractionService } from "@/lib/services/ingestion/extractor";
import { createOpenAIService } from "@/lib/services/openai/service";
import { sleep } from "@/lib/utils";
import { DocumentChatJobProcessor } from "@/worker/chat-processor";
import { startWorker } from "@/worker/runner";

async function main(): Promise<void> {
  const processor = new IngestionProcessor({
    extractor: new TextExtractionService(),
    openAI: createOpenAIService(),
  });

  await Promise.all([
    startWorker({
      claimNextPendingJob,
      processor,
      sleep,
      pollIntervalMs: env.WORKER_POLL_INTERVAL_MS,
    }),
    startWorker({
      claimNextPendingJob: claimNextDocumentChatJob,
      processor: new DocumentChatJobProcessor(),
      sleep,
      pollIntervalMs: env.WORKER_POLL_INTERVAL_MS,
    }),
  ]);
}

main().catch((error: unknown) => {
  console.error("Worker crashed.", error);
  process.exit(1);
});
