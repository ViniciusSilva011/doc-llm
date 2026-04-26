import OpenAI from "openai";

import { env } from "@/lib/env";

let generationClient: OpenAI | undefined;
let embeddingClient: OpenAI | undefined;

export function createOpenAIClient(): OpenAI {
  if (!generationClient) {
    generationClient = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
      baseURL: env.OPENAI_BASE_URL,
    });
  }

  return generationClient;
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
