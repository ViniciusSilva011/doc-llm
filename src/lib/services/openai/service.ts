import type OpenAI from "openai";

import { DEFAULT_EMBEDDING_DIMENSION } from "@/lib/constants";
import { env } from "@/lib/env";
import { createOpenAIClient } from "@/lib/services/openai/client";

export class OpenAIService {
  constructor(private readonly client: OpenAI) {}

  async createEmbeddings(input: string[]): Promise<number[][]> {
    if (input.length === 0) {
      return [];
    }

    const response = await this.client.embeddings.create({
      model: env.OPENAI_EMBEDDING_MODEL,
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

    const response = await this.client.responses.create(request);

    return response.output_text.trim();
  }
}

let openAIService: OpenAIService | undefined;

export function createOpenAIService(): OpenAIService {
  if (!openAIService) {
    openAIService = new OpenAIService(createOpenAIClient());
  }

  return openAIService;
}
