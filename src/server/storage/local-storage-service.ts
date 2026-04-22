import { createReadStream } from "node:fs";
import { access, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";

import type { ObjectStorageService } from "@/server/storage/object-storage-service";
import {
  StorageObjectNotFoundError,
  StoragePathError,
} from "@/server/storage/errors";
import { computeSha256Hex } from "@/server/storage/key-utils";
import type {
  LocalStorageConfig,
  PutObjectParams,
  StoredObject,
} from "@/server/storage/types";

export class LocalObjectStorageService implements ObjectStorageService {
  readonly backend = "local" as const;
  private readonly root: string;

  constructor(config: LocalStorageConfig) {
    this.root = path.resolve(config.localDir);
  }

  async putObject(params: PutObjectParams): Promise<StoredObject> {
    const filePath = this.resolvePath(params.key);

    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, params.body);

    return {
      backend: this.backend,
      key: params.key,
      originalFilename: params.originalFilename,
      contentType: params.contentType,
      byteSize: params.body.byteLength,
      checksum: params.checksum ?? computeSha256Hex(params.body),
    };
  }

  async getObjectStream(key: string): Promise<Readable> {
    const filePath = this.resolvePath(key);

    if (!(await this.exists(key))) {
      throw new StorageObjectNotFoundError(`Object "${key}" was not found.`);
    }

    return createReadStream(filePath);
  }

  async getObjectBuffer(key: string): Promise<Buffer> {
    const filePath = this.resolvePath(key);

    try {
      return await readFile(filePath);
    } catch (error) {
      if (isFileMissingError(error)) {
        throw new StorageObjectNotFoundError(`Object "${key}" was not found.`);
      }

      throw error;
    }
  }

  async deleteObject(key: string): Promise<void> {
    const filePath = this.resolvePath(key);

    await rm(filePath, { force: true });
  }

  async exists(key: string): Promise<boolean> {
    const filePath = this.resolvePath(key);

    try {
      await access(filePath);
      return true;
    } catch (error) {
      if (isFileMissingError(error)) {
        return false;
      }

      throw error;
    }
  }

  getPublicUrl(): string | null {
    return null;
  }

  private resolvePath(key: string): string {
    const normalizedKey = key.replace(/\\/g, "/");
    const resolvedPath = path.resolve(this.root, normalizedKey);
    const relativePath = path.relative(this.root, resolvedPath);

    if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
      throw new StoragePathError(`Storage key "${key}" resolves outside the local storage root.`);
    }

    return resolvedPath;
  }
}

function isFileMissingError(error: unknown): error is NodeJS.ErrnoException {
  return (
    error instanceof Error &&
    "code" in error &&
    (error as NodeJS.ErrnoException).code === "ENOENT"
  );
}
