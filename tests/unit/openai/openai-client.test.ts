const openAIClient = {
  embeddings: {
    create: vi.fn(async () => ({
      data: [{ embedding: Array.from({ length: 1536 }, () => 0.1) }],
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
    OPENAI_EMBEDDING_MODEL: process.env.OPENAI_EMBEDDING_MODEL,
  };

  afterEach(() => {
    restoreEnvValue("OPENAI_API_KEY", originalEnv.OPENAI_API_KEY);
    restoreEnvValue("OPENAI_BASE_URL", originalEnv.OPENAI_BASE_URL);
    restoreEnvValue("OPENAI_EMBEDDING_MODEL", originalEnv.OPENAI_EMBEDDING_MODEL);
  });

  it("connects embeddings to the local nomic-embed-text service", async () => {
    vi.resetModules();
    process.env.OPENAI_API_KEY = "ollama";
    process.env.OPENAI_BASE_URL = "http://127.0.0.1:11434/v1";
    process.env.OPENAI_EMBEDDING_MODEL = "nomic-embed-text";

    const { createOpenAIClient } = await import("@/lib/services/openai/client");
    const { OpenAIService } = await import("@/lib/services/openai/service");

    const client = createOpenAIClient();
    const service = new OpenAIService(client);

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
