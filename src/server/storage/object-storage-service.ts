import type { Readable } from "node:stream";

import type { PutObjectParams, StorageBackend, StoredObject } from "@/server/storage/types";

export interface ObjectStorageService {
  readonly backend: StorageBackend;
  putObject(params: PutObjectParams): Promise<StoredObject>;
  getObjectStream(key: string): Promise<Readable>;
  getObjectBuffer(key: string): Promise<Buffer>;
  deleteObject(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  getPublicUrl?(key: string): string | null;
}
