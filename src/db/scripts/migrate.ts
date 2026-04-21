import "dotenv/config";

import path from "node:path";

import { migrate } from "drizzle-orm/node-postgres/migrator";

import { db, pool } from "@/db/client";

async function main(): Promise<void> {
  await migrate(db, {
    migrationsFolder: path.join(process.cwd(), "src", "db", "migrations"),
  });
}

main()
  .then(async () => {
    await pool.end();
  })
  .catch(async (error: unknown) => {
    console.error("Database migration failed.", error);
    await pool.end();
    process.exit(1);
  });
