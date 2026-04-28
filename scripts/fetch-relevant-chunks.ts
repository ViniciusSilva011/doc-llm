import "dotenv/config";

type CliOptions = {
  question: string;
  userId?: number;
  documentIds?: number[];
  limit?: number;
};

function parsePositiveInteger(value: string, name: string) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer.`);
  }

  return parsed;
}

function parseArgs(args: string[]): CliOptions {
  const questionParts: string[] = [];
  const options: Omit<CliOptions, "question"> = {};

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (!arg) {
      continue;
    }

    if (arg === "--user-id") {
      const value = args[index + 1];
      if (!value) {
        throw new Error("--user-id requires a value.");
      }

      options.userId = parsePositiveInteger(value, "--user-id");
      index += 1;
      continue;
    }

    if (arg === "--document-id") {
      const value = args[index + 1];
      if (!value) {
        throw new Error("--document-id requires a value.");
      }

      options.documentIds = [
        ...(options.documentIds ?? []),
        parsePositiveInteger(value, "--document-id"),
      ];
      index += 1;
      continue;
    }

    if (arg === "--document-ids") {
      const value = args[index + 1];
      if (!value) {
        throw new Error("--document-ids requires a comma-separated value.");
      }

      options.documentIds = value
        .split(",")
        .filter(Boolean)
        .map((id) => parsePositiveInteger(id.trim(), "--document-ids"));
      index += 1;
      continue;
    }

    if (arg === "--limit") {
      const value = args[index + 1];
      if (!value) {
        throw new Error("--limit requires a value.");
      }

      options.limit = parsePositiveInteger(value, "--limit");
      index += 1;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      printUsage();
      process.exit(0);
    }

    questionParts.push(arg);
  }

  const question = questionParts.join(" ").trim();
  if (!question) {
    throw new Error("Pass a question to retrieve relevant chunks.");
  }

  return {
    ...options,
    question,
  };
}

function printUsage() {
  console.log(`Usage:
  npm run test:fetch-relevant-chunks -- "What does the document say about supply-chain?"

Options:
  --user-id <id>           Only return chunks from documents owned by this user.
  --document-id <id>       Restrict to a document. Can be repeated.
  --document-ids <ids>     Restrict to comma-separated document ids.
  --limit <count>          Override INGESTION_QUERY_MATCH_LIMIT.`);
}

async function main() {
  const { question, userId, documentIds, limit } = parseArgs(
    process.argv.slice(2),
  );
  const [{ pool }, { fetchRelevantChunks }] = await Promise.all([
    import("../src/db/client"),
    import("../src/lib/services/documents/query"),
  ]);

  try {
    const matches = await fetchRelevantChunks(question, {
      ...(userId ? { userId } : {}),
      ...(documentIds?.length ? { documentIds } : {}),
      ...(limit ? { limit } : {}),
    });

    console.log(
      JSON.stringify(
        {
          question,
          count: matches.length,
          chunks: matches,
        },
        null,
        2,
      ),
    );
  } finally {
    await pool.end();
  }
}

main()
  .catch((error) => {
    const message =
      error instanceof Error ? error.message : "Failed to fetch chunks.";

    console.error(message);
    printUsage();
    process.exitCode = 1;
  });
