import {
  computeSha256Hex,
  createDocumentStorageKey,
  sanitizeFilename,
} from "@/server/storage";

describe("storage key helpers", () => {
  it("sanitizes filenames and strips traversal segments", () => {
    expect(sanitizeFilename("../Quarterly Report (Final).PDF")).toBe(
      "Quarterly-Report-Final.pdf",
    );
  });

  it("creates namespaced storage keys with a stable pdf suffix", () => {
    const key = createDocumentStorageKey({
      ownerId: "user-123",
      originalFilename: "Quarterly Report.pdf",
      now: new Date("2026-04-21T09:15:00.000Z"),
      id: "fixed-id",
    });

    expect(key).toBe("documents/user-123/2026/04/21/fixed-id-Quarterly-Report.pdf");
  });

  it("computes sha256 checksums", () => {
    expect(computeSha256Hex(Buffer.from("hello", "utf8"))).toBe(
      "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
    );
  });
});
