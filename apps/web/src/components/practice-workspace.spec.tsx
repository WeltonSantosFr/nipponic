import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PracticeWorkspace } from "./practice-workspace";
import * as PracticeContextModule from "@/contexts/PracticeContext";
import type {
  TranslationDailyState,
  TranslationPrompt,
  SubmitTranslationResponse,
} from "@nipponic/shared";

vi.mock("@/contexts/PracticeContext", () => ({
  usePractice: vi.fn(),
}));

const mockPromptJpToEn: TranslationPrompt = {
  id: "mvp-1-jp-en",
  order: 1,
  difficulty: 1,
  difficultyLabel: "Level 1 · Beginner",
  jlptLevel: "N5",
  direction: "JP_TO_EN",
  sourceText: "お水をください。",
  sourceReading: "おみずをください。",
  canonicalAnswer: "Please give me some water.",
  acceptedAnswers: ["Please give me some water", "Water, please"],
  hint: "お水 (おみず) = water, 〜をください = please give me ~",
  explanation:
    "「お水をください」 is a polite everyday request meaning 'Please give me some water'.",
};

const mockPromptEnToJp: TranslationPrompt = {
  id: "mvp-2-en-jp",
  order: 2,
  difficulty: 2,
  difficultyLabel: "Level 2 · Elementary",
  jlptLevel: "N5",
  direction: "EN_TO_JP",
  sourceText: "I drink coffee every morning.",
  canonicalAnswer: "毎朝コーヒーを飲みます。",
  answerReading: "まいあさコーヒーをのみます。",
  acceptedAnswers: ["毎朝コーヒーを飲みます"],
  hint: "every morning = 毎朝 (まいあさ), coffee = コーヒー, drink = 飲みます",
  explanation:
    "Time expressions go near the beginning: 毎朝コーヒーを飲みます。",
};

const defaultDailyState: TranslationDailyState = {
  prompt: mockPromptJpToEn,
  progress: {
    currentDifficulty: 1,
    completedPromptIds: [],
    lastCompletedDate: null,
    totalCompleted: 0,
  },
  isLockedToday: false,
  allCompleted: false,
  totalPrompts: 4,
  nextDifficultyLabel: "Level 2 · Elementary",
};

describe("PracticeWorkspace", () => {
  const mockSubmitTranslation = vi.fn();
  const mockDevUnlockNext = vi.fn();
  const mockClearError = vi.fn();
  const mockClearLastResult = vi.fn();
  const mockRefreshState = vi.fn();

  const setupMock = (overrides: Partial<PracticeContextModule.PracticeContextData> = {}) => {
    const data: PracticeContextModule.PracticeContextData = {
      dailyState: defaultDailyState,
      isLoading: false,
      isSubmitting: false,
      lastAttemptResult: null,
      error: null,
      clearError: mockClearError,
      clearLastResult: mockClearLastResult,
      refreshState: mockRefreshState,
      submitTranslation: mockSubmitTranslation,
      devUnlockNext: mockDevUnlockNext,
      ...overrides,
    };
    vi.mocked(PracticeContextModule.usePractice).mockReturnValue(data);
    return data;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders active JP->EN prompt, header banner, badges, and source sentence", () => {
    setupMock();
    render(<PracticeWorkspace />);

    // Header & Subtitle
    expect(screen.getByText("Daily Translation Practice")).toBeDefined();
    expect(
      screen.getByText(
        "Complete one translation challenge a day. Each success unlocks a higher difficulty."
      )
    ).toBeDefined();
    expect(screen.getByText("0 of 4 completed")).toBeDefined();

    // Badges & Source
    expect(screen.getByText("Japanese → English")).toBeDefined();
    expect(screen.getByText("Level 1 · Beginner")).toBeDefined();
    expect(screen.getByText("JLPT N5")).toBeDefined();
    expect(screen.getByText("お水をください。")).toBeDefined();

    // Textarea & Button
    const textarea = screen.getByLabelText("Your translation");
    expect(textarea).toBeDefined();
    expect(
      screen.getByPlaceholderText("Enter your English translation...")
    ).toBeDefined();
    expect(screen.getByRole("button", { name: "Check Translation" })).toBeDefined();
  });

  it("toggles reading visibility when Show/Hide Reading is clicked", () => {
    setupMock();
    render(<PracticeWorkspace />);

    // Initially reading is hidden
    expect(screen.queryByTestId("practice-source-reading")).toBeNull();
    const readingBtn = screen.getByRole("button", { name: "Show Reading" });

    // Click to show reading
    fireEvent.click(readingBtn);
    expect(screen.getByTestId("practice-source-reading")).toBeDefined();
    expect(screen.getByText("おみずをください。")).toBeDefined();
    expect(screen.getByRole("button", { name: "Hide Reading" })).toBeDefined();

    // Click to hide reading
    fireEvent.click(screen.getByRole("button", { name: "Hide Reading" }));
    expect(screen.queryByTestId("practice-source-reading")).toBeNull();
  });

  it("toggles hint visibility when Show/Hide Hint is clicked", () => {
    setupMock();
    render(<PracticeWorkspace />);

    // Initially hint is hidden
    expect(screen.queryByTestId("practice-hint-box")).toBeNull();
    const hintBtn = screen.getByRole("button", { name: "Show Hint" });

    // Click to show hint
    fireEvent.click(hintBtn);
    expect(screen.getByTestId("practice-hint-box")).toBeDefined();
    expect(
      screen.getByText("お水 (おみず) = water, 〜をください = please give me ~")
    ).toBeDefined();
    expect(screen.getByRole("button", { name: "Hide Hint" })).toBeDefined();

    // Click to hide hint
    fireEvent.click(screen.getByRole("button", { name: "Hide Hint" }));
    expect(screen.queryByTestId("practice-hint-box")).toBeNull();
  });

  it("submits user translation when clicking Check Translation", () => {
    setupMock();
    render(<PracticeWorkspace />);

    const textarea = screen.getByLabelText("Your translation");
    const submitBtn = screen.getByRole("button", { name: "Check Translation" });

    // Button disabled when empty
    expect(submitBtn).toHaveProperty("disabled", true);

    // Type answer
    fireEvent.change(textarea, { target: { value: "Please give me some water." } });
    expect(submitBtn).toHaveProperty("disabled", false);

    fireEvent.click(submitBtn);
    expect(mockSubmitTranslation).toHaveBeenCalledWith("Please give me some water.");
  });

  it("submits translation via Ctrl+Enter shortcut in textarea", () => {
    setupMock();
    render(<PracticeWorkspace />);

    const textarea = screen.getByLabelText("Your translation");
    fireEvent.change(textarea, { target: { value: "Water, please." } });
    fireEvent.keyDown(textarea, { key: "Enter", ctrlKey: true });

    expect(mockSubmitTranslation).toHaveBeenCalledWith("Water, please.");
  });

  it("shows retry feedback on incorrect attempt WITHOUT revealing the canonical answer", () => {
    const incorrectAttempt: SubmitTranslationResponse = {
      isCorrect: false,
      canonicalAnswer: "Please give me some water.",
      explanation: "Polite request using o-mizu wo kudasai.",
      state: defaultDailyState,
    };

    setupMock({
      lastAttemptResult: incorrectAttempt,
    });
    render(<PracticeWorkspace />);

    // Retry alert is visible
    expect(screen.getByTestId("practice-retry-alert")).toBeDefined();
    expect(
      screen.getByText("Not quite right yet. Try again or check the hint!")
    ).toBeDefined();

    // CRITICAL SECURITY / ANTI-SPOILER CHECK: canonical answer MUST NOT be leaked in the DOM
    expect(screen.queryByText("Please give me some water.")).toBeNull();
    expect(screen.queryByText("Polite request using o-mizu wo kudasai.")).toBeNull();
  });

  it("renders active EN->JP prompt with correct badges and placeholder", () => {
    setupMock({
      dailyState: {
        ...defaultDailyState,
        prompt: mockPromptEnToJp,
      },
    });
    render(<PracticeWorkspace />);

    expect(screen.getByText("English → Japanese")).toBeDefined();
    expect(screen.getByText("Level 2 · Elementary")).toBeDefined();
    expect(screen.getByText("I drink coffee every morning.")).toBeDefined();
    expect(
      screen.getByPlaceholderText("Enter your Japanese translation...")
    ).toBeDefined();

    // EN->JP prompt has no sourceReading, so Show Reading button should not be displayed
    expect(screen.queryByRole("button", { name: "Show Reading" })).toBeNull();
  });

  it("clears textarea and toggle states when active prompt changes", () => {
    setupMock({ dailyState: defaultDailyState });
    const { rerender } = render(<PracticeWorkspace />);

    const textarea = screen.getByLabelText("Your translation");
    fireEvent.change(textarea, { target: { value: "Some draft text" } });
    expect(textarea).toHaveProperty("value", "Some draft text");

    // Change prompt
    setupMock({
      dailyState: {
        ...defaultDailyState,
        prompt: mockPromptEnToJp,
      },
    });
    rerender(<PracticeWorkspace />);

    const updatedTextarea = screen.getByLabelText("Your translation");
    expect(updatedTextarea).toHaveProperty("value", "");
  });

  it("renders error banner and calls clearError on dismiss", () => {
    setupMock({
      error: "Failed to evaluate translation",
    });
    render(<PracticeWorkspace />);

    expect(screen.getByTestId("practice-error-banner")).toBeDefined();
    expect(screen.getByText("Failed to evaluate translation")).toBeDefined();

    const dismissBtn = screen.getByRole("button", { name: "Dismiss" });
    fireEvent.click(dismissBtn);
    expect(mockClearError).toHaveBeenCalledTimes(1);
  });

  it("renders loading state spinner when isLoading is true and no prompt loaded yet", () => {
    setupMock({
      isLoading: true,
      dailyState: {
        ...defaultDailyState,
        prompt: null,
      },
    });
    render(<PracticeWorkspace />);

    expect(screen.getByTestId("practice-loading-state")).toBeDefined();
    expect(screen.getByText("Loading translation challenge...")).toBeDefined();
  });

  it("renders daily locked state, shows canonical answer and explanation when correct, and dev unlock buttons", () => {
    const correctAttempt: SubmitTranslationResponse = {
      isCorrect: true,
      canonicalAnswer: "Please give me some water.",
      answerReading: "おみずをください。",
      explanation:
        "「お水をください」 is a polite everyday request meaning 'Please give me some water'.",
      state: {
        ...defaultDailyState,
        isLockedToday: true,
        progress: {
          currentDifficulty: 2,
          completedPromptIds: ["mvp-1-jp-en"],
          lastCompletedDate: "2026-11-12",
          totalCompleted: 1,
        },
      },
    };

    setupMock({
      dailyState: {
        ...defaultDailyState,
        isLockedToday: true,
        prompt: mockPromptEnToJp,
        progress: {
          currentDifficulty: 2,
          completedPromptIds: ["mvp-1-jp-en"],
          lastCompletedDate: "2026-11-12",
          totalCompleted: 1,
        },
      },
      lastAttemptResult: correctAttempt,
    });
    render(<PracticeWorkspace />);

    expect(screen.getByTestId("practice-daily-locked")).toBeDefined();
    expect(screen.getByText("Today's Challenge Completed!")).toBeDefined();
    expect(screen.getByText("Come back tomorrow")).toBeDefined();

    // Solution displayed because last attempt was correct
    expect(screen.getByText("Completed Challenge Solution")).toBeDefined();
    expect(screen.getByText("Please give me some water.")).toBeDefined();
    expect(screen.getByText("おみずをください。")).toBeDefined();
    expect(
      screen.getByText(
        "「お水をください」 is a polite everyday request meaning 'Please give me some water'."
      )
    ).toBeDefined();

    // Next challenge preview
    expect(screen.getByText("Next challenge:")).toBeDefined();
    expect(screen.getByText("Level 2 · Elementary")).toBeDefined();

    // Non-production Dev controls
    const unlockNextBtn = screen.getByRole("button", {
      name: /Dev: Unlock Next Challenge/i,
    });
    const resetAllBtn = screen.getByRole("button", { name: /Dev: Reset All/i });

    fireEvent.click(unlockNextBtn);
    expect(mockDevUnlockNext).toHaveBeenCalledWith(false);

    fireEvent.click(resetAllBtn);
    expect(mockDevUnlockNext).toHaveBeenCalledWith(true);
  });

  it("renders all completed state with celebratory message and restart button", () => {
    const finalCorrectAttempt: SubmitTranslationResponse = {
      isCorrect: true,
      canonicalAnswer: "明日時間があれば、図書館に行くつもりです。",
      answerReading: "あしたじかんがあれば、としょかんにいくつもりです。",
      explanation: "Expresses future intention conditional.",
      state: {
        prompt: null,
        progress: {
          currentDifficulty: 4,
          completedPromptIds: [
            "mvp-1-jp-en",
            "mvp-2-en-jp",
            "mvp-3-jp-en",
            "mvp-4-en-jp",
          ],
          lastCompletedDate: "2026-11-12",
          totalCompleted: 4,
        },
        isLockedToday: true,
        allCompleted: true,
        totalPrompts: 4,
        nextDifficultyLabel: null,
      },
    };

    setupMock({
      dailyState: {
        prompt: null,
        progress: {
          currentDifficulty: 4,
          completedPromptIds: [
            "mvp-1-jp-en",
            "mvp-2-en-jp",
            "mvp-3-jp-en",
            "mvp-4-en-jp",
          ],
          lastCompletedDate: "2026-11-12",
          totalCompleted: 4,
        },
        isLockedToday: true,
        allCompleted: true,
        totalPrompts: 4,
        nextDifficultyLabel: null,
      },
      lastAttemptResult: finalCorrectAttempt,
    });
    render(<PracticeWorkspace />);

    expect(screen.getByTestId("practice-all-completed")).toBeDefined();
    expect(screen.getByText("All MVP Challenges Completed!")).toBeDefined();
    expect(screen.getByText("4 / 4 Completed")).toBeDefined();

    // Final challenge solution
    expect(screen.getByText("Final Challenge Solution")).toBeDefined();
    expect(
      screen.getByText("明日時間があれば、図書館に行くつもりです。")
    ).toBeDefined();
    expect(
      screen.getByText("あしたじかんがあれば、としょかんにいくつもりです。")
    ).toBeDefined();
    expect(screen.getByText("Expresses future intention conditional.")).toBeDefined();

    // Restart button in dev
    const restartBtn = screen.getByRole("button", { name: "Restart Practice" });
    fireEvent.click(restartBtn);
    expect(mockDevUnlockNext).toHaveBeenCalledWith(true);
  });

  it("renders advanced N3-N1 prompt with grammarPoint badge and responsive containers", () => {
    const mockN1Prompt: TranslationPrompt = {
      id: "prompt-295-n1",
      order: 295,
      day: 295,
      difficulty: 5,
      difficultyLabel: "Level 5 · Advanced (N1)",
      jlptLevel: "N1",
      direction: "JP_TO_EN",
      sourceText: "あのような無責任極まりない発言は到底容認できない。",
      sourceReading: "あのようなむせきにんきわまりないはつげんはとうていようにんできない。",
      canonicalAnswer: "Such an utterly irresponsible remark is completely unacceptable.",
      acceptedAnswers: ["Such an utterly irresponsible remark is completely unacceptable"],
      hint: "極まりない = extremely, 到底〜ない = completely cannot",
      explanation: "N1 structure expressing extreme state.",
      grammarPoint: "〜極まりない",
    };

    setupMock({
      dailyState: {
        ...defaultDailyState,
        prompt: mockN1Prompt,
        totalPrompts: 366,
      },
    });

    render(<PracticeWorkspace />);

    expect(screen.getByText("JLPT N1")).toBeDefined();
    expect(screen.getByText("〜極まりない")).toBeDefined();
    expect(screen.getByText("Level 5 · Advanced (N1)")).toBeDefined();
    expect(screen.getByText("あのような無責任極まりない発言は到底容認できない。")).toBeDefined();
  });
});

