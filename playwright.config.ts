import { defineConfig, devices } from "@playwright/test";

const appUrl = process.env.APP_URL ?? "http://127.0.0.1:3100";
const reuseExistingServer = process.env.PLAYWRIGHT_REUSE_SERVER === "true";

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
    command: "npm run db:migrate && npm run db:seed && npm run dev -- --hostname 127.0.0.1 --port 3100",
    url: appUrl,
    env: {
      ...process.env,
      APP_URL: appUrl,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? appUrl,
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
