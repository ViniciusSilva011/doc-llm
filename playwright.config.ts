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
const reuseExistingServer = process.env.PLAYWRIGHT_REUSE_SERVER !== "false";

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
    command: `npm run db:migrate && npm run db:seed && npm run dev -- --hostname localhost --port ${appPort}`,
    url: appUrl,
    env: {
      ...process.env,
      APP_URL: appUrl,
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
