import { OpenAIService } from "@/lib/services/openai/service";

describe("OpenAIService", () => {
  it("maps embedding responses into vectors", async () => {
    const service = new OpenAIService({
      embeddings: {
        create: async () => ({
          data: [{ embedding: Array.from({ length: 1536 }, () => 0.1) }],
        }),
      },
      responses: {
        create: async () => ({
          output_text: "Hello world",
        }),
      },
    } as never);

    const embeddings = await service.createEmbeddings(["hello"]);

    expect(embeddings).toHaveLength(1);
    expect(embeddings[0]).toHaveLength(1536);
  });

  it("returns trimmed generated text", async () => {
    const service = new OpenAIService({
      embeddings: {
        create: async () => ({
          data: [{ embedding: Array.from({ length: 1536 }, () => 0.1) }],
        }),
      },
      responses: {
        create: async () => ({
          output_text: "  Generated answer  ",
        }),
      },
    } as never);

    await expect(
      service.generateText({ input: "question", instructions: "be concise" }),
    ).resolves.toBe("Generated answer");
  });
});
