export class StorageConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StorageConfigurationError";
  }
}

export class StoragePathError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StoragePathError";
  }
}

export class StorageObjectNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StorageObjectNotFoundError";
  }
}
