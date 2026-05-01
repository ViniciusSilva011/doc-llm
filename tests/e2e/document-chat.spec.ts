import { expect, test } from "@playwright/test";

import { signIn } from "./helpers/auth";

test("demo user can send a chat message from the seeded document chat page", async ({
  page,
}) => {
  await signIn(page);
  await page.goto("/documents/1/chat");

  await expect(page).toHaveURL(/\/documents\/1\/chat$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByText("processed")).toBeVisible();

  const question = `Who described the movie as deep and spiritual? ${Date.now()}`;
  const chatInput = page.getByPlaceholder("Ask a question about this PDF");
  const sendButton = page.getByRole("button", { name: "Send message" });

  await chatInput.click();
  await chatInput.pressSequentially(question);
  await expect(sendButton).toBeEnabled();

  const [chatResponse] = await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().includes("/api/documents/1/chat") &&
        response.request().method() === "POST",
    ),
    sendButton.click(),
  ]);

  expect(chatResponse.ok()).toBeTruthy();
  await expect(page.getByText(question)).toBeVisible();
  await expect(page.getByText("Waiting for 1 answer...")).toBeVisible();
  await expect(chatInput).toBeEnabled();
});
