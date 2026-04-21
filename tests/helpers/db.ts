import path from "node:path";

import { hash } from "bcryptjs";
import { migrate } from "drizzle-orm/node-postgres/migrator";

import { applyTestEnv, TEST_USER_EMAIL, TEST_USER_PASSWORD } from "./test-env";

applyTestEnv();

export async function runMigrations() {
  const { db } = await import("@/db/client");

  await migrate(db, {
    migrationsFolder: path.join(process.cwd(), "src", "db", "migrations"),
  });
}

export async function resetDatabase() {
  const { pool } = await import("@/db/client");

  await pool.query(`
    TRUNCATE TABLE
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
