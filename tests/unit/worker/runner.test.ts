import { vi } from "vitest";

import { runWorkerIteration, startWorker } from "@/worker/runner";

describe("worker runner", () => {
  it("sleeps when there are no queued jobs", async () => {
    const claimNextPendingJob = vi.fn().mockResolvedValue(null);
    const processor = {
      process: vi.fn(),
    };
    const sleep = vi.fn().mockResolvedValue(undefined);

    await expect(
      runWorkerIteration({
        claimNextPendingJob,
        processor,
        sleep,
        pollIntervalMs: 25,
      }),
    ).resolves.toEqual({ status: "idle" });

    expect(claimNextPendingJob).toHaveBeenCalledTimes(1);
    expect(processor.process).not.toHaveBeenCalled();
    expect(sleep).toHaveBeenCalledWith(25);
  });

  it("processes a claimed job", async () => {
    const claimNextPendingJob = vi.fn().mockResolvedValue({
      id: "job-1",
      documentId: "doc-1",
    });
    const processor = {
      process: vi.fn().mockResolvedValue(undefined),
    };
    const sleep = vi.fn().mockResolvedValue(undefined);

    await expect(
      runWorkerIteration({
        claimNextPendingJob,
        processor,
        sleep,
        pollIntervalMs: 25,
      }),
    ).resolves.toEqual({ status: "processed", jobId: "job-1" });

    expect(processor.process).toHaveBeenCalledWith({
      id: "job-1",
      documentId: "doc-1",
    });
    expect(sleep).not.toHaveBeenCalled();
  });

  it("logs failures from the processor and returns a failed result", async () => {
    const error = new Error("boom");
    const claimNextPendingJob = vi.fn().mockResolvedValue({
      id: "job-1",
      documentId: "doc-1",
    });
    const processor = {
      process: vi.fn().mockRejectedValue(error),
    };
    const sleep = vi.fn().mockResolvedValue(undefined);
    const logger = {
      error: vi.fn(),
    };

    await expect(
      runWorkerIteration({
        claimNextPendingJob,
        processor,
        sleep,
        pollIntervalMs: 25,
        logger,
      }),
    ).resolves.toEqual({ status: "failed", jobId: "job-1", error });

    expect(logger.error).toHaveBeenCalledWith("Job job-1 failed.", error);
    expect(sleep).not.toHaveBeenCalled();
  });

  it("can run multiple iterations through the start loop", async () => {
    const claimNextPendingJob = vi
      .fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: "job-2", documentId: "doc-2" });
    const processor = {
      process: vi.fn().mockResolvedValue(undefined),
    };
    const sleep = vi.fn().mockResolvedValue(undefined);
    let remainingIterations = 2;

    await startWorker(
      {
        claimNextPendingJob,
        processor,
        sleep,
        pollIntervalMs: 10,
      },
      {
        shouldContinue: () => {
          if (remainingIterations <= 0) {
            return false;
          }

          remainingIterations -= 1;
          return true;
        },
      },
    );

    expect(claimNextPendingJob).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledWith(10);
    expect(processor.process).toHaveBeenCalledWith({
      id: "job-2",
      documentId: "doc-2",
    });
  });
});
