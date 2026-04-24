import { expect, type Page } from "@playwright/test";

import {
  TEST_USER_EMAIL,
  TEST_USER_PASSWORD,
  getPlaywrightAppUrl,
} from "../../helpers/test-env";

const appUrl = getPlaywrightAppUrl();

export async function signIn(page: Page) {
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
