import { chunkText } from "@/lib/services/ingestion/chunking";

describe("chunkText", () => {
  it("splits long content on sentence boundaries with whole sentence overlap", () => {
    const content = [
      "Alpha sentence one is a steady opening.",
      "Alpha sentence two keeps the first chunk full.",
      "Beta sentence three should overlap into the next chunk.",
      "Gamma sentence four should be in the second chunk.",
      "Delta sentence five closes the content.",
    ].join(" ");

    const chunks = chunkText(content, {
      maxCharacters: 120,
      overlapPercent: 30,
    });

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0]?.content.length).toBeLessThanOrEqual(120);
    expect(chunks[0]?.content).toMatch(/\.$/);
    expect(chunks[1]?.content).toMatch(/\.$/);
    expect(chunks[1]?.metadata.startOffset).toBeLessThan(
      chunks[0]?.metadata.endOffset as number,
    );
    expect(chunks[1]?.content).toContain(
      "Beta sentence three should overlap into the next chunk.",
    );
  });

  it("preserves paragraph structure when assembling chunks", () => {
    const content = [
      "First paragraph opens with one sentence. First paragraph keeps going.",
      "",
      "Second paragraph starts here. Second paragraph follows.",
    ].join("\n");

    const chunks = chunkText(content, {
      maxCharacters: 180,
      overlapPercent: 20,
    });

    expect(chunks).toHaveLength(1);
    expect(chunks[0]?.content).toContain("\n\nSecond paragraph starts here.");
    expect(chunks[0]?.metadata.paragraphCount).toBe(2);
    expect(chunks[0]?.metadata.sentenceCount).toBe(4);
  });

  it("hard splits oversized sentences", () => {
    const content = `${"A".repeat(180)}. Short closing sentence.`;

    const chunks = chunkText(content, {
      maxCharacters: 80,
      overlapPercent: 0,
    });

    expect(chunks.length).toBeGreaterThan(2);
    expect(chunks.every((chunk) => chunk.content.length <= 80)).toBe(true);
  });

  it("returns an empty array for blank content", () => {
    expect(chunkText("   ")).toEqual([]);
  });
});
