import "dotenv/config";

import OpenAI from "openai";

import { DEFAULT_EMBEDDING_DIMENSION } from "../src/lib/constants";

async function main() {
  const apiKey = process.env.EMBEDDING_API_KEY ?? "ollama";
  const baseURL =
    process.env.EMBEDDING_BASE_URL ?? "http://127.0.0.1:11434/v1";
  const model = process.env.EMBEDDING_MODEL ?? "nomic-embed-text";

  const client = new OpenAI({ apiKey, baseURL });
  const response = await client.embeddings.create({
    model,
    input: ["Embedding connection check."],
  });
  const embedding = response.data[0]?.embedding;

  if (!embedding || embedding.length === 0) {
    throw new Error(`${model} returned an empty embedding.`);
  }

  if (embedding.length !== DEFAULT_EMBEDDING_DIMENSION) {
    throw new Error(
      `Embedding dimension mismatch. Expected ${DEFAULT_EMBEDDING_DIMENSION}, received ${embedding.length}.`,
    );
  }

  console.log("Embedding connection succeeded.");
  console.log(`Model: ${model}`);
  console.log(`Dimension: ${embedding.length}`);
}

main().catch((error) => {
  const message =
    error instanceof Error
      ? error.message
      : "Embedding connection check failed.";

  console.error(`Embedding connection failed: ${message}`);
  process.exitCode = 1;
});
