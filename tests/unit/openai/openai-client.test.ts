const openAIClient = {
  embeddings: {
    create: vi.fn(async () => ({
      data: [{ embedding: Array.from({ length: 768 }, () => 0.1) }],
    })),
  },
  responses: {
    create: vi.fn(),
  },
  chat: {
    completions: {
      create: vi.fn(async () => ({
        choices: [{ message: { content: "connection ok" } }],
      })),
    },
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
    LLM_PROVIDER: process.env.LLM_PROVIDER,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_BASE_URL: process.env.OPENAI_BASE_URL,
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    OPENROUTER_BASE_URL: process.env.OPENROUTER_BASE_URL,
    OPENROUTER_MODEL: process.env.OPENROUTER_MODEL,
    EMBEDDING_API_KEY: process.env.EMBEDDING_API_KEY,
    EMBEDDING_BASE_URL: process.env.EMBEDDING_BASE_URL,
    EMBEDDING_MODEL: process.env.EMBEDDING_MODEL,
  };

  afterEach(() => {
    restoreEnvValue("LLM_PROVIDER", originalEnv.LLM_PROVIDER);
    restoreEnvValue("OPENAI_API_KEY", originalEnv.OPENAI_API_KEY);
    restoreEnvValue("OPENAI_BASE_URL", originalEnv.OPENAI_BASE_URL);
    restoreEnvValue("OPENROUTER_API_KEY", originalEnv.OPENROUTER_API_KEY);
    restoreEnvValue("OPENROUTER_BASE_URL", originalEnv.OPENROUTER_BASE_URL);
    restoreEnvValue("OPENROUTER_MODEL", originalEnv.OPENROUTER_MODEL);
    restoreEnvValue("EMBEDDING_API_KEY", originalEnv.EMBEDDING_API_KEY);
    restoreEnvValue("EMBEDDING_BASE_URL", originalEnv.EMBEDDING_BASE_URL);
    restoreEnvValue("EMBEDDING_MODEL", originalEnv.EMBEDDING_MODEL);
  });

  it("configures embeddings for the local nomic-embed-text service", async () => {
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
      openAI: { responses: { create: vi.fn() } },
      openRouter: { chat: { completions: { create: vi.fn() } } },
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

  it("configures generation for OpenRouter by default", async () => {
    vi.resetModules();
    process.env.LLM_PROVIDER = "openrouter";
    process.env.OPENROUTER_API_KEY = "test-openrouter-key";
    process.env.OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
    process.env.OPENROUTER_MODEL = "openai/gpt-5-mini";

    const { createOpenRouterClient } =
      await import("@/lib/services/openai/client");
    const { OpenAIService } = await import("@/lib/services/openai/service");

    const client = createOpenRouterClient();
    const service = new OpenAIService({
      embedding: { embeddings: { create: vi.fn() } },
      openAI: { responses: { create: vi.fn() } },
      openRouter: client,
    } as never);

    await expect(
      service.generateText({
        instructions: "Reply with ok.",
        input: "connection check",
      }),
    ).resolves.toBe("connection ok");

    expect(mocks.OpenAI).toHaveBeenCalledWith({
      apiKey: "test-openrouter-key",
      baseURL: "https://openrouter.ai/api/v1",
    });
    expect(openAIClient.chat.completions.create).toHaveBeenCalledWith({
      model: "openai/gpt-5-mini",
      messages: [
        {
          role: "system",
          content: "Reply with ok.",
        },
        {
          role: "user",
          content: "connection check",
        },
      ],
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
