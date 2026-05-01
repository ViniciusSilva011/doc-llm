import { vi } from "vitest";

import {
  fetchRelevantChunks,
  formatDocumentSources,
} from "@/lib/services/documents/query";
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

    expect(
      dependencies.embeddingProvider.createEmbeddings,
    ).toHaveBeenCalledWith([question]);
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

  it("does not interpolate the question into the SQL text", async () => {
    const dependencies = createDependencies();
    const maliciousQuestion = "x'); DROP TABLE documents; --";

    await fetchRelevantChunks(maliciousQuestion, {}, dependencies);

    const [sql] = dependencies.database.query.mock.calls[0] ?? [];

    expect(sql).not.toContain(maliciousQuestion);
    expect(
      dependencies.embeddingProvider.createEmbeddings,
    ).toHaveBeenCalledWith([maliciousQuestion]);
  });

  it("uses placeholders for user, document, and limit filters", async () => {
    const dependencies = createDependencies();

    await fetchRelevantChunks(
      "show me the results",
      {
        userId: 7,
        documentIds: [11, 13],
        limit: 3,
      },
      dependencies,
    );

    const [sql, values] = dependencies.database.query.mock.calls[0] ?? [];

    expect(sql).toContain("d.owner_id = $2");
    expect(sql).toContain("dc.document_id = ANY($3::integer[])");
    expect(sql).toContain("LIMIT $4");
    expect(sql).not.toContain("owner_id = 7");
    expect(sql).not.toContain("document_id = ANY([11,13]");
    expect(sql).not.toContain("LIMIT 3");
    expect(values).toEqual(["[0.1,0.2,0.3]", 7, [11, 13], 3]);
  });

  it("handles no matching chunks", async () => {
    const dependencies = createDependencies([]);

    await expect(
      fetchRelevantChunks(question, {}, dependencies),
    ).resolves.toEqual([]);
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

describe("formatDocumentSources", () => {
  it("formats matching chunks as numbered sources", () => {
    const sources = formatDocumentSources([
      {
        id: 1,
        documentId: 10,
        content: "The first chunk.",
        score: 0.93456,
      },
      {
        id: 2,
        documentId: 10,
        content: "The second chunk.",
        score: 0.8,
      },
    ]);

    expect(sources).toBe(
      "Source 1 (document 10, score 0.935):\nThe first chunk.\n\nSource 2 (document 10, score 0.800):\nThe second chunk.",
    );
  });
});
