import { z } from "zod";

// Segmento de texto japonês com opcional furigana (Ruby)
export const FuriganaSegmentSchema = z.object({
  text: z.string().min(1, "Text component is required"),
  reading: z.string().optional(), // Furigana reading (hiragana/katakana), if any
});
export type FuriganaSegment = z.infer<typeof FuriganaSegmentSchema>;

// Entrada para o Parser de Furigana
export const ParseFuriganaInputSchema = z.object({
  rawContent: z.string().min(1, "Raw content cannot be empty"),
  format: z.enum(["bracket", "ruby"]).default("bracket"), // ex: "[漢字|かんじ]" vs standard html
});
export type ParseFuriganaInput = z.infer<typeof ParseFuriganaInputSchema>;

// Resposta estruturada contendo os segmentos parseados e HTML gerado
export const ParseFuriganaResultSchema = z.object({
  segments: z.array(FuriganaSegmentSchema),
  htmlOutput: z.string(),
  plainText: z.string(),
});
export type ParseFuriganaResult = z.infer<typeof ParseFuriganaResultSchema>;

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Parses raw text containing furigana annotations and outputs structured segments, safe HTML, and plain text.
 * Example input: "Kyou wa [日本|にほん] ni ikimasu."
 */
export function parseFurigana(input: ParseFuriganaInput): ParseFuriganaResult {
  const validated = ParseFuriganaInputSchema.parse(input);
  const { rawContent } = validated;

  const bracketRegex = /\[([^\|\]]+)\|([^\]]+)\]/g;
  const segments: FuriganaSegment[] = [];
  let htmlOutput = "";
  let plainText = "";

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = bracketRegex.exec(rawContent)) !== null) {
    const matchIndex = match.index;
    if (matchIndex > lastIndex) {
      const textPart = rawContent.slice(lastIndex, matchIndex);
      segments.push({ text: textPart });
      htmlOutput += escapeHtml(textPart);
      plainText += textPart;
    }

    const kanjiPart = match[1]?.trim() ?? "";
    const readingPart = match[2]?.trim() ?? "";

    segments.push({ text: kanjiPart, reading: readingPart });
    htmlOutput += `<ruby>${escapeHtml(kanjiPart)}<rt>${escapeHtml(readingPart)}</rt></ruby>`;
    plainText += kanjiPart;

    lastIndex = matchIndex + match[0].length;
  }

  if (lastIndex < rawContent.length) {
    const remainingPart = rawContent.slice(lastIndex);
    segments.push({ text: remainingPart });
    htmlOutput += escapeHtml(remainingPart);
    plainText += remainingPart;
  }

  return {
    segments,
    htmlOutput,
    plainText,
  };
}
