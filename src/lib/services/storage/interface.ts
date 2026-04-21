export interface PutObjectInput {
  key: string;
  body: Buffer;
  contentType?: string;
  metadata?: Record<string, string>;
}

export interface StoredObject {
  key: string;
  body: Buffer;
  contentType: string;
  metadata: Record<string, string>;
  size: number;
}

export interface ObjectStorage {
  createObjectKey(parts: string[]): string;
  putObject(input: PutObjectInput): Promise<{ key: string; size: number }>;
  getObject(key: string): Promise<StoredObject>;
  deleteObject(key: string): Promise<void>;
}
