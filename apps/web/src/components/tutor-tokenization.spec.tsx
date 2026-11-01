import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MarkdownContent } from "./markdown-content";
import { InteractiveExercise } from "./interactive-exercise";
import type { LessonExercise } from "@nipponic/shared";

// Mock Kuromoji tokenizer
const mockTokenize = vi.fn((text: string) => {
  if (text.includes("極まりない")) {
    return [
      { surface_form: "極まりない", reading: "キワマリナイ", basic_form: "極まる" },
      { surface_form: "態度", reading: "タイド", basic_form: "態度" },
    ];
  }
  if (text.includes("学生")) {
    return [
      { surface_form: "学生", reading: "ガクセイ", basic_form: "学生" },
      { surface_form: "です", reading: "デス", basic_form: "です" },
    ];
  }
  return [{ surface_form: text, reading: "", basic_form: text }];
});

vi.mock("@/hooks/use-kuromoji", () => ({
  useKuromoji: () => ({
    tokenize: mockTokenize,
  }),
}));

// Mock dictionary fetch & cache
vi.mock("@/services/dictionary-cache", () => ({
  getCachedDictionaryWord: (word: string) => {
    if (word === "極まりない") {
      return {
        word: "極まりない",
        reading: "きわまりない",
        meanings: ["extremely", "having no limits"],
        jlpt: "JLPT N1",
        isCommon: true,
      };
    }
    if (word === "学生") {
      return {
        word: "学生",
        reading: "がくせい",
        meanings: ["student", "pupil"],
        jlpt: "JLPT N5",
        isCommon: true,
      };
    }
    return null;
  },
  fetchDictionaryWord: vi.fn().mockImplementation((word: string) => {
    return Promise.resolve({
      word,
      reading: word,
      meanings: [`Definition of ${word}`],
      jlpt: "JLPT N5",
      isCommon: true,
    });
  }),
  saveCustomDefinition: vi.fn(),
  resetCustomDefinition: vi.fn(),
  CUSTOM_DICT_EVENT: "custom_dict_event",
}));

// Mock speech
vi.mock("@/hooks/use-speech", () => ({
  useSpeech: () => ({
    speak: vi.fn(),
    stop: vi.fn(),
    isPlaying: false,
    isLoading: false,
    isSupported: true,
    voices: [],
  }),
}));

describe("Tutor Tokenization & Definition Cards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Step 1: Theory (MarkdownContent)", () => {
    it("renders Japanese example sentences with interactive word tokens", async () => {
      const markdown = `
#### Example
> 極まりない態度
> Extremely insolent behavior.
`;
      render(<MarkdownContent content={markdown} showFurigana={true} interactive={true} />);

      // The word tokens should have test-ids
      const token = screen.getByTestId("token-極まりない");
      expect(token).toBeDefined();
      expect(token.getAttribute("data-word")).toBe("極まりない");

      // Clicking the word token opens the definition card
      fireEvent.click(token);

      await waitFor(() => {
        expect(screen.getByText("extremely")).toBeDefined();
        expect(screen.getByText("having no limits")).toBeDefined();
        expect(screen.getByText("JLPT N1")).toBeDefined();
      });
    });

    it("renders ruby notation {漢字|かんじ} as interactive token with definition popup", async () => {
      const markdown = "Example: {学生|がくせい}です。";
      render(<MarkdownContent content={markdown} showFurigana={true} interactive={true} />);

      const token = screen.getByTestId("token-学生");
      expect(token).toBeDefined();

      fireEvent.click(token);

      await waitFor(() => {
        expect(screen.getByText("student")).toBeDefined();
        expect(screen.getByText("pupil")).toBeDefined();
      });
    });

    it("supports hiding furigana while preserving word clickability", async () => {
      const markdown = "Example: {学生|がくせい}です。";
      const { container } = render(
        <MarkdownContent content={markdown} showFurigana={false} interactive={true} />
      );

      // Ruby tag should be absent when showFurigana is false
      expect(container.querySelector("ruby")).toBeNull();

      // But the token should still exist and be clickable
      const token = screen.getByTestId("token-学生");
      expect(token).toBeDefined();
      fireEvent.click(token);

      await waitFor(() => {
        expect(screen.getByText("student")).toBeDefined();
      });
    });
  });

  describe("Step 3: Practice (InteractiveExercise)", () => {
    it("renders Japanese words in exercise prompts as clickable tokens", async () => {
      const exercise: LessonExercise = {
        id: "ex_token_1",
        order: 1,
        type: "fill_blank",
        prompt: "Complete the sentence: 学生____ (is a student)",
        correctAnswer: "です",
        explanation: "学生です means is a student.",
      };

      render(
        <InteractiveExercise
          exercise={exercise}
          onAnswer={vi.fn()}
          isAnswered={false}
          showFurigana={true}
        />
      );

      // Prompt contains 学生 which should be a clickable token
      const token = screen.getByTestId("token-学生");
      expect(token).toBeDefined();

      fireEvent.click(token);

      await waitFor(() => {
        expect(screen.getByText("student")).toBeDefined();
        expect(screen.getByText("pupil")).toBeDefined();
      });
    });

    it("renders Japanese words in explanations as clickable tokens when answered", async () => {
      const exercise: LessonExercise = {
        id: "ex_token_2",
        order: 2,
        type: "multiple_choice",
        prompt: "Select the polite copula:",
        options: ["です", "だ"],
        correctAnswer: "です",
        explanation: "学生 is followed by です in polite speech.",
      };

      render(
        <InteractiveExercise
          exercise={exercise}
          onAnswer={vi.fn()}
          isAnswered={true}
          wasCorrect={true}
          showFurigana={true}
        />
      );

      // In explanation, 学生 should be a clickable token
      const token = screen.getByTestId("token-学生");
      expect(token).toBeDefined();

      fireEvent.click(token);

      await waitFor(() => {
        expect(screen.getByText("student")).toBeDefined();
      });
    });

    it("keeps multiple choice options and chips non-interactive to prevent nested buttons", () => {
      const exercise: LessonExercise = {
        id: "ex_token_3",
        order: 3,
        type: "multiple_choice",
        prompt: "Select pattern:",
        options: ["学生"],
        correctAnswer: "学生",
        explanation: "Test explanation",
      };

      const { container } = render(
        <InteractiveExercise
          exercise={exercise}
          onAnswer={vi.fn()}
          isAnswered={false}
          showFurigana={true}
        />
      );

      // The button for "学生" must NOT contain another button / popover trigger
      const optionButton = screen.getByRole("button", { name: /学生/i });
      expect(optionButton).toBeDefined();
      const nestedButtons = optionButton.querySelectorAll("button");
      expect(nestedButtons.length).toBe(0);
    });
  });
});
