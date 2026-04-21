import { expect, test } from "@playwright/test";

import { TEST_USER_EMAIL, TEST_USER_PASSWORD } from "../helpers/test-env";

test("user can sign in and reach the dashboard", async ({ page }) => {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(TEST_USER_EMAIL);
  await page.getByLabel("Password").fill(TEST_USER_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: /Welcome back/i })).toBeVisible();
});
