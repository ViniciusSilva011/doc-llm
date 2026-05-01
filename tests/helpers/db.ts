import path from "node:path";

import { hash } from "bcryptjs";
import { migrate } from "drizzle-orm/node-postgres/migrator";

import { applyTestEnv, TEST_USER_EMAIL, TEST_USER_PASSWORD } from "./test-env";

applyTestEnv();

export async function runMigrations() {
  const { db, pool } = await import("@/db/client");

  await pool.query(`
    DROP SCHEMA IF EXISTS "drizzle" CASCADE;
    DROP SCHEMA IF EXISTS "public" CASCADE;
    CREATE SCHEMA "public";
  `);

  await migrate(db, {
    migrationsFolder: path.join(process.cwd(), "src", "db", "migrations"),
  });
}

export async function resetDatabase() {
  const { pool } = await import("@/db/client");

  await pool.query(`
    TRUNCATE TABLE
      document_chat_jobs,
      document_chat_messages,
      document_chunks,
      ingestion_jobs,
      documents,
      accounts,
      sessions,
      verification_tokens,
      users
    RESTART IDENTITY CASCADE;
  `);
}

export async function seedTestUser() {
  const { db } = await import("@/db/client");
  const { users } = await import("@/db/schema");
  const passwordHash = await hash(TEST_USER_PASSWORD, 10);

  await db
    .insert(users)
    .values({
      name: "Demo User",
      email: TEST_USER_EMAIL,
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
    });
}

export async function seedDemoChatDocument() {
  const { pool } = await import("@/db/client");
  const user = await getSeededUser();

  await pool.query(
    `
      INSERT INTO documents (
        id,
        owner_id,
        title,
        original_filename,
        status,
        storage_backend,
        storage_key,
        content_type,
        byte_size,
        metadata,
        last_ingested_at,
        updated_at
      )
      OVERRIDING SYSTEM VALUE
      VALUES (
        1,
        $1,
        'Demo Chat PDF',
        'demo-chat.pdf',
        'processed',
        'local',
        'documents/demo-chat.pdf',
        'application/pdf',
        1024,
        '{}'::jsonb,
        now(),
        now()
      )
      ON CONFLICT (id) DO UPDATE SET
        owner_id = EXCLUDED.owner_id,
        title = EXCLUDED.title,
        original_filename = EXCLUDED.original_filename,
        status = EXCLUDED.status,
        storage_backend = EXCLUDED.storage_backend,
        storage_key = EXCLUDED.storage_key,
        content_type = EXCLUDED.content_type,
        byte_size = EXCLUDED.byte_size,
        metadata = EXCLUDED.metadata,
        last_ingested_at = EXCLUDED.last_ingested_at,
        updated_at = EXCLUDED.updated_at;
    `,
    [user.id],
  );

  await pool.query(`
    SELECT setval(
      pg_get_serial_sequence('documents', 'id'),
      GREATEST((SELECT MAX(id) FROM documents), 1),
      true
    );
  `);
}

export async function getSeededUser() {
  const { db } = await import("@/db/client");
  const { users } = await import("@/db/schema");
  const { eq } = await import("drizzle-orm");

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, TEST_USER_EMAIL))
    .limit(1);

  if (!user) {
    throw new Error("Seeded user was not found.");
  }

  return user;
}

export async function closeDatabase() {
  const { pool } = await import("@/db/client");
  await pool.end();
}
