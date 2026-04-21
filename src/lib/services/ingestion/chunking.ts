import { env } from "@/lib/env";
import type { TextChunk } from "@/types/ingestion";

function findChunkBoundary(input: string, start: number, tentativeEnd: number): number {
  const minimumCandidate = start + Math.floor((tentativeEnd - start) * 0.6);
  const breakpoints = [input.lastIndexOf("\n\n", tentativeEnd), input.lastIndexOf(". ", tentativeEnd), input.lastIndexOf(" ", tentativeEnd)];

  for (const breakpoint of breakpoints) {
    if (breakpoint > minimumCandidate) {
      return breakpoint + 1;
    }
  }

  return tentativeEnd;
}

export function chunkText(
  content: string,
  options?: {
    maxCharacters?: number;
    overlapCharacters?: number;
  },
): TextChunk[] {
  const maxCharacters = options?.maxCharacters ?? env.INGESTION_MAX_CHUNK_SIZE;
  const overlapCharacters = options?.overlapCharacters ?? env.INGESTION_CHUNK_OVERLAP;

  if (overlapCharacters >= maxCharacters) {
    throw new Error("Chunk overlap must be smaller than chunk size.");
  }

  const normalized = content.replace(/\r\n/g, "\n").trim();

  if (!normalized) {
    return [];
  }

  const chunks: TextChunk[] = [];
  let start = 0;
  let index = 0;

  while (start < normalized.length) {
    const tentativeEnd = Math.min(start + maxCharacters, normalized.length);
    const end =
      tentativeEnd < normalized.length
        ? findChunkBoundary(normalized, start, tentativeEnd)
        : tentativeEnd;
    const rawChunk = normalized.slice(start, end).trim();

    if (rawChunk) {
      chunks.push({
        index,
        content: rawChunk,
        tokenCount: Math.ceil(rawChunk.length / 4),
        metadata: {
          startOffset: start,
          endOffset: end,
        },
      });
      index += 1;
    }

    if (end >= normalized.length) {
      break;
    }

    start = Math.max(end - overlapCharacters, start + 1);
  }

  return chunks;
}
