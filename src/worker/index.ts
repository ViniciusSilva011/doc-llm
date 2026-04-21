import "dotenv/config";

import { env } from "@/lib/env";
import { claimNextPendingJob } from "@/lib/services/ingestion/jobs";
import { IngestionProcessor } from "@/lib/services/ingestion/processor";
import { TextExtractionService } from "@/lib/services/ingestion/extractor";
import { createOpenAIService } from "@/lib/services/openai/service";
import { sleep } from "@/lib/utils";

async function main(): Promise<void> {
  const processor = new IngestionProcessor({
    extractor: new TextExtractionService(),
    openAI: createOpenAIService(),
  });

  console.info("Worker started.");

  while (true) {
    const job = await claimNextPendingJob();

    if (!job) {
      await sleep(env.WORKER_POLL_INTERVAL_MS);
      continue;
    }

    console.info(`Processing ingestion job ${job.id} for document ${job.documentId}`);

    try {
      const result = await processor.process(job);
      console.info(`Completed job ${job.id} with ${result.chunkCount} chunks.`);
    } catch (error) {
      console.error(`Job ${job.id} failed.`, error);
    }
  }
}

main().catch((error: unknown) => {
  console.error("Worker crashed.", error);
  process.exit(1);
});
