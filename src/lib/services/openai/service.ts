import type OpenAI from "openai";

import { DEFAULT_EMBEDDING_DIMENSION } from "@/lib/constants";
import { env } from "@/lib/env";
import {
  createEmbeddingClient,
  createOpenAIClient,
} from "@/lib/services/openai/client";

type OpenAIServiceClients = {
  embedding: Pick<OpenAI, "embeddings">;
  generation: Pick<OpenAI, "responses">;
};

export class OpenAIService {
  constructor(private readonly clients: OpenAIServiceClients) {}

  async createEmbeddings(input: string[]): Promise<number[][]> {
    if (input.length === 0) {
      return [];
    }

    const response = await this.clients.embedding.embeddings.create({
      model: env.EMBEDDING_MODEL,
      input,
    });

    return response.data.map((item) => {
      if (item.embedding.length !== DEFAULT_EMBEDDING_DIMENSION) {
        throw new Error(
          `Embedding dimension mismatch. Expected ${DEFAULT_EMBEDDING_DIMENSION}, received ${item.embedding.length}.`,
        );
      }

      return item.embedding;
    });
  }

  async generateText(params: {
    instructions?: string;
    input: string;
  }): Promise<string> {
    const request: {
      model: string;
      input: string;
      instructions?: string | null;
    } = {
      model: env.OPENAI_GENERATION_MODEL,
      input: params.input,
    };

    if (params.instructions) {
      request.instructions = params.instructions;
    }

    const response = await this.clients.generation.responses.create(request);

    return response.output_text.trim();
  }
}

let openAIService: OpenAIService | undefined;

export function createOpenAIService(): OpenAIService {
  if (!openAIService) {
    openAIService = new OpenAIService({
      embedding: createEmbeddingClient(),
      generation: createOpenAIClient(),
    });
  }

  return openAIService;
}
