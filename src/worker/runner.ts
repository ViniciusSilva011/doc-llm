export interface WorkerJob {
  id: number;
  documentId: number;
}

export interface WorkerProcessor {
  process(job: WorkerJob): Promise<unknown>;
}

export interface WorkerLogger {
  error(message?: unknown, ...optionalParams: unknown[]): void;
}

export interface WorkerDependencies {
  claimNextPendingJob: () => Promise<WorkerJob | null>;
  processor: WorkerProcessor;
  sleep: (milliseconds: number) => Promise<void>;
  pollIntervalMs: number;
  logger?: WorkerLogger;
}

export async function runWorkerIteration(
  dependencies: WorkerDependencies,
): Promise<
  | { status: "idle" }
  | { status: "processed"; jobId: number }
  | { status: "failed"; jobId: number; error: unknown }
> {
  const job = await dependencies.claimNextPendingJob();

  if (!job) {
    await dependencies.sleep(dependencies.pollIntervalMs);
    return { status: "idle" };
  }

  try {
    await dependencies.processor.process(job);
    return { status: "processed", jobId: job.id };
  } catch (error) {
    (dependencies.logger ?? console).error(`Job ${job.id} failed.`, error);
    return { status: "failed", jobId: job.id, error };
  }
}

export async function startWorker(
  dependencies: WorkerDependencies,
  options?: {
    shouldContinue?: () => boolean | Promise<boolean>;
  },
): Promise<void> {
  const shouldContinue = options?.shouldContinue ?? (() => true);

  while (await shouldContinue()) {
    await runWorkerIteration(dependencies);
  }
}
