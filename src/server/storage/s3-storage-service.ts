import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
  S3ServiceException,
} from "@aws-sdk/client-s3";
import { Readable } from "node:stream";
import type { ReadableStream as WebReadableStream } from "node:stream/web";

import type { ObjectStorageService } from "@/server/storage/object-storage-service";
import {
  StorageConfigurationError,
  StorageObjectNotFoundError,
} from "@/server/storage/errors";
import { computeSha256Hex } from "@/server/storage/key-utils";
import type {
  PutObjectParams,
  S3StorageConfig,
  StoredObject,
} from "@/server/storage/types";

export class S3ObjectStorageService implements ObjectStorageService {
  readonly backend = "s3" as const;
  private readonly bucket: string;
  private readonly prefix: string | undefined;

  constructor(
    config: S3StorageConfig,
    private readonly client = new S3Client(createS3ClientConfig(config)),
  ) {
    this.bucket = config.bucket;
    this.prefix = trimPrefix(config.prefix);
  }

  async putObject(params: PutObjectParams): Promise<StoredObject> {
    const key = this.withPrefix(params.key);

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: params.body,
        ContentType: params.contentType,
        Metadata: {
          checksum: params.checksum ?? computeSha256Hex(params.body),
          originalFilename: params.originalFilename,
        },
      }),
    );

    return {
      backend: this.backend,
      key,
      originalFilename: params.originalFilename,
      contentType: params.contentType,
      byteSize: params.body.byteLength,
      checksum: params.checksum ?? computeSha256Hex(params.body),
    };
  }

  async getObjectStream(key: string): Promise<Readable> {
    const response = await this.sendGetObject(key);
    const body = response.Body;

    if (!body) {
      throw new StorageObjectNotFoundError(`Object "${key}" was not found.`);
    }

    if (body instanceof Readable) {
      return body;
    }

    if (isWebReadableStream(body)) {
      return Readable.fromWeb(body as unknown as WebReadableStream);
    }

    throw new StorageConfigurationError("S3 returned an unreadable response body.");
  }

  async getObjectBuffer(key: string): Promise<Buffer> {
    const response = await this.sendGetObject(key);
    const body = response.Body;

    if (!body) {
      throw new StorageObjectNotFoundError(`Object "${key}" was not found.`);
    }

    if ("transformToByteArray" in body && typeof body.transformToByteArray === "function") {
      return Buffer.from(await body.transformToByteArray());
    }

    const stream =
      body instanceof Readable
        ? body
        : isWebReadableStream(body)
          ? Readable.fromWeb(body as unknown as WebReadableStream)
          : null;

    if (!stream) {
      throw new StorageConfigurationError("S3 returned an unreadable response body.");
    }

    const chunks: Buffer[] = [];

    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }

    return Buffer.concat(chunks);
  }

  async deleteObject(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
  }

  async exists(key: string): Promise<boolean> {
    try {
      await this.client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );

      return true;
    } catch (error) {
      if (isS3MissingError(error)) {
        return false;
      }

      throw error;
    }
  }

  getPublicUrl(): string | null {
    return null;
  }

  private async sendGetObject(key: string) {
    try {
      return await this.client.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );
    } catch (error) {
      if (isS3MissingError(error)) {
        throw new StorageObjectNotFoundError(`Object "${key}" was not found.`);
      }

      throw error;
    }
  }

  private withPrefix(key: string): string {
    return this.prefix ? `${this.prefix}/${key}` : key;
  }
}

function createS3ClientConfig(config: S3StorageConfig) {
  return {
    region: config.region,
    forcePathStyle: config.forcePathStyle,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    ...(config.endpoint ? { endpoint: config.endpoint } : {}),
  };
}

function trimPrefix(value?: string): string | undefined {
  const trimmed = value?.trim().replace(/^\/+|\/+$/g, "");
  return trimmed ? trimmed : undefined;
}

function isWebReadableStream(value: unknown): value is globalThis.ReadableStream<Uint8Array> {
  return (
    !!value &&
    typeof value === "object" &&
    "getReader" in value &&
    typeof value.getReader === "function"
  );
}

function isS3MissingError(error: unknown) {
  if (
    error &&
    typeof error === "object" &&
    "name" in error &&
    "NotFound NoSuchKey".includes(String((error as { name: string }).name))
  ) {
    return true;
  }

  return (
    error instanceof S3ServiceException &&
    (error.name === "NoSuchKey" ||
      error.name === "NotFound" ||
      error.$metadata.httpStatusCode === 404)
  );
}
