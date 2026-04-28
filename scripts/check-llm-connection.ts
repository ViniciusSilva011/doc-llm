import "dotenv/config";

async function main() {
  const { env } = await import("../src/lib/env");
  const { createOpenAIService } = await import(
    "../src/lib/services/openai/service"
  );

  const service = createOpenAIService();
  const response = await service.generateText({
    instructions: "Reply with exactly: ok",
    input: "Connection check.",
  });

  if (response.length === 0) {
    throw new Error(`${env.LLM_PROVIDER} returned an empty response.`);
  }

  console.log(`${env.LLM_PROVIDER} connection succeeded.`);
  console.log(`Model response: ${response}`);
}

main().catch((error) => {
  const message =
    error instanceof Error ? error.message : "LLM connection check failed.";

  console.error(`LLM connection failed: ${message}`);
  process.exitCode = 1;
});
