import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";

import { env } from "@/lib/env";
import type {
  ObjectStorage,
  PutObjectInput,
  StoredObject,
} from "@/lib/services/storage/interface";

export class LocalObjectStorage implements ObjectStorage {
  constructor(private readonly root = path.resolve(env.LOCAL_STORAGE_ROOT)) {}

  createObjectKey(parts: string[]): string {
    return parts
      .map((part) => part.trim().replace(/[^a-zA-Z0-9._-]+/g, "-"))
      .filter(Boolean)
      .join("/");
  }

  async putObject(input: PutObjectInput): Promise<{ key: string; size: number }> {
    const filePath = this.resolvePath(input.key);
    const metadataPath = `${filePath}.meta.json`;

    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, input.body);
    await writeFile(
      metadataPath,
      JSON.stringify(
        {
          contentType: input.contentType ?? "application/octet-stream",
          metadata: input.metadata ?? {},
        },
        null,
        2,
      ),
    );

    return { key: input.key, size: input.body.byteLength };
  }

  async getObject(key: string): Promise<StoredObject> {
    const filePath = this.resolvePath(key);
    const metadataPath = `${filePath}.meta.json`;
    const [body, fileStats, rawMetadata] = await Promise.all([
      readFile(filePath),
      stat(filePath),
      readFile(metadataPath, "utf8").catch(() => null),
    ]);

    const metadata = rawMetadata
      ? (JSON.parse(rawMetadata) as {
          contentType?: string;
          metadata?: Record<string, string>;
        })
      : undefined;

    return {
      key,
      body,
      size: fileStats.size,
      contentType: metadata?.contentType ?? "application/octet-stream",
      metadata: metadata?.metadata ?? {},
    };
  }

  async deleteObject(key: string): Promise<void> {
    const filePath = this.resolvePath(key);
    await rm(filePath, { force: true });
    await rm(`${filePath}.meta.json`, { force: true });
  }

  private resolvePath(key: string): string {
    return path.join(this.root, key);
  }
}
