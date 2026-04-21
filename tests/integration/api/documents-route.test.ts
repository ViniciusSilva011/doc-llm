import { vi } from "vitest";

import { db } from "@/db/client";
import { documents, users } from "@/db/schema";
import { getSeededUser } from "../../helpers/db";

const requireApiSessionMock = vi.hoisted(() => vi.fn());

vi.mock("@/auth/session", () => ({
  UnauthorizedError: class UnauthorizedError extends Error {},
  requireApiSession: requireApiSessionMock,
}));

import { GET } from "@/app/api/documents/route";

describe("GET /api/documents", () => {
  it("returns only documents for the signed-in user", async () => {
    const seededUser = await getSeededUser();

    requireApiSessionMock.mockResolvedValue({
      user: {
        id: seededUser.id,
        email: seededUser.email,
        role: seededUser.role,
      },
    });

    const [otherUser] = await db
      .insert(users)
      .values({
        email: "other@example.com",
        role: "user",
      })
      .returning();

    if (!otherUser) {
      throw new Error("Failed to create the secondary user.");
    }

    await db.insert(documents).values([
      {
        ownerId: seededUser.id,
        title: "Visible document",
        sourceObjectKey: "documents/visible.txt",
        sourceMimeType: "text/plain",
      },
      {
        ownerId: otherUser.id,
        title: "Hidden document",
        sourceObjectKey: "documents/hidden.txt",
        sourceMimeType: "text/plain",
      },
    ]);

    const response = await GET();
    const payload = (await response.json()) as {
      documents: Array<{ title: string }>;
    };

    expect(response.status).toBe(200);
    expect(payload.documents).toHaveLength(1);
    expect(payload.documents[0]?.title).toBe("Visible document");
  });
});
