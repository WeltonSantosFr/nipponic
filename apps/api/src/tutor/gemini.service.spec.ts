import { describe, it, expect } from "vitest";
import { GeminiService } from "./gemini.service";

describe("GeminiService", () => {
  const service = new GeminiService();

  describe("generateFallbackLesson", () => {
    it("should cleanly extract Japanese grammar from parentheses and never use romaji slugs as Japanese text", () => {
      const fallback = service.generateFallbackLesson({
        title: "Extreme Emotional States (〜極まりない / 〜極まる)",
        level: "N1",
        grammarKey: "kiwamarinai-extreme",
        objective: "Express uncontainable extreme emotional states like danger, impoliteness, or regret in high literary style.",
      });

      expect(fallback.title).toBe("Extreme Emotional States (〜極まりない / 〜極まる)");

      // Check vocabulary items do not contain romaji slug "kiwamarinai-extreme"
      for (const vocab of fallback.vocabulary) {
        expect(vocab.jpText).not.toContain("kiwamarinai-extreme");
        expect(vocab.reading).not.toContain("kiwamarinai-extreme");
      }
      expect(fallback.vocabulary[0].jpText).toBe("極まりない");

      // Check exercises do not have romaji slug as correctAnswer or options
      for (const ex of fallback.exercises) {
        expect(ex.correctAnswer).not.toContain("kiwamarinai-extreme");
        if (ex.options) {
          for (const opt of ex.options) {
            expect(opt).not.toContain("kiwamarinai-extreme");
          }
        }
      }

      // Check dialogue does not have romaji slug in jpText and has target grammar
      for (const line of fallback.dialogue) {
        expect(line.jpText).not.toContain("kiwamarinai-extreme");
      }
      expect(fallback.dialogue.some((line) => line.jpText.includes("極まりない"))).toBe(true);
    });

    it("should handle topics without parentheses by extracting Japanese characters", () => {
      const fallback = service.generateFallbackLesson({
        title: "Compulsion ざるを得ない",
        level: "N1",
        grammarKey: "zaruwoenai-compelled",
        objective: "Express compulsion",
      });

      expect(fallback.vocabulary[0].jpText).toBe("ざるを得ない");
      expect(fallback.exercises[0].correctAnswer).toBe("ざるを得ない");
    });
  });

  describe("buildLessonPrompt", () => {
    it("should inject specific JLPT pedagogical rubrics for each JLPT level", () => {
      const levels = ["N5", "N4", "N3", "N2", "N1"] as const;

      for (const level of levels) {
        const prompt = service.buildLessonPrompt({
          title: `Sample Lesson for ${level}`,
          level,
          grammarKey: `sample-${level.toLowerCase()}`,
          objective: `Master ${level} grammar`,
        });

        expect(prompt).toContain(`JLPT ${level} PEDAGOGICAL SPECIFICATIONS`);
        expect(prompt).toContain(`calibrated specifically for JLPT level ${level}`);
      }
    });

    it("should inject REFINEMENT DIRECTIVE when isRegeneration is true", () => {
      const prompt = service.buildLessonPrompt({
        title: "Extreme Emotional States (〜極まりない / 〜極まる)",
        level: "N1",
        grammarKey: "kiwamarinai-extreme",
        objective: "Express uncontainable extreme emotional states",
        isRegeneration: true,
        regenerationReason: "Negative feedback threshold reached: 67% confusing",
        previousFeedbackComments: [
          "I didn't understand the difference between 極まりない and 極まる.",
          "Please include clearer conjugation steps.",
        ],
      });

      expect(prompt).toContain("REFINEMENT DIRECTIVE (CRITICAL - PEDAGOGICAL UPGRADE)");
      expect(prompt).toContain("Negative feedback threshold reached: 67% confusing");
      expect(prompt).toContain('1. "I didn\'t understand the difference between 極まりない and 極まる."');
      expect(prompt).toContain('2. "Please include clearer conjugation steps."');
      expect(prompt).toContain("STEP-BY-STEP FORMULA & CONJUGATION BREAKDOWN");
      expect(prompt).toContain('CONTRASTIVE ANALYSIS & NUANCE ("When to use vs When NOT to use")');
      expect(prompt).toContain("SITUATIONALLY ENRICHED DIALOGUE");
      expect(prompt).toContain("TARGETED REINFORCING EXERCISES");
    });

    it("should not inject REFINEMENT DIRECTIVE when isRegeneration is false or undefined", () => {
      const prompt = service.buildLessonPrompt({
        title: "Polite Copula です",
        level: "N5",
        grammarKey: "desu",
        objective: "Learn the polite copula",
      });

      expect(prompt).not.toContain("REFINEMENT DIRECTIVE");
    });
  });
});
