import { describe, it, expect } from "vitest";
import {
  extractWordFromCard,
  extractFlashcardWords,
  isWordInFlashcards,
  countFlashcardWordsInTokens,
} from "./flashcard-words";

describe("flashcard-words utility", () => {
  describe("extractWordFromCard", () => {
    it("extracts word from sentence miner format with reading and sentence", () => {
      const card = "食べる (たべる)\n\n「毎日りんごを食べる」";
      expect(extractWordFromCard(card)).toBe("食べる");
    });

    it("extracts word from sentence miner format without reading", () => {
      const card = "林檎\n\n「林檎はおいしい」";
      expect(extractWordFromCard(card)).toBe("林檎");
    });

    it("handles full-width Japanese parentheses （ ）", () => {
      const card = "猫（ねこ）";
      expect(extractWordFromCard(card)).toBe("猫");
    });

    it("handles brackets [ ] and 【 】", () => {
      expect(extractWordFromCard("勉強 [べんきょう]")).toBe("勉強");
      expect(extractWordFromCard("学校【がっこう】")).toBe("学校");
    });

    it("handles simple standalone word", () => {
      expect(extractWordFromCard(" 犬 ")).toBe("犬");
    });

    it("handles Japanese quotes 「 」", () => {
      expect(extractWordFromCard("「友達」")).toBe("友達");
    });

    it("returns empty string on empty or null input", () => {
      expect(extractWordFromCard("")).toBe("");
      expect(extractWordFromCard("   ")).toBe("");
    });
  });

  describe("extractFlashcardWords", () => {
    it("creates a Set of unique words from card array", () => {
      const cards: { jpText: string | null }[] = [
        { jpText: "食べる (たべる)\n\n「ご飯を食べる」" },
        { jpText: "猫 (ねこ)" },
        { jpText: "猫" }, // duplicate
        { jpText: "犬" },
        { jpText: "" },
        { jpText: null },
      ];

      const wordSet = extractFlashcardWords(cards);
      expect(wordSet.size).toBe(3);
      expect(wordSet.has("食べる")).toBe(true);
      expect(wordSet.has("猫")).toBe(true);
      expect(wordSet.has("犬")).toBe(true);
    });
  });

  describe("isWordInFlashcards", () => {
    const flashcardWords = new Set(["食べる", "猫", "東京大学"]);

    it("matches surface form directly", () => {
      expect(isWordInFlashcards("猫", undefined, flashcardWords)).toBe(true);
      expect(isWordInFlashcards("東京大学", undefined, flashcardWords)).toBe(true);
    });

    it("matches basic form when surface form is conjugated", () => {
      // In text: "食べました", surface_form: "食べ", basic_form: "食べる"
      expect(isWordInFlashcards("食べ", "食べる", flashcardWords)).toBe(true);
    });

    it("returns false for non-matching words", () => {
      expect(isWordInFlashcards("犬", "犬", flashcardWords)).toBe(false);
      expect(isWordInFlashcards("走る", "走る", flashcardWords)).toBe(false);
    });

    it("returns false when flashcardWords is empty", () => {
      expect(isWordInFlashcards("猫", "猫", new Set())).toBe(false);
    });
  });

  describe("countFlashcardWordsInTokens", () => {
    const flashcardWords = new Set(["食べる", "猫", "林檎"]);

    it("counts unique flashcard words in a token list", () => {
      const tokens = [
        { surface_form: "猫", basic_form: "猫" },
        { surface_form: "が", basic_form: "が" },
        { surface_form: "林檎", basic_form: "林檎" },
        { surface_form: "を", basic_form: "を" },
        { surface_form: "食べ", basic_form: "食べる" },
        { surface_form: "て", basic_form: "て" },
        { surface_form: "いる", basic_form: "いる" },
        // repeated word
        { surface_form: "猫", basic_form: "猫" },
      ];

      // "猫", "林檎", "食べる" -> 3 unique words
      expect(countFlashcardWordsInTokens(tokens, flashcardWords)).toBe(3);
    });

    it("returns 0 if no flashcard words match", () => {
      const tokens = [
        { surface_form: "犬", basic_form: "犬" },
        { surface_form: "走る", basic_form: "走る" },
      ];
      expect(countFlashcardWordsInTokens(tokens, flashcardWords)).toBe(0);
    });

    it("returns 0 for empty tokens", () => {
      expect(countFlashcardWordsInTokens([], flashcardWords)).toBe(0);
    });
  });
});
