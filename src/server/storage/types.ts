export type StorageBackend = "local" | "s3";

export interface StoredObject {
  backend: StorageBackend;
  key: string;
  originalFilename: string;
  contentType: string;
  byteSize: number;
  checksum: string | null;
}

export interface PutObjectParams {
  key: string;
  body: Buffer;
  originalFilename: string;
  contentType: string;
  checksum?: string;
}

export interface LocalStorageConfig {
  backend: "local";
  localDir: string;
}

export interface S3StorageConfig {
  backend: "s3";
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  endpoint?: string | undefined;
  forcePathStyle: boolean;
  prefix?: string | undefined;
}

export type StorageRuntimeConfig = LocalStorageConfig | S3StorageConfig;
