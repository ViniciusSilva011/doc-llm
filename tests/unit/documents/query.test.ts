import { vi } from "vitest";

import { fetchRelevantChunks } from "@/lib/services/documents/query";
import type { QueryResultChunk } from "@/types/ingestion";

const question = "what is the supply-chain method?";
const embedding = [0.1, 0.2, 0.3];

function createDependencies(rows: QueryResultChunk[] = []) {
  return {
    embeddingProvider: {
      createEmbeddings: vi.fn().mockResolvedValue([embedding]),
    },
    database: {
      query: vi.fn().mockResolvedValue({ rows }),
    },
  };
}

describe("fetchRelevantChunks", () => {
  it("retrieves chunks using the question embedding", async () => {
    const chunks: QueryResultChunk[] = [
      {
        id: 1,
        documentId: 10,
        content: "The supply-chain method starts with supplier qualification.",
        score: 0.93,
      },
      {
        id: 2,
        documentId: 20,
        content: "Procurement teams review shipping and fulfillment steps.",
        score: 0.87,
      },
    ];
    const dependencies = createDependencies(chunks);

    const result = await fetchRelevantChunks(question, {}, dependencies);

    expect(dependencies.embeddingProvider.createEmbeddings).toHaveBeenCalledWith([
      question,
    ]);
    expect(dependencies.database.query).toHaveBeenCalledWith(
      expect.any(String),
      expect.arrayContaining(["[0.1,0.2,0.3]"]),
    );
    expect(result).toEqual(chunks);
  });

  it("uses vector similarity ordering", async () => {
    const dependencies = createDependencies();

    await fetchRelevantChunks(question, {}, dependencies);

    const [sql] = dependencies.database.query.mock.calls[0] ?? [];

    expect(sql).toContain("embedding <=> $1::vector");
    expect(sql).toContain("ORDER BY");
    expect(sql).toContain("LIMIT");
  });

  it("supports configurable limit", async () => {
    const dependencies = createDependencies();

    await fetchRelevantChunks(question, { limit: 5 }, dependencies);

    const [, values] = dependencies.database.query.mock.calls[0] ?? [];

    expect(values).toContain(5);
  });

  it("handles no matching chunks", async () => {
    const dependencies = createDependencies([]);

    await expect(fetchRelevantChunks(question, {}, dependencies)).resolves.toEqual([]);
  });

  it("propagates embedding and database errors", async () => {
    const embeddingError = new Error("embedding failed");
    const databaseError = new Error("database failed");
    const embeddingFailure = createDependencies();
    const databaseFailure = createDependencies();

    embeddingFailure.embeddingProvider.createEmbeddings.mockRejectedValue(
      embeddingError,
    );
    databaseFailure.database.query.mockRejectedValue(databaseError);

    await expect(
      fetchRelevantChunks(question, {}, embeddingFailure),
    ).rejects.toThrow(embeddingError);
    await expect(
      fetchRelevantChunks(question, {}, databaseFailure),
    ).rejects.toThrow(databaseError);
  });
});
