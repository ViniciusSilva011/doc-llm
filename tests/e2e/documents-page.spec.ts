import { expect, test } from "@playwright/test";

import { signIn } from "./helpers/auth";

test("authenticated user can open the documents page", async ({ page }) => {
  await signIn(page);
  await page.goto("/documents");

  await expect(page).toHaveURL(/\/documents$/);
  await expect(page.getByRole("heading", { name: "Upload PDF documents for ingestion." })).toBeVisible();
  await expect(page.getByLabel("PDF file")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Tracked documents" })).toBeVisible();
});

test("sign-in page uses a black application background", async ({ page }) => {
  await page.goto("/sign-in");

  const backgroundColors = await page.evaluate(() => ({
    html: window.getComputedStyle(document.documentElement).backgroundColor,
    body: window.getComputedStyle(document.body).backgroundColor,
  }));

  expect(backgroundColors.html).not.toBe("rgba(0, 0, 0, 0)");
  expect(backgroundColors.body).toBe(backgroundColors.html);
  await expect(page.getByRole("heading", { name: "Sign in to the starter workspace." })).toBeVisible();
});
