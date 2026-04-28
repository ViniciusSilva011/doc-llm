import OpenAI from "openai";

import { env } from "@/lib/env";

let generationClient: OpenAI | undefined;
let openRouterClient: OpenAI | undefined;
let embeddingClient: OpenAI | undefined;

export function createOpenAIClient(): OpenAI {
  if (!env.OPENAI_API_KEY || !env.OPENAI_GENERATION_MODEL) {
    throw new Error("OpenAI generation is not configured.");
  }

  if (!generationClient) {
    generationClient = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
      baseURL: env.OPENAI_BASE_URL,
    });
  }

  return generationClient;
}

export function createOpenRouterClient(): OpenAI {
  if (!env.OPENROUTER_API_KEY || !env.OPENROUTER_MODEL) {
    throw new Error("OpenRouter generation is not configured.");
  }

  if (!openRouterClient) {
    openRouterClient = new OpenAI({
      apiKey: env.OPENROUTER_API_KEY,
      baseURL: env.OPENROUTER_BASE_URL,
    });
  }

  return openRouterClient;
}

export function createEmbeddingClient(): OpenAI {
  if (!embeddingClient) {
    embeddingClient = new OpenAI({
      apiKey: env.EMBEDDING_API_KEY,
      baseURL: env.EMBEDDING_BASE_URL,
    });
  }

  return embeddingClient;
}
