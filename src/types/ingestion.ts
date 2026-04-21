export interface TextChunk {
  index: number;
  content: string;
  tokenCount: number;
  metadata: Record<string, unknown>;
}

export interface QueryResultChunk {
  id: string;
  documentId: string;
  content: string;
  score: number;
}
