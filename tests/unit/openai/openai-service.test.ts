import { DEFAULT_EMBEDDING_DIMENSION } from "@/lib/constants";
import { OpenAIService } from "@/lib/services/openai/service";

describe("OpenAIService", () => {
  it("maps embedding responses into vectors", async () => {
    const client = {
      embeddings: {
        create: async () => ({
          data: [
            {
              embedding: Array.from(
                { length: DEFAULT_EMBEDDING_DIMENSION },
                () => 0.1,
              ),
            },
          ],
        }),
      },
      responses: {
        create: async () => ({
          output_text: "Hello world",
        }),
      },
    };

    const service = new OpenAIService({
      embedding: client,
      generation: client,
    } as never);

    const embeddings = await service.createEmbeddings(["hello"]);

    expect(embeddings).toHaveLength(1);
    expect(embeddings[0]).toHaveLength(DEFAULT_EMBEDDING_DIMENSION);
  });

  it("returns trimmed generated text", async () => {
    const client = {
      embeddings: {
        create: async () => ({
          data: [
            {
              embedding: Array.from(
                { length: DEFAULT_EMBEDDING_DIMENSION },
                () => 0.1,
              ),
            },
          ],
        }),
      },
      responses: {
        create: async () => ({
          output_text: "  Generated answer  ",
        }),
      },
    };

    const service = new OpenAIService({
      embedding: client,
      generation: client,
    } as never);

    await expect(
      service.generateText({ input: "question", instructions: "be concise" }),
    ).resolves.toBe("Generated answer");
  });
});
