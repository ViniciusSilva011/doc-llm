import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import path from "node:path";

import { createPdfBuffer } from "../helpers/files";
import { signIn } from "./helpers/auth";

test("user uploads a valid pdf and sees it in the documents list", async ({ page }) => {
  await signIn(page);

  const filename = `strategy-memo-${Date.now()}.pdf`;
  const uploadResponse = await page.request.post("/api/documents/upload", {
    multipart: {
      file: {
        name: filename,
        mimeType: "application/pdf",
        buffer: createPdfBuffer(),
      },
    },
  });

  await expect(uploadResponse).toBeOK();
  await page.goto("/documents");

  const row = page
    .getByRole("row")
    .filter({ has: page.getByRole("cell", { name: filename }) })
    .first();

  await expect(row).toBeVisible();
  await expect(row.getByRole("cell", { name: filename })).toBeVisible();
  await expect(row.getByRole("cell", { name: "queued" })).toBeVisible();
  await expect(row.getByRole("link", { name: "Chat" })).toHaveAttribute(
    "href",
    /\/documents\/\d+\/chat$/,
  );

  await row.click();
  await expect(page).toHaveURL(/\/documents\/\d+\/chat$/);

  await page.goto("/dashboard");
  await expect(page.getByText(filename)).toBeVisible();
});

test("user uploads the public ai_text_full_v2 pdf with a custom title", async ({ page }) => {
  await signIn(page);

  const title = "testing-5.4";
  const pdfPath = path.resolve(process.cwd(), "public", "ai_text_full_v2.pdf");
  const uploadResponse = await page.request.post("/api/documents/upload", {
    multipart: {
      title,
      file: {
        name: "ai_text_full_v2.pdf",
        mimeType: "application/pdf",
        buffer: readFileSync(pdfPath),
      },
    },
  });

  await expect(uploadResponse).toBeOK();
  await page.goto("/documents");

  const row = page
    .getByRole("row")
    .filter({ has: page.getByRole("cell", { name: title }) })
    .first();

  await expect(row).toBeVisible();
  await expect(row.getByRole("cell", { name: title })).toBeVisible();
  await expect(row.getByRole("cell", { name: "queued" })).toBeVisible();
});

test("invalid file uploads show a validation error", async ({ page }) => {
  await signIn(page);

  const uploadResponse = await page.request.post("/api/documents/upload", {
    multipart: {
      file: {
        name: "notes.pdf",
        mimeType: "text/plain",
        buffer: Buffer.from("not a pdf", "utf8"),
      },
    },
  });

  expect(uploadResponse.status()).toBe(400);
  await expect(uploadResponse.json()).resolves.toMatchObject({
    error: expect.stringMatching(/Only PDF files are accepted|application\/pdf/),
  });
});
