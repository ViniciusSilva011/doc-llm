import "server-only";

import { env } from "@/lib/env";
import type { ObjectStorage } from "@/lib/services/storage/interface";
import { LocalObjectStorage } from "@/lib/services/storage/local-storage";
import { S3CompatibleObjectStorage } from "@/lib/services/storage/s3-storage";

let storageInstance: ObjectStorage | undefined;

export function createObjectStorage(): ObjectStorage {
  if (storageInstance) {
    return storageInstance;
  }

  storageInstance =
    env.OBJECT_STORAGE_DRIVER === "s3"
      ? new S3CompatibleObjectStorage()
      : new LocalObjectStorage();

  return storageInstance;
}

export type { ObjectStorage, PutObjectInput, StoredObject } from "./interface";
