import "dotenv/config";

import OpenAI from "openai";

const DEFAULT_OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

async function main() {
  const apiKey = requireEnv("OPENROUTER_API_KEY");
  const model = requireEnv("OPENROUTER_MODEL");
  const baseURL =
    process.env.OPENROUTER_BASE_URL?.trim() || DEFAULT_OPENROUTER_BASE_URL;

  const client = new OpenAI({ apiKey, baseURL });
  const response = await client.chat.completions.create({
    model,
    messages: [
      {
        role: "system",
        content: "Reply with exactly: ok",
      },
      {
        role: "user",
        content: "OpenRouter connection check.",
      },
    ],
  });
  console.log("response: ", response);

  const content = response.choices[0]?.message.content;
  if (typeof content !== "string" || content.trim().length === 0) {
    throw new Error("OpenRouter returned an empty assistant response.");
  }

  console.log("OpenRouter connection succeeded.");
  console.log(`Base URL: ${baseURL}`);
  console.log(`Model: ${model}`);
  console.log(`Model response: ${content.trim()}`);
}

function requireEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required for the OpenRouter connection check.`);
  }

  return value;
}

main().catch((error) => {
  const message =
    error instanceof Error
      ? error.message
      : "OpenRouter connection check failed.";
  console.error(`OpenRouter connection failed: ${message}`);
  process.exitCode = 1;
});
