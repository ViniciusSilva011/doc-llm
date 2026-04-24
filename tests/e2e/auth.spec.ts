import { expect, test } from "@playwright/test";

import { signIn } from "./helpers/auth";

test("user can sign in and reach the dashboard", async ({ page }) => {
  await signIn(page);
  await page.goto("/dashboard");

  await expect(page).toHaveURL(/\/dashboard$/);

  await expect(page.getByRole("heading", { name: /Welcome back/i })).toBeVisible();
});
