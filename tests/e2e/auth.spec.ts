import { expect, test, type Page } from "@playwright/test";

import { TEST_USER_EMAIL, TEST_USER_PASSWORD } from "../helpers/test-env";

const appUrl = process.env.APP_URL ?? process.env.NEXTAUTH_URL ?? "http://127.0.0.1:3100";

async function signIn(page: Page) {
  const csrfResponse = await page.request.get(`${appUrl}/api/auth/csrf`);
  expect(csrfResponse.ok()).toBeTruthy();

  const { csrfToken } = (await csrfResponse.json()) as { csrfToken: string };

  const callbackResponse = await page.request.post(
    `${appUrl}/api/auth/callback/credentials?json=true`,
    {
      form: {
        csrfToken,
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD,
        callbackUrl: `${appUrl}/dashboard`,
        json: "true",
      },
    },
  );

  expect(callbackResponse.ok()).toBeTruthy();
}

test("user can sign in and reach the dashboard", async ({ page }) => {
  await signIn(page);
  await page.goto("/dashboard");

  await expect(page).toHaveURL(/\/dashboard$/);

  await expect(page.getByRole("heading", { name: /Welcome back/i })).toBeVisible();
});
