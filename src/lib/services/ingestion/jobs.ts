import { count, desc, eq, sql } from "drizzle-orm";

import { db } from "@/db/client";
import { ingestionJobs } from "@/db/schema";

function mapClaimedJobRow(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    documentId: row.document_id as string,
    createdByUserId: row.created_by_user_id as string,
    status: row.status as typeof ingestionJobs.$inferSelect["status"],
    attemptCount: row.attempt_count as number,
    maxAttempts: row.max_attempts as number,
    errorMessage: (row.error_message as string | null | undefined) ?? null,
    startedAt: (row.started_at as Date | null | undefined) ?? null,
    finishedAt: (row.finished_at as Date | null | undefined) ?? null,
    createdAt: row.created_at as Date,
    updatedAt: row.updated_at as Date,
  } satisfies typeof ingestionJobs.$inferSelect;
}

export async function createIngestionJob(input: {
  documentId: string;
  createdByUserId: string;
}) {
  const [job] = await db
    .insert(ingestionJobs)
    .values({
      documentId: input.documentId,
      createdByUserId: input.createdByUserId,
    })
    .returning();

  if (!job) {
    throw new Error("Failed to create ingestion job.");
  }

  return job;
}

export async function claimNextPendingJob() {
  const result = await db.execute(sql`
    update ingestion_jobs
    set
      status = 'processing',
      attempt_count = attempt_count + 1,
      started_at = now(),
      updated_at = now()
    where id = (
      select id
      from ingestion_jobs
      where status = 'pending'
      order by created_at asc
      for update skip locked
      limit 1
    )
    returning *;
  `);

  const row = result.rows[0] as Record<string, unknown> | undefined;

  return row ? mapClaimedJobRow(row) : null;
}

export async function completeIngestionJob(jobId: string) {
  const [job] = await db
    .update(ingestionJobs)
    .set({
      status: "completed",
      finishedAt: new Date(),
      errorMessage: null,
      updatedAt: new Date(),
    })
    .where(eq(ingestionJobs.id, jobId))
    .returning();

  return job;
}

export async function failIngestionJob(
  jobId: string,
  errorMessage: string,
  options?: {
    retryable?: boolean;
  },
) {
  const [currentJob] = await db
    .select({
      attemptCount: ingestionJobs.attemptCount,
      maxAttempts: ingestionJobs.maxAttempts,
    })
    .from(ingestionJobs)
    .where(eq(ingestionJobs.id, jobId))
    .limit(1);

  if (!currentJob) {
    return null;
  }

  const retryable = options?.retryable ?? true;
  const nextStatus =
    retryable && currentJob.attemptCount < currentJob.maxAttempts
      ? "pending"
      : ("failed" as const);

  const [job] = await db
    .update(ingestionJobs)
    .set({
      status: nextStatus,
      errorMessage,
      startedAt: null,
      finishedAt: nextStatus === "failed" ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(ingestionJobs.id, jobId))
    .returning();

  return {
    job,
    willRetry: nextStatus === "pending",
  };
}

export async function listRecentJobsForUser(userId: string) {
  return db
    .select()
    .from(ingestionJobs)
    .where(eq(ingestionJobs.createdByUserId, userId))
    .orderBy(desc(ingestionJobs.createdAt))
    .limit(10);
}

export async function countPendingJobs() {
  const [row] = await db
    .select({ value: count(ingestionJobs.id) })
    .from(ingestionJobs)
    .where(eq(ingestionJobs.status, "pending"));

  return row?.value ?? 0;
}
