import "server-only";

import { count, desc, eq, sql } from "drizzle-orm";

import { db } from "@/db/client";
import { ingestionJobs } from "@/db/schema";

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

  return (result.rows[0] as typeof ingestionJobs.$inferSelect | undefined) ?? null;
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

export async function failIngestionJob(jobId: string, errorMessage: string) {
  const [job] = await db
    .update(ingestionJobs)
    .set({
      status: "failed",
      errorMessage,
      finishedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(ingestionJobs.id, jobId))
    .returning();

  return job;
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
