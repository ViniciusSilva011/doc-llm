export interface TextChunk {
  index: number;
  content: string;
  tokenCount: number;
  metadata: Record<string, unknown>;
}

export interface QueryResultChunk {
  id: number;
  documentId: number;
  content: string;
  score: number;
}
