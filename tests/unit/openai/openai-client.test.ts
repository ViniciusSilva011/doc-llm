const openAIClient = {
  embeddings: {
    create: vi.fn(async () => ({
      data: [{ embedding: Array.from({ length: 768 }, () => 0.1) }],
    })),
  },
  responses: {
    create: vi.fn(),
  },
};

const mocks = vi.hoisted(() => ({
  OpenAI: vi.fn(() => openAIClient),
}));

vi.mock("openai", () => ({
  default: mocks.OpenAI,
}));

describe("createOpenAIClient", () => {
  const originalEnv = {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_BASE_URL: process.env.OPENAI_BASE_URL,
    EMBEDDING_API_KEY: process.env.EMBEDDING_API_KEY,
    EMBEDDING_BASE_URL: process.env.EMBEDDING_BASE_URL,
    EMBEDDING_MODEL: process.env.EMBEDDING_MODEL,
  };

  afterEach(() => {
    restoreEnvValue("OPENAI_API_KEY", originalEnv.OPENAI_API_KEY);
    restoreEnvValue("OPENAI_BASE_URL", originalEnv.OPENAI_BASE_URL);
    restoreEnvValue("EMBEDDING_API_KEY", originalEnv.EMBEDDING_API_KEY);
    restoreEnvValue("EMBEDDING_BASE_URL", originalEnv.EMBEDDING_BASE_URL);
    restoreEnvValue("EMBEDDING_MODEL", originalEnv.EMBEDDING_MODEL);
  });

  it("connects embeddings to the local nomic-embed-text service", async () => {
    vi.resetModules();
    process.env.EMBEDDING_API_KEY = "ollama";
    process.env.EMBEDDING_BASE_URL = "http://127.0.0.1:11434/v1";
    process.env.EMBEDDING_MODEL = "nomic-embed-text";

    const { createEmbeddingClient } =
      await import("@/lib/services/openai/client");
    const { OpenAIService } = await import("@/lib/services/openai/service");

    const client = createEmbeddingClient();
    const service = new OpenAIService({
      embedding: client,
      generation: { responses: { create: vi.fn() } },
    } as never);

    await service.createEmbeddings(["connection check"]);

    expect(mocks.OpenAI).toHaveBeenCalledWith({
      apiKey: "ollama",
      baseURL: "http://127.0.0.1:11434/v1",
    });
    expect(openAIClient.embeddings.create).toHaveBeenCalledWith({
      model: "nomic-embed-text",
      input: ["connection check"],
    });
  });
});

function restoreEnvValue(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
}
