import { env } from "@/lib/env";
import type { ObjectStorageService } from "@/server/storage/object-storage-service";
import { StorageConfigurationError } from "@/server/storage/errors";
import { LocalObjectStorageService } from "@/server/storage/local-storage-service";
import { S3ObjectStorageService } from "@/server/storage/s3-storage-service";
import type { StorageRuntimeConfig } from "@/server/storage/types";

let storageServiceSingleton: ObjectStorageService | undefined;

export interface StorageEnvConfig {
  STORAGE_BACKEND: "local" | "s3";
  STORAGE_LOCAL_DIR: string;
  AWS_REGION?: string | undefined;
  AWS_S3_BUCKET?: string | undefined;
  AWS_ACCESS_KEY_ID?: string | undefined;
  AWS_SECRET_ACCESS_KEY?: string | undefined;
  AWS_S3_ENDPOINT?: string | undefined;
  AWS_S3_FORCE_PATH_STYLE: boolean;
  AWS_S3_PREFIX?: string | undefined;
}

export function createObjectStorageService(
  config: StorageRuntimeConfig = getStorageRuntimeConfigFromEnv(),
): ObjectStorageService {
  return config.backend === "s3"
    ? new S3ObjectStorageService(config)
    : new LocalObjectStorageService(config);
}

export function getObjectStorageService(): ObjectStorageService {
  if (!storageServiceSingleton) {
    storageServiceSingleton = createObjectStorageService();
  }

  return storageServiceSingleton;
}

export function getStorageRuntimeConfigFromEnv(): StorageRuntimeConfig {
  return resolveStorageRuntimeConfig({
    STORAGE_BACKEND: env.STORAGE_BACKEND,
    STORAGE_LOCAL_DIR: env.STORAGE_LOCAL_DIR,
    AWS_REGION: env.AWS_REGION,
    AWS_S3_BUCKET: env.AWS_S3_BUCKET,
    AWS_ACCESS_KEY_ID: env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: env.AWS_SECRET_ACCESS_KEY,
    AWS_S3_ENDPOINT: env.AWS_S3_ENDPOINT,
    AWS_S3_FORCE_PATH_STYLE: env.AWS_S3_FORCE_PATH_STYLE,
    AWS_S3_PREFIX: env.AWS_S3_PREFIX,
  });
}

export function resolveStorageRuntimeConfig(config: StorageEnvConfig): StorageRuntimeConfig {
  if (config.STORAGE_BACKEND === "s3") {
    if (!config.AWS_REGION) {
      throw new StorageConfigurationError("AWS_REGION is required when STORAGE_BACKEND=s3.");
    }

    if (!config.AWS_S3_BUCKET) {
      throw new StorageConfigurationError("AWS_S3_BUCKET is required when STORAGE_BACKEND=s3.");
    }

    if (!config.AWS_ACCESS_KEY_ID) {
      throw new StorageConfigurationError(
        "AWS_ACCESS_KEY_ID is required when STORAGE_BACKEND=s3.",
      );
    }

    if (!config.AWS_SECRET_ACCESS_KEY) {
      throw new StorageConfigurationError(
        "AWS_SECRET_ACCESS_KEY is required when STORAGE_BACKEND=s3.",
      );
    }

    return {
      backend: "s3",
      bucket: config.AWS_S3_BUCKET,
      region: config.AWS_REGION,
      accessKeyId: config.AWS_ACCESS_KEY_ID,
      secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
      forcePathStyle: config.AWS_S3_FORCE_PATH_STYLE,
      ...(config.AWS_S3_ENDPOINT ? { endpoint: config.AWS_S3_ENDPOINT } : {}),
      ...(config.AWS_S3_PREFIX ? { prefix: config.AWS_S3_PREFIX } : {}),
    };
  }

  return {
    backend: "local",
    localDir: config.STORAGE_LOCAL_DIR,
  };
}

export function resetObjectStorageServiceForTests() {
  storageServiceSingleton = undefined;
}
