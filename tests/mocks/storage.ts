import { vi } from "vitest";

import type { ObjectStorage, StoredObject } from "@/lib/services/storage";

export function createMockStorage() {
  const objects = new Map<string, StoredObject>();

  const storage: ObjectStorage = {
    createObjectKey: vi.fn((parts: string[]) => parts.join("/")),
    putObject: vi.fn(async ({ key, body, contentType, metadata }) => {
      objects.set(key, {
        key,
        body,
        contentType: contentType ?? "text/plain",
        metadata: metadata ?? {},
        size: body.byteLength,
      });

      return { key, size: body.byteLength };
    }),
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
  };

  return {
    storage,
    objects,
  };
}
