import { chunkText } from "@/lib/services/ingestion/chunking";

describe("chunkText", () => {
  it("splits long content into overlapping chunks", () => {
    const content = "A".repeat(900) + "\n\n" + "B".repeat(900) + "\n\n" + "C".repeat(900);

    const chunks = chunkText(content, {
      maxCharacters: 1000,
      overlapCharacters: 100,
    });

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0]?.content.length).toBeLessThanOrEqual(1000);
    expect(chunks[1]?.metadata.startOffset).toBeLessThan(
      chunks[0]?.metadata.endOffset as number,
    );
  });

  it("returns an empty array for blank content", () => {
    expect(chunkText("   ")).toEqual([]);
  });
});
