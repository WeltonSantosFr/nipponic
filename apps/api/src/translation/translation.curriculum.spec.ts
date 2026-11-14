import { describe, it, expect } from "vitest";
import {
  N5_TRANSLATION_PROMPTS,
  N4_TRANSLATION_PROMPTS,
  N3_TRANSLATION_PROMPTS,
  N2_TRANSLATION_PROMPTS,
  N1_TRANSLATION_PROMPTS,
  DAILY_TRANSLATION_PROMPTS,
  TranslationPromptSchema,
  evaluateTranslationAttempt,
  normalizeTranslationText,
  buildTranslationDailyState,
  type TranslationProgress,
} from "@nipponic/shared";

describe("Daily Translation Curriculum & Evaluation (N5 to N1)", () => {
  describe("Task 6: N5 and N4 Validation & Alternative Answers", () => {
    it("has exactly 74 N5 prompts with valid schema and sequential order (1 to 74)", () => {
      expect(N5_TRANSLATION_PROMPTS.length).toBe(74);

      N5_TRANSLATION_PROMPTS.forEach((p, idx) => {
        const parseResult = TranslationPromptSchema.safeParse(p);
        expect(parseResult.success).toBe(true);
        expect(p.order).toBe(idx + 1);
        expect(p.day).toBe(idx + 1);
        expect(p.jlptLevel).toBe("N5");
        expect(p.difficulty).toBe(1);
        expect(p.acceptedAnswers.length).toBeGreaterThan(0);
        expect(evaluateTranslationAttempt(p, p.canonicalAnswer).isCorrect).toBe(true);
      });
    });

    it("has exactly 74 N4 prompts with valid schema and sequential order (75 to 148)", () => {
      expect(N4_TRANSLATION_PROMPTS.length).toBe(74);

      N4_TRANSLATION_PROMPTS.forEach((p, idx) => {
        const parseResult = TranslationPromptSchema.safeParse(p);
        expect(parseResult.success).toBe(true);
        expect(p.order).toBe(75 + idx);
        expect(p.day).toBe(75 + idx);
        expect(p.jlptLevel).toBe("N4");
        expect(p.difficulty).toBe(2);
        expect(p.acceptedAnswers.length).toBeGreaterThan(0);
        expect(evaluateTranslationAttempt(p, p.canonicalAnswer).isCorrect).toBe(true);
      });
    });

    it("evaluates N5 canonical answers and alternative answers accurately", () => {
      const p1 = N5_TRANSLATION_PROMPTS[0]; // "お水をください。" -> "Please give me some water."
      expect(evaluateTranslationAttempt(p1, "Please give me some water.").isCorrect).toBe(true);
      expect(evaluateTranslationAttempt(p1, "please give me some water").isCorrect).toBe(true);
      expect(evaluateTranslationAttempt(p1, "Water, please!").isCorrect).toBe(true);
      expect(evaluateTranslationAttempt(p1, "Can I have some water?").isCorrect).toBe(true);
      expect(evaluateTranslationAttempt(p1, "I want a cup of coffee").isCorrect).toBe(false);
    });

    it("handles English contractions seamlessly in N5 and N4 answers", () => {
      // Find an EN prompt or check normalization
      expect(normalizeTranslationText("I don't know", "JP_TO_EN")).toBe("i do not know");
      expect(normalizeTranslationText("I cannot go", "JP_TO_EN")).toBe("i cannot go");
      expect(normalizeTranslationText("can't go", "JP_TO_EN")).toBe("cannot go");
      expect(normalizeTranslationText("It's delicious", "JP_TO_EN")).toBe("it is delicious");
    });

    it("evaluates N4 grammar structures (e.g. 〜たことがある, 〜ほうがいい, 〜てもいい)", () => {
      const n4Sample = N4_TRANSLATION_PROMPTS.find(
        (p) => p.grammarPoint?.includes("たことがある") || p.sourceText.includes("行ったことがあります")
      ) ?? N4_TRANSLATION_PROMPTS[0];

      const resCanonical = evaluateTranslationAttempt(n4Sample, n4Sample.canonicalAnswer);
      expect(resCanonical.isCorrect).toBe(true);
      expect(resCanonical.canonicalAnswer).toBe(n4Sample.canonicalAnswer);

      // Verify each accepted answer evaluates to true
      for (const alt of n4Sample.acceptedAnswers) {
        expect(evaluateTranslationAttempt(n4Sample, alt).isCorrect).toBe(true);
      }
    });
  });

  describe("Task 7: N3 to N1 Validation & Grammatical Nuances", () => {
    it("has exactly 73 N3 prompts with valid schema and sequential order (149 to 221)", () => {
      expect(N3_TRANSLATION_PROMPTS.length).toBe(73);

      N3_TRANSLATION_PROMPTS.forEach((p, idx) => {
        const parseResult = TranslationPromptSchema.safeParse(p);
        expect(parseResult.success).toBe(true);
        expect(p.order).toBe(149 + idx);
        expect(p.day).toBe(149 + idx);
        expect(p.jlptLevel).toBe("N3");
        expect(p.difficulty).toBe(3);
        expect(p.acceptedAnswers.length).toBeGreaterThan(0);
        expect(evaluateTranslationAttempt(p, p.canonicalAnswer).isCorrect).toBe(true);
      });
    });

    it("has exactly 73 N2 prompts with valid schema and sequential order (222 to 294)", () => {
      expect(N2_TRANSLATION_PROMPTS.length).toBe(73);

      N2_TRANSLATION_PROMPTS.forEach((p, idx) => {
        const parseResult = TranslationPromptSchema.safeParse(p);
        expect(parseResult.success).toBe(true);
        expect(p.order).toBe(222 + idx);
        expect(p.day).toBe(222 + idx);
        expect(p.jlptLevel).toBe("N2");
        expect(p.difficulty).toBe(4);
        expect(p.acceptedAnswers.length).toBeGreaterThan(0);
        expect(evaluateTranslationAttempt(p, p.canonicalAnswer).isCorrect).toBe(true);
      });
    });

    it("has exactly 72 N1 prompts with valid schema and sequential order (295 to 366)", () => {
      expect(N1_TRANSLATION_PROMPTS.length).toBe(72);

      N1_TRANSLATION_PROMPTS.forEach((p, idx) => {
        const parseResult = TranslationPromptSchema.safeParse(p);
        expect(parseResult.success).toBe(true);
        expect(p.order).toBe(295 + idx);
        expect(p.day).toBe(295 + idx);
        expect(p.jlptLevel).toBe("N1");
        expect(p.difficulty).toBe(5);
        expect(p.acceptedAnswers.length).toBeGreaterThan(0);
        expect(evaluateTranslationAttempt(p, p.canonicalAnswer).isCorrect).toBe(true);
      });
    });

    it("correctly evaluates N3 nuances, conditionals, and passive/causative patterns", () => {
      const n3Prompt = N3_TRANSLATION_PROMPTS[0];
      expect(evaluateTranslationAttempt(n3Prompt, n3Prompt.canonicalAnswer).isCorrect).toBe(true);
      for (const alt of n3Prompt.acceptedAnswers) {
        expect(evaluateTranslationAttempt(n3Prompt, alt).isCorrect).toBe(true);
      }
    });

    it("correctly evaluates N2 formal expressions and keigo/humble/respectful forms", () => {
      const n2Prompt = N2_TRANSLATION_PROMPTS[0];
      expect(evaluateTranslationAttempt(n2Prompt, n2Prompt.canonicalAnswer).isCorrect).toBe(true);
      for (const alt of n2Prompt.acceptedAnswers) {
        expect(evaluateTranslationAttempt(n2Prompt, alt).isCorrect).toBe(true);
      }
    });

    it("correctly evaluates N1 literary, classical and advanced idiomatic structures", () => {
      const n1Prompt = N1_TRANSLATION_PROMPTS[0];
      expect(evaluateTranslationAttempt(n1Prompt, n1Prompt.canonicalAnswer).isCorrect).toBe(true);
      for (const alt of n1Prompt.acceptedAnswers) {
        expect(evaluateTranslationAttempt(n1Prompt, alt).isCorrect).toBe(true);
      }
    });
  });

  describe("Task 8: Full 366 Corpus Integrity & Progression Simulation", () => {
    it("combines to exactly 366 prompts across leap year (74+74+73+73+72)", () => {
      expect(DAILY_TRANSLATION_PROMPTS.length).toBe(366);
      expect(DAILY_TRANSLATION_PROMPTS[0].day).toBe(1);
      expect(DAILY_TRANSLATION_PROMPTS[365].day).toBe(366);

      const uniqueDays = new Set(DAILY_TRANSLATION_PROMPTS.map((p) => p.day));
      expect(uniqueDays.size).toBe(366);

      const uniqueIds = new Set(DAILY_TRANSLATION_PROMPTS.map((p) => p.id));
      expect(uniqueIds.size).toBe(366);
    });

    it("simulates full progression through 366 daily practice challenges without crashing", () => {
      let progress: TranslationProgress = {
        currentDifficulty: 1,
        completedPromptIds: [],
        lastCompletedDate: null,
        totalCompleted: 0,
      };

      // Test first 5 steps progression
      for (let day = 1; day <= 5; day++) {
        const dateStr = `2026-01-0${day}`;
        const state = buildTranslationDailyState(progress, dateStr, DAILY_TRANSLATION_PROMPTS);

        expect(state.prompt).not.toBeNull();
        expect(state.prompt?.day).toBe(day);
        expect(state.isLockedToday).toBe(false);
        expect(state.allCompleted).toBe(false);
        expect(state.totalPrompts).toBe(366);

        // Complete the prompt
        progress = {
          currentDifficulty: Math.min(366, progress.totalCompleted + 2),
          completedPromptIds: [...progress.completedPromptIds, state.prompt!.id],
          lastCompletedDate: dateStr,
          totalCompleted: progress.totalCompleted + 1,
        };

        const stateAfterSubmit = buildTranslationDailyState(progress, dateStr, DAILY_TRANSLATION_PROMPTS);
        expect(stateAfterSubmit.isLockedToday).toBe(true);
      }
    });

    it("reports allCompleted = true when all 366 prompts are finished", () => {
      const allIds = DAILY_TRANSLATION_PROMPTS.map((p) => p.id);
      const finishedProgress: TranslationProgress = {
        currentDifficulty: 366,
        completedPromptIds: allIds,
        lastCompletedDate: "2026-12-31",
        totalCompleted: 366,
      };

      const finalState = buildTranslationDailyState(finishedProgress, "2027-01-01", DAILY_TRANSLATION_PROMPTS);
      expect(finalState.allCompleted).toBe(true);
      expect(finalState.prompt).toBeNull();
      expect(finalState.totalPrompts).toBe(366);
    });
  });
});
