import "server-only";

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { env } from "@/lib/env";
import * as schema from "@/db/schema";

declare global {
  var __docLlmPool: Pool | undefined;
}

const pool =
  globalThis.__docLlmPool ??
  new Pool({
    connectionString: env.DATABASE_URL,
  });

if (env.NODE_ENV !== "production") {
  globalThis.__docLlmPool = pool;
}

export { pool };
export const db = drizzle(pool, { schema });
