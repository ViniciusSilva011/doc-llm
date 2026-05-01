import "dotenv/config";

import { readFile } from "node:fs/promises";
import path from "node:path";

import { hash } from "bcryptjs";
import { and, eq, sql } from "drizzle-orm";

import { db } from "@/db/client";
import { documents, ingestionJobs, users } from "@/db/schema";
import { env } from "@/lib/env";
import {
  computeSha256Hex,
  createDocumentStorageKey,
  getObjectStorageService,
} from "@/server/storage";

const SEEDED_PDF_FILENAME = "demon_slayer_comments.pdf";
const SEEDED_PDF_TITLE = "summit";

async function seedSummitPdf(ownerId: number): Promise<void> {
  const [existingDocument] = await db
    .select({ id: documents.id })
    .from(documents)
    .where(
      and(
        eq(documents.ownerId, ownerId),
        sql`lower(${documents.title}) = lower(${SEEDED_PDF_TITLE})`,
      ),
    )
    .limit(1);

  if (existingDocument) {
    return;
  }

  const storage = getObjectStorageService();
  const body = await readFile(
    path.resolve(process.cwd(), "public", SEEDED_PDF_FILENAME),
  );
  const checksum = computeSha256Hex(body);
  const storageKey = createDocumentStorageKey({
    ownerId,
    originalFilename: SEEDED_PDF_FILENAME,
  });

  const storedObject = await storage.putObject({
    key: storageKey,
    body,
    originalFilename: SEEDED_PDF_FILENAME,
    contentType: "application/pdf",
    checksum,
  });

  try {
    await db.transaction(async (tx) => {
      const [document] = await tx
        .insert(documents)
        .values({
          ownerId,
          title: SEEDED_PDF_TITLE,
          originalFilename: storedObject.originalFilename,
          status: "queued",
          storageBackend: storedObject.backend,
          storageKey: storedObject.key,
          contentType: storedObject.contentType,
          byteSize: storedObject.byteSize,
          checksum: storedObject.checksum ?? checksum,
          metadata: {
            uploadSource: "seed",
            fixture: SEEDED_PDF_FILENAME,
          },
        })
        .returning();

      if (!document) {
        throw new Error("Failed to create seeded summit document.");
      }

      await tx.insert(ingestionJobs).values({
        documentId: document.id,
        createdByUserId: ownerId,
      });
    });
  } catch (error) {
    await storage.deleteObject(storedObject.key).catch((cleanupError) => {
      console.error(
        "Failed to clean up seeded PDF object after database error",
        {
          storageKey: storedObject.key,
          cleanupError,
        },
      );
    });

    throw error;
  }
}

async function main(): Promise<void> {
  const passwordHash = await hash(env.DEMO_USER_PASSWORD, 12);

  const [user] = await db
    .insert(users)
    .values({
      name: "Demo User",
      email: env.DEMO_USER_EMAIL,
      passwordHash,
      role: "admin",
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: users.email,
      set: {
        name: "Demo User",
        passwordHash,
        role: "admin",
        updatedAt: new Date(),
      },
    })
    .returning();

  if (!user) {
    throw new Error("Failed to seed demo user.");
  }

  await seedSummitPdf(user.id);
}

main().catch((error: unknown) => {
  console.error("Database seed failed.", error);
  process.exit(1);
});
