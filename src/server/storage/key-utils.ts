import { createHash, randomUUID } from "node:crypto";

const FILENAME_SANITIZE_PATTERN = /[^a-zA-Z0-9._-]+/g;

export function sanitizeFilename(input: string): string {
  const normalized = input
    .normalize("NFKC")
    .replace(/\\/g, "/")
    .split("/")
    .pop()
    ?.replace(/[\u0000-\u001f\u007f]+/g, "")
    .trim();

  if (!normalized) {
    return "document.pdf";
  }

  const extensionIndex = normalized.lastIndexOf(".");
  const stem = extensionIndex > 0 ? normalized.slice(0, extensionIndex) : normalized;
  const extension = extensionIndex > 0 ? normalized.slice(extensionIndex + 1) : "";
  const safeStem = stem.replace(FILENAME_SANITIZE_PATTERN, "-").replace(/^-+|-+$/g, "");
  const safeExtension = extension.replace(/[^a-zA-Z0-9]+/g, "").toLowerCase();

  const finalStem = safeStem || "document";

  return safeExtension ? `${finalStem}.${safeExtension}` : finalStem;
}

export function createDocumentStorageKey(input: {
  ownerId: string;
  originalFilename: string;
  now?: Date;
  id?: string;
}) {
  const safeFilename = sanitizeFilename(input.originalFilename);
  const filenameWithoutExtension = safeFilename.replace(/\.[^.]+$/, "");
  const now = input.now ?? new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  const id = input.id ?? randomUUID();

  return `documents/${input.ownerId}/${year}/${month}/${day}/${id}-${filenameWithoutExtension}.pdf`;
}

export function computeSha256Hex(body: Buffer): string {
  return createHash("sha256").update(body).digest("hex");
}
