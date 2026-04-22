import "dotenv/config";
import { defineConfig, devices } from "@playwright/test";

const defaultAppUrl = "http://127.0.0.1:3100";
const appUrl = process.env.APP_URL ?? process.env.NEXTAUTH_URL ?? defaultAppUrl;
const nextAuthUrl = process.env.NEXTAUTH_URL ?? appUrl;
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
      NEXTAUTH_URL: nextAuthUrl,
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
