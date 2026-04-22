export class DocumentUploadValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DocumentUploadValidationError";
  }
}

export class DocumentUploadProcessingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DocumentUploadProcessingError";
  }
}
