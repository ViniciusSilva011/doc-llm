import {
  LocalObjectStorageService,
  S3ObjectStorageService,
  StorageConfigurationError,
  createObjectStorageService,
  resolveStorageRuntimeConfig,
} from "@/server/storage";

describe("storage factory", () => {
  it("returns local storage by default when configured for local", () => {
    const storage = createObjectStorageService({
      backend: "local",
      localDir: "./data/uploads",
    });

    expect(storage).toBeInstanceOf(LocalObjectStorageService);
  });

  it("returns s3 storage when configured", () => {
    const storage = createObjectStorageService({
      backend: "s3",
      bucket: "doc-llm",
      region: "eu-west-2",
      accessKeyId: "key",
      secretAccessKey: "secret",
      forcePathStyle: true,
    });

    expect(storage).toBeInstanceOf(S3ObjectStorageService);
  });

  it("fails clearly on incomplete s3 configuration", () => {
    expect(() =>
      resolveStorageRuntimeConfig({
        STORAGE_BACKEND: "s3",
        STORAGE_LOCAL_DIR: "./data/uploads",
        AWS_S3_FORCE_PATH_STYLE: false,
      }),
    ).toThrow(StorageConfigurationError);
  });
});
