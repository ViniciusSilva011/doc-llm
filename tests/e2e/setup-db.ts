import {
  closeDatabase,
  runMigrations,
  seedDemoChatDocument,
  seedTestUser,
} from "../helpers/db";
import { applyTestEnv } from "../helpers/test-env";

applyTestEnv();

async function main() {
  await runMigrations();
  await seedTestUser();
  await seedDemoChatDocument();
}

main()
  .then(async () => {
    await closeDatabase();
  })
  .catch(async (error: unknown) => {
    console.error("E2E database setup failed.", error);
    await closeDatabase();
    process.exit(1);
  });
