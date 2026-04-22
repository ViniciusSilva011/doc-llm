import { Readable } from "node:stream";

import { vi } from "vitest";

import type { ObjectStorageService, StoredObject } from "@/server/storage";

export function createMockStorage() {
  const objects = new Map<
    string,
    {
      metadata: StoredObject;
      body: Buffer;
    }
  >();

  const storage: ObjectStorageService = {
    backend: "local",
    putObject: vi.fn(async ({ key, body, contentType, originalFilename, checksum }) => {
      const storedObject: StoredObject = {
        backend: "local",
        key,
        originalFilename,
        contentType,
        byteSize: body.byteLength,
        checksum: checksum ?? null,
      };

      objects.set(key, {
        metadata: storedObject,
        body,
      });

      return storedObject;
    }),
    getObjectStream: vi.fn(async (key: string) => {
      const object = objects.get(key);

      if (!object) {
        throw new Error(`Object ${key} not found.`);
      }

      return Readable.from(object.body);
    }),
    getObjectBuffer: vi.fn(async (key: string) => {
      const object = objects.get(key);

      if (!object) {
        throw new Error(`Object ${key} not found.`);
      }

      return object.body;
    }),
    deleteObject: vi.fn(async (key: string) => {
      objects.delete(key);
    }),
    exists: vi.fn(async (key: string) => objects.has(key)),
    getPublicUrl: vi.fn(() => null),
  };

  return {
    storage,
    objects,
  };
}
