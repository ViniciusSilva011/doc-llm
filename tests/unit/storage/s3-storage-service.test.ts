import { Readable } from "node:stream";

import { vi } from "vitest";

import { StorageObjectNotFoundError } from "@/server/storage/errors";
import { S3ObjectStorageService } from "@/server/storage/s3-storage-service";

const requiredAwsEnvNames = [
  "AWS_REGION",
  "AWS_S3_BUCKET",
  "AWS_ACCESS_KEY_ID",
  "AWS_SECRET_ACCESS_KEY",
] as const;
const hasRequiredAwsEnv = requiredAwsEnvNames.every((name) => process.env[name]?.trim());
const describeAws = hasRequiredAwsEnv ? describe : describe.skip;

describeAws("S3ObjectStorageService", () => {
  it("stores objects with the expected bucket, key, and content type", async () => {
    const send = vi.fn().mockResolvedValue({});
    const service = new S3ObjectStorageService(
      {
        backend: "s3",
        bucket: "doc-llm",
        region: "eu-west-2",
        accessKeyId: "key",
        secretAccessKey: "secret",
        forcePathStyle: true,
        prefix: "uploads",
      },
      { send } as never,
    );

    const stored = await service.putObject({
      key: "documents/user-1/report.pdf",
      body: Buffer.from("pdf-bytes", "utf8"),
      originalFilename: "report.pdf",
      contentType: "application/pdf",
    });

    expect(stored.key).toBe("uploads/documents/user-1/report.pdf");
    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0]?.[0].input).toMatchObject({
      Bucket: "doc-llm",
      Key: "uploads/documents/user-1/report.pdf",
      ContentType: "application/pdf",
    });
  });

  it("reads objects back as buffers", async () => {
    const send = vi.fn().mockResolvedValue({
      Body: {
        transformToByteArray: async () => Uint8Array.from(Buffer.from("pdf-bytes", "utf8")),
      },
    });
    const service = new S3ObjectStorageService(
      {
        backend: "s3",
        bucket: "doc-llm",
        region: "eu-west-2",
        accessKeyId: "key",
        secretAccessKey: "secret",
        forcePathStyle: false,
      },
      { send } as never,
    );

    await expect(service.getObjectBuffer("documents/user-1/report.pdf")).resolves.toEqual(
      Buffer.from("pdf-bytes", "utf8"),
    );
  });

  it("returns readable streams for object bodies", async () => {
    const send = vi.fn().mockResolvedValue({
      Body: Readable.from(Buffer.from("pdf-bytes", "utf8")),
    });
    const service = new S3ObjectStorageService(
      {
        backend: "s3",
        bucket: "doc-llm",
        region: "eu-west-2",
        accessKeyId: "key",
        secretAccessKey: "secret",
        forcePathStyle: false,
      },
      { send } as never,
    );

    const stream = await service.getObjectStream("documents/user-1/report.pdf");
    const chunks: Buffer[] = [];

    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }

    expect(Buffer.concat(chunks).toString("utf8")).toBe("pdf-bytes");
  });

  it("deletes objects and reports missing objects clearly", async () => {
    const send = vi
      .fn()
      .mockRejectedValueOnce({ name: "NotFound", $metadata: { httpStatusCode: 404 } })
      .mockResolvedValueOnce({});
    const service = new S3ObjectStorageService(
      {
        backend: "s3",
        bucket: "doc-llm",
        region: "eu-west-2",
        accessKeyId: "key",
        secretAccessKey: "secret",
        forcePathStyle: false,
      },
      { send } as never,
    );

    await expect(service.getObjectBuffer("missing.pdf")).rejects.toBeInstanceOf(
      StorageObjectNotFoundError,
    );

    await service.deleteObject("documents/user-1/report.pdf");

    expect(send).toHaveBeenCalledTimes(2);
  });
});
