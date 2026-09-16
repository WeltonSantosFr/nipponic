import { Card, FlashcardWordSource, TokenWordItem } from "@nipponic/shared";

export type { FlashcardWordSource, TokenWordItem };

/**
 * Extracts the core target word from a flashcard's Japanese text.
 * Handles:
 * - Sentence miner format: "食べる (たべる)\n\n「ご飯を食べる」" -> "食べる"
 * - Parenthesized readings: "猫 (ねこ)" or "私（わたし）" or "林檎【りんご】" -> "猫" / "私" / "林檎"
 * - Quoted words: "「友達」" -> "友達"
 * - Simple words: "犬" -> "犬"
 */
export function extractWordFromCard(cardJpText: string): string {
  if (!cardJpText) return "";

  const trimmed = cardJpText.trim();
  if (!trimmed) return "";

  // 1. Take the first line (sentence miner puts example sentences on subsequent lines)
  const firstLine = trimmed.split(/\r?\n/)[0]?.trim() || "";

  // 2. Remove readings in parentheses or brackets: (reading), （reading）, [reading], 【reading】
  let word = firstLine.replace(/[(（\[【].*?[)）\]】]/g, "").trim();

  // 3. Remove quotation marks: 「...」, 『...』, "..."
  word = word.replace(/^[「『"“']+|[」』"”']+$/g, "").trim();

  return word;
}

/**
 * Extracts all unique Japanese words from an array of flashcards into a Set for O(1) lookups.
 */
export function extractFlashcardWords(
  cards: FlashcardWordSource[]
): Set<string> {
  const words = new Set<string>();

  for (const card of cards) {
    if (!card.jpText) continue;

    const extracted = extractWordFromCard(card.jpText);
    if (extracted && extracted.length > 0) {
      words.add(extracted);
    }
  }

  return words;
}

/**
 * Checks if a token (given its surface_form and optional basic_form/dictionary form)
 * matches any word in the user's flashcards.
 */
export function isWordInFlashcards(
  surfaceForm: string,
  basicForm: string | undefined,
  flashcardWords: Set<string>
): boolean {
  if (!flashcardWords || flashcardWords.size === 0) return false;
  if (!surfaceForm) return false;

  // 1. Direct surface form match (e.g. "猫", "林檎", "勉強")
  if (flashcardWords.has(surfaceForm)) {
    return true;
  }

  // 2. Base/dictionary form match from morphological analyzer (e.g. "食べました" -> "食べる")
  if (basicForm && basicForm !== "*" && basicForm !== surfaceForm) {
    if (flashcardWords.has(basicForm)) {
      return true;
    }
  }

  return false;
}

/**
 * Counts how many unique words in the tokens list are already in the flashcards.
 */
export function countFlashcardWordsInTokens(
  tokens: TokenWordItem[],
  flashcardWords: Set<string>
): number {
  if (!tokens || tokens.length === 0 || !flashcardWords || flashcardWords.size === 0) {
    return 0;
  }

  const matched = new Set<string>();

  for (const token of tokens) {
    if (flashcardWords.has(token.surface_form)) {
      matched.add(token.surface_form);
    } else if (
      token.basic_form &&
      token.basic_form !== "*" &&
      flashcardWords.has(token.basic_form)
    ) {
      matched.add(token.basic_form);
    }
  }

  return matched.size;
}
