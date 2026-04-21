import type { ObjectStorage, PutObjectInput, StoredObject } from "./interface";

export class S3CompatibleObjectStorage implements ObjectStorage {
  createObjectKey(parts: string[]): string {
    return parts.join("/");
  }

  async putObject(input: PutObjectInput): Promise<{ key: string; size: number }> {
    void input;

    throw new Error(
      "S3 storage is not implemented in this starter yet. Wire your preferred S3-compatible SDK into this provider.",
    );
  }

  async getObject(key: string): Promise<StoredObject> {
    void key;

    throw new Error(
      "S3 storage is not implemented in this starter yet. Wire your preferred S3-compatible SDK into this provider.",
    );
  }

  async deleteObject(key: string): Promise<void> {
    void key;

    throw new Error(
      "S3 storage is not implemented in this starter yet. Wire your preferred S3-compatible SDK into this provider.",
    );
  }
}
