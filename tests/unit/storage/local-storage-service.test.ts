import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { LocalObjectStorageService, StoragePathError } from "@/server/storage";

describe("LocalObjectStorageService", () => {
  let tempDir: string;
  let service: LocalObjectStorageService;

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), "doc-llm-storage-"));
    service = new LocalObjectStorageService({
      backend: "local",
      localDir: tempDir,
    });
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it("stores, reads, and deletes files", async () => {
    const stored = await service.putObject({
      key: "documents/user-1/file.pdf",
      body: Buffer.from("pdf-bytes", "utf8"),
      originalFilename: "file.pdf",
      contentType: "application/pdf",
    });

    expect(stored.byteSize).toBe(9);
    await expect(service.exists(stored.key)).resolves.toBe(true);
    await expect(service.getObjectBuffer(stored.key)).resolves.toEqual(
      Buffer.from("pdf-bytes", "utf8"),
    );

    await service.deleteObject(stored.key);

    await expect(service.exists(stored.key)).resolves.toBe(false);
  });

  it("prevents path traversal", async () => {
    await expect(
      service.getObjectBuffer("../../outside.pdf"),
    ).rejects.toBeInstanceOf(StoragePathError);
  });
});
