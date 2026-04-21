import { eq } from "drizzle-orm";
import { vi } from "vitest";

import { db } from "@/db/client";
import { documents, ingestionJobs } from "@/db/schema";
import { getSeededUser } from "../../helpers/db";

const requireApiSessionMock = vi.hoisted(() => vi.fn());
const storageFixture = vi.hoisted(() => {
  const objects = new Map<
    string,
    {
      key: string;
      body: Buffer;
      contentType: string;
      metadata: Record<string, string>;
      size: number;
    }
  >();

  return {
    objects,
    storage: {
      createObjectKey: vi.fn((parts: string[]) => parts.join("/")),
      putObject: vi.fn(
        async ({
          key,
          body,
          contentType,
          metadata,
        }: {
          key: string;
          body: Buffer;
          contentType?: string;
          metadata?: Record<string, string>;
        }) => {
          objects.set(key, {
            key,
            body,
            contentType: contentType ?? "text/plain",
            metadata: metadata ?? {},
            size: body.byteLength,
          });

          return { key, size: body.byteLength };
        },
      ),
      getObject: vi.fn(async (key: string) => {
        const object = objects.get(key);

        if (!object) {
          throw new Error(`Object ${key} not found.`);
        }

        return object;
      }),
      deleteObject: vi.fn(async (key: string) => {
        objects.delete(key);
      }),
    },
  };
});

vi.mock("@/auth/session", () => ({
  UnauthorizedError: class UnauthorizedError extends Error {},
  requireApiSession: requireApiSessionMock,
}));

vi.mock("@/lib/services/storage", () => ({
  createObjectStorage: () => storageFixture.storage,
}));

import { POST } from "@/app/api/ingestion-jobs/route";

describe("POST /api/ingestion-jobs", () => {
  it("stores source content and creates document and job records", async () => {
    const seededUser = await getSeededUser();
    requireApiSessionMock.mockResolvedValue({
      user: {
        id: seededUser.id,
        email: seededUser.email,
        role: seededUser.role,
      },
    });

    const response = await POST(
      new Request("http://localhost/api/ingestion-jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "Support call notes",
          content: "A long body of text that should be queued for ingestion.",
          mimeType: "text/plain",
        }),
      }),
    );

    expect(response.status).toBe(201);

    const payload = (await response.json()) as {
      document: { id: string };
      job: { id: string };
    };

    const [document] = await db
      .select()
      .from(documents)
      .where(eq(documents.id, payload.document.id))
      .limit(1);
    const [job] = await db
      .select()
      .from(ingestionJobs)
      .where(eq(ingestionJobs.id, payload.job.id))
      .limit(1);

    expect(document?.title).toBe("Support call notes");
    expect(job?.status).toBe("pending");
    expect(storageFixture.storage.putObject).toHaveBeenCalledTimes(1);
  });
});
