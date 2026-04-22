import pdf from "@cedrugs/pdf-parse";

export interface ExtractedText {
  text: string;
  metadata: Record<string, unknown>;
}

export class TextExtractionService {
  async extract(params: {
    body: Buffer;
    contentType: string;
    objectKey: string;
  }): Promise<ExtractedText> {
    const normalizedContentType = params.contentType.toLowerCase();

    if (normalizedContentType === "application/pdf") {
      const parsed = await pdf(params.body);

      return {
        text: parsed.text.trim(),
        metadata: {
          objectKey: params.objectKey,
          extractedAs: "pdf",
          pageCount: parsed.numpages,
          info: parsed.info ?? null,
        },
      };
    }

    if (normalizedContentType.includes("application/json")) {
      const json = JSON.parse(params.body.toString("utf8")) as unknown;
      return {
        text: JSON.stringify(json, null, 2),
        metadata: { objectKey: params.objectKey, extractedAs: "json" },
      };
    }

    if (
      normalizedContentType.startsWith("text/") ||
      normalizedContentType.includes("application/xml") ||
      normalizedContentType.includes("application/javascript")
    ) {
      return {
        text: params.body.toString("utf8"),
        metadata: { objectKey: params.objectKey, extractedAs: "text" },
      };
    }

    return {
      text: params.body.toString("utf8"),
      metadata: {
        objectKey: params.objectKey,
        extractedAs: "fallback-text",
      },
    };
  }
}
