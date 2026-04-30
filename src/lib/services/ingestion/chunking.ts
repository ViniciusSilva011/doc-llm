import { sentences as splitSentences } from "sbd";

import { env } from "@/lib/env";
import type { TextChunk } from "@/types/ingestion";

interface SentenceUnit {
  content: string;
  startOffset: number;
  endOffset: number;
  paragraphIndex: number;
}

interface ParagraphUnit {
  content: string;
  startOffset: number;
  paragraphIndex: number;
}

function normalizeContent(content: string) {
  return content
    .replace(/\r\n/g, "\n")
    .replace(/[\t\f\v ]+/g, " ")
    .trim();
}

function splitParagraphs(content: string): ParagraphUnit[] {
  const paragraphs: ParagraphUnit[] = [];
  const matches = content.matchAll(/\S[\s\S]*?(?=\n{2,}|$)/g);

  for (const match of matches) {
    const rawContent = match[0];
    const leadingWhitespaceLength =
      rawContent.length - rawContent.trimStart().length;
    const trimmedContent = rawContent.trim();

    if (!trimmedContent) {
      continue;
    }

    paragraphs.push({
      content: trimmedContent,
      startOffset: (match.index ?? 0) + leadingWhitespaceLength,
      paragraphIndex: paragraphs.length,
    });
  }

  return paragraphs;
}

function splitOversizedSentence(
  unit: SentenceUnit,
  maxCharacters: number,
): SentenceUnit[] {
  if (unit.content.length <= maxCharacters) {
    return [unit];
  }

  const pieces: SentenceUnit[] = [];
  let localStart = 0;

  while (localStart < unit.content.length) {
    const tentativeEnd = Math.min(
      localStart + maxCharacters,
      unit.content.length,
    );
    const boundary =
      tentativeEnd < unit.content.length
        ? Math.max(
            unit.content.lastIndexOf(" ", tentativeEnd),
            localStart + Math.floor(maxCharacters * 0.6),
          )
        : tentativeEnd;
    const localEnd = boundary > localStart ? boundary : tentativeEnd;
    const content = unit.content.slice(localStart, localEnd).trim();

    if (content) {
      const leadingWhitespaceLength =
        unit.content.slice(localStart, localEnd).length -
        unit.content.slice(localStart, localEnd).trimStart().length;

      pieces.push({
        content,
        startOffset: unit.startOffset + localStart + leadingWhitespaceLength,
        endOffset: unit.startOffset + localEnd,
        paragraphIndex: unit.paragraphIndex,
      });
    }

    localStart = Math.max(localEnd, localStart + 1);
  }

  return pieces;
}

function splitParagraphSentences(
  paragraph: ParagraphUnit,
  maxCharacters: number,
): SentenceUnit[] {
  const sentenceTexts = splitSentences(paragraph.content, {
    preserve_whitespace: true,
  });
  const units: SentenceUnit[] = [];
  let searchStart = 0;

  for (const sentenceText of sentenceTexts) {
    const trimmedSentence = sentenceText.trim();

    if (!trimmedSentence) {
      continue;
    }

    const sentenceStart = paragraph.content.indexOf(sentenceText, searchStart);
    const rawStart = sentenceStart >= 0 ? sentenceStart : searchStart;
    const leadingWhitespaceLength =
      sentenceText.length - sentenceText.trimStart().length;
    const startOffset =
      paragraph.startOffset + rawStart + leadingWhitespaceLength;
    const endOffset = startOffset + trimmedSentence.length;
    searchStart = rawStart + sentenceText.length;

    units.push(
      ...splitOversizedSentence(
        {
          content: trimmedSentence,
          startOffset,
          endOffset,
          paragraphIndex: paragraph.paragraphIndex,
        },
        maxCharacters,
      ),
    );
  }

  if (units.length === 0) {
    units.push(
      ...splitOversizedSentence(
        {
          content: paragraph.content,
          startOffset: paragraph.startOffset,
          endOffset: paragraph.startOffset + paragraph.content.length,
          paragraphIndex: paragraph.paragraphIndex,
        },
        maxCharacters,
      ),
    );
  }

  return units;
}

function unitSeparator(previous: SentenceUnit, next: SentenceUnit) {
  return previous.paragraphIndex === next.paragraphIndex ? " " : "\n\n";
}

function renderUnits(units: SentenceUnit[]) {
  return units.reduce((output, unit, index) => {
    if (index === 0) {
      return unit.content;
    }

    return `${output}${unitSeparator(units[index - 1] as SentenceUnit, unit)}${unit.content}`;
  }, "");
}

function estimateRenderedLength(units: SentenceUnit[], next?: SentenceUnit) {
  if (units.length === 0) {
    return next ? next.content.length : 0;
  }

  const rendered = renderUnits(units);

  if (!next) {
    return rendered.length;
  }

  return `${rendered}${unitSeparator(units[units.length - 1] as SentenceUnit, next)}${next.content}`
    .length;
}

function buildOverlapUnits(units: SentenceUnit[], targetCharacters: number) {
  if (targetCharacters <= 0) {
    return [];
  }

  const overlapUnits: SentenceUnit[] = [];

  for (let index = units.length - 1; index >= 0; index -= 1) {
    const candidate = [units[index] as SentenceUnit, ...overlapUnits];
    overlapUnits.unshift(units[index] as SentenceUnit);

    if (estimateRenderedLength(candidate) >= targetCharacters) {
      break;
    }
  }

  return overlapUnits;
}

function createChunk(index: number, units: SentenceUnit[]): TextChunk {
  const content = renderUnits(units).trim();
  const paragraphIndexes = new Set(units.map((unit) => unit.paragraphIndex));

  return {
    index,
    content,
    tokenCount: Math.ceil(content.length / 4),
    metadata: {
      startOffset: units[0]?.startOffset ?? 0,
      endOffset: units[units.length - 1]?.endOffset ?? 0,
      sentenceCount: units.length,
      paragraphCount: paragraphIndexes.size,
    },
  };
}

export function chunkText(
  content: string,
  options?: {
    maxCharacters?: number;
    overlapPercent?: number;
  },
): TextChunk[] {
  const maxCharacters = options?.maxCharacters ?? env.INGESTION_MAX_CHUNK_SIZE;
  const overlapPercent =
    options?.overlapPercent ?? env.INGESTION_CHUNK_OVERLAP_PERCENT;
  const overlapCharacters = Math.floor((maxCharacters * overlapPercent) / 100);

  if (overlapPercent < 0 || overlapPercent > 90) {
    throw new Error("Chunk overlap percent must be between 0 and 90.");
  }

  if (overlapCharacters >= maxCharacters) {
    throw new Error("Chunk overlap must be smaller than chunk size.");
  }

  const normalized = normalizeContent(content);

  if (!normalized) {
    return [];
  }

  const sentenceUnits = splitParagraphs(normalized).flatMap((paragraph) =>
    splitParagraphSentences(paragraph, maxCharacters),
  );
  const chunks: TextChunk[] = [];
  let currentUnits: SentenceUnit[] = [];

  for (const unit of sentenceUnits) {
    if (
      currentUnits.length > 0 &&
      estimateRenderedLength(currentUnits, unit) > maxCharacters
    ) {
      chunks.push(createChunk(chunks.length, currentUnits));
      currentUnits = buildOverlapUnits(currentUnits, overlapCharacters);

      while (
        currentUnits.length > 0 &&
        estimateRenderedLength(currentUnits, unit) > maxCharacters
      ) {
        currentUnits.shift();
      }
    }

    currentUnits.push(unit);
  }

  if (currentUnits.length > 0) {
    chunks.push(createChunk(chunks.length, currentUnits));
  }

  return chunks;
}
