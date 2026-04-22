import { expect, test } from "@playwright/test";

import { TEST_USER_EMAIL, TEST_USER_PASSWORD } from "../helpers/test-env";

async function signIn(page: import("@playwright/test").Page) {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(TEST_USER_EMAIL);
  await page.getByLabel("Password").fill(TEST_USER_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

test("authenticated user can open the documents page", async ({ page }) => {
  await signIn(page);
  await page.goto("/documents");

  await expect(page).toHaveURL(/\/documents$/);
  await expect(page.getByRole("heading", { name: "Upload PDF documents for ingestion." })).toBeVisible();
  await expect(page.getByLabel("PDF file")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Tracked documents" })).toBeVisible();
});
