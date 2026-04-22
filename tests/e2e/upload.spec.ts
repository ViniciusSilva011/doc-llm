import { expect, test } from "@playwright/test";
import path from "node:path";

import { TEST_USER_EMAIL, TEST_USER_PASSWORD } from "../helpers/test-env";
import { createPdfBuffer } from "../helpers/files";

async function signIn(page: import("@playwright/test").Page) {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(TEST_USER_EMAIL);
  await page.getByLabel("Password").fill(TEST_USER_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

test("user uploads a valid pdf and sees it in the documents list", async ({ page }) => {
  await signIn(page);
  await page.goto("/documents");
  const filename = `strategy-memo-${Date.now()}.pdf`;

  await page.getByLabel("PDF file").setInputFiles({
    name: filename,
    mimeType: "application/pdf",
    buffer: createPdfBuffer(),
  });
  await page.getByRole("button", { name: "Upload PDF" }).click();

  const row = page
    .getByRole("row")
    .filter({ has: page.getByRole("cell", { name: filename }) })
    .first();

  await expect(page.getByText("PDF uploaded and queued for ingestion.")).toBeVisible();
  await expect(row).toBeVisible();
  await expect(row.getByRole("cell", { name: filename })).toBeVisible();
  await expect(row.getByRole("cell", { name: "queued" })).toBeVisible();
});

test("user uploads the public ai_text_full_v2 pdf with a custom title", async ({ page }) => {
  await signIn(page);
  await page.goto("/documents");

  const title = "testing-5.4";
  const pdfPath = path.resolve(process.cwd(), "public", "ai_text_full_v2.pdf");

  await page.getByLabel("Title").fill(title);
  await page.getByLabel("PDF file").setInputFiles(pdfPath);
  await page.getByRole("button", { name: "Upload PDF" }).click();

  const row = page
    .getByRole("row")
    .filter({ has: page.getByRole("cell", { name: title }) })
    .first();

  await expect(page.getByText("PDF uploaded and queued for ingestion.")).toBeVisible();
  await expect(row).toBeVisible();
  await expect(row.getByRole("cell", { name: title })).toBeVisible();
  await expect(row.getByRole("cell", { name: "queued" })).toBeVisible();
});

test("invalid file uploads show a validation error", async ({ page }) => {
  await signIn(page);
  await page.goto("/documents");

  await page.getByLabel("PDF file").setInputFiles({
    name: "notes.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("not a pdf", "utf8"),
  });
  await page.getByRole("button", { name: "Upload PDF" }).click();

  await expect(page.getByText(/Only PDF files are accepted|application\/pdf/)).toBeVisible();
});
