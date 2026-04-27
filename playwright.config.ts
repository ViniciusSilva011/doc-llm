import "dotenv/config";
import { defineConfig, devices } from "@playwright/test";

const appUrl =
  process.env.PLAYWRIGHT_APP_URL ??
  process.env.APP_URL ??
  process.env.NEXTAUTH_URL;

if (!appUrl) {
  throw new Error(
    "Set PLAYWRIGHT_APP_URL, APP_URL, or NEXTAUTH_URL in .env before running Playwright.",
  );
}

const appPort = new URL(appUrl).port || "3100";
const reuseExistingServer = process.env.PLAYWRIGHT_REUSE_SERVER === "true";
const databaseUrl = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "Set TEST_DATABASE_URL or DATABASE_URL in .env before running Playwright.",
  );
}

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  retries: 0,
  reporter: "html",
  use: {
    baseURL: appUrl,
    trace: "on-first-retry",
  },
  webServer: {
    command: `tsx tests/e2e/setup-db.ts && npm run dev -- --hostname localhost --port ${appPort}`,
    url: appUrl,
    env: {
      ...process.env,
      APP_URL: appUrl,
      DATABASE_URL: databaseUrl,
      // Keep auth callbacks on the same host as the Playwright browser context.
      NEXTAUTH_URL: appUrl,
      PLAYWRIGHT_REUSE_SERVER:
        process.env.PLAYWRIGHT_REUSE_SERVER ?? "true",
    },
    reuseExistingServer,
    timeout: 120000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
