import "dotenv/config";

import { randomUUID } from "node:crypto";

import { S3ObjectStorageService } from "../src/server/storage/s3-storage-service";
import type { S3StorageConfig } from "../src/server/storage/types";

async function main() {
  const service = new S3ObjectStorageService(getS3Config());
  const key = `connection-checks/${randomUUID()}.txt`;
  const body = Buffer.from("doc-llm s3 connection check", "utf8");
  let storedKey: string | undefined;

  try {
    const stored = await service.putObject({
      key,
      body,
      originalFilename: "connection-check.txt",
      contentType: "text/plain",
    });
    storedKey = stored.key;

    const existsAfterPut = await service.exists(key);
    if (!existsAfterPut) {
      throw new Error(`S3 object "${key}" was not found after upload.`);
    }

    const readBody = await service.getObjectBuffer(key);
    if (!readBody.equals(body)) {
      throw new Error(`S3 object "${key}" did not round-trip correctly.`);
    }

    await service.deleteObject(key);

    const existsAfterDelete = await service.exists(key);
    if (existsAfterDelete) {
      throw new Error(`S3 object "${key}" still exists after deletion.`);
    }

    console.log("S3 connection succeeded.");
    console.log(`Bucket: ${process.env.AWS_S3_BUCKET}`);
    console.log(`Object: ${storedKey}`);
  } finally {
    if (storedKey) {
      await service.deleteObject(key).catch(() => undefined);
    }
  }
}

function getS3Config(): S3StorageConfig {
  return {
    backend: "s3",
    bucket: requireEnv("AWS_S3_BUCKET"),
    region: requireEnv("AWS_REGION"),
    accessKeyId: requireEnv("AWS_ACCESS_KEY_ID"),
    secretAccessKey: requireEnv("AWS_SECRET_ACCESS_KEY"),
    forcePathStyle: parseBoolean(process.env.AWS_S3_FORCE_PATH_STYLE),
    ...(process.env.AWS_S3_ENDPOINT
      ? { endpoint: process.env.AWS_S3_ENDPOINT }
      : {}),
    ...(process.env.AWS_S3_PREFIX
      ? { prefix: process.env.AWS_S3_PREFIX }
      : {}),
  };
}

function requireEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required for the S3 connection check.`);
  }

  return value;
}

function parseBoolean(value: string | undefined) {
  return value === "true";
}

main().catch((error) => {
  const message =
    error instanceof Error ? error.message : "S3 connection check failed.";

  console.error(`S3 connection failed: ${message}`);
  process.exitCode = 1;
});
