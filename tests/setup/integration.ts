import { afterAll, beforeAll, beforeEach, vi } from "vitest";

import { applyTestEnv } from "../helpers/test-env";
import {
  closeDatabase,
  resetDatabase,
  runMigrations,
  seedTestUser,
} from "../helpers/db";

applyTestEnv();

vi.mock("server-only", () => ({}));

beforeAll(async () => {
  await runMigrations();
});

beforeEach(async () => {
  await resetDatabase();
  await seedTestUser();
  vi.clearAllMocks();
});

afterAll(async () => {
  await closeDatabase();
});
