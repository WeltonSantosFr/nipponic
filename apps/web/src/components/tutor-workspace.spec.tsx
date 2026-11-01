import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { TutorWorkspace } from "./tutor-workspace";
import * as TutorContextModule from "@/contexts/TutorContext";
import * as SpeechModule from "@/hooks/use-speech";

vi.mock("@/contexts/TutorContext", () => ({
  useTutor: vi.fn(),
}));

vi.mock("@/hooks/use-speech", () => ({
  useSpeech: vi.fn(),
}));

// Mock TokenizedText
vi.mock("@/components/tokenized-text", () => ({
  TokenizedText: ({ text }: { text: string }) => <span>{text}</span>,
  TokenItem: ({ word }: { word: string }) => <span data-testid={`token-${word}`}>{word}</span>,
  toHiragana: (s: string) => s,
}));

describe("TutorWorkspace", () => {
  const mockSpeak = vi.fn();
  const mockLoadLesson = vi.fn();
  const mockSubmitProgress = vi.fn();
  const mockSubmitFeedback = vi.fn();
  const mockAddVocabularyToDeck = vi.fn().mockResolvedValue({ createdCount: 2 });
  const mockSetSelectedTopicId = vi.fn();
  const mockSetSelectedLevel = vi.fn();
  const mockCloseLesson = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(SpeechModule.useSpeech).mockReturnValue({
      speak: mockSpeak,
      isPlaying: false,
      isLoading: false,
      stop: vi.fn(),
      isSupported: true,
      voices: [],
    } as any);
  });

  it("renders curriculum dashboard with topics roadmap when no lesson is selected", () => {
    vi.mocked(TutorContextModule.useTutor).mockReturnValue({
      curriculum: [
        {
          id: "top_1",
          level: "N5",
          unitIndex: 1,
          unitTitle: "Foundations",
          lessonIndex: 1,
          title: "Polite Copula です",
          grammarKey: "desu",
          objective: "Learn to introduce yourself",
          isCompleted: false,
        },
      ],
      selectedLevel: "N5",
      currentLesson: null,
      isLoadingLesson: false,
      loadLesson: mockLoadLesson,
      closeLesson: mockCloseLesson,
      submitProgress: mockSubmitProgress,
      submitFeedback: mockSubmitFeedback,
      addVocabularyToDeck: mockAddVocabularyToDeck,
      setSelectedTopicId: mockSetSelectedTopicId,
    } as any);

    render(<TutorWorkspace />);

    expect(screen.getByText("Daily AI Tutor")).toBeDefined();
    expect(screen.getByText("Start Today's Lesson")).toBeDefined();
    expect(screen.getAllByText("Polite Copula です").length).toBeGreaterThan(0);

    const startBtn = screen.getByText("Start Today's Lesson");
    fireEvent.click(startBtn);

    expect(mockLoadLesson).toHaveBeenCalledWith("top_1");
  });

  it("renders JLPT level selector (N5 - N1) and switches level when clicked", () => {
    vi.mocked(TutorContextModule.useTutor).mockReturnValue({
      curriculum: [],
      selectedLevel: "N5",
      setSelectedLevel: mockSetSelectedLevel,
      currentLesson: null,
      isLoadingLesson: false,
      loadLesson: mockLoadLesson,
      closeLesson: mockCloseLesson,
      submitProgress: mockSubmitProgress,
      submitFeedback: mockSubmitFeedback,
      addVocabularyToDeck: mockAddVocabularyToDeck,
      setSelectedTopicId: mockSetSelectedTopicId,
    } as any);

    render(<TutorWorkspace />);

    expect(screen.getByTestId("tutor-level-selector")).toBeDefined();
    expect(screen.getByText("JLPT Level:")).toBeDefined();

    const n5Tab = screen.getByRole("tab", { name: "N5" });
    const n3Tab = screen.getByRole("tab", { name: "N3" });
    const n1Tab = screen.getByRole("tab", { name: "N1" });

    expect(n5Tab).toBeDefined();
    expect(n3Tab).toBeDefined();
    expect(n1Tab).toBeDefined();
    expect(n5Tab.getAttribute("aria-selected")).toBe("true");
    expect(n3Tab.getAttribute("aria-selected")).toBe("false");

    fireEvent.click(n3Tab);
    expect(mockSetSelectedLevel).toHaveBeenCalledWith("N3");
  });

  it("renders active lesson and navigates through 4 steps", async () => {
    const mockLesson = {
      id: "les_1",
      topicId: "top_1",
      title: "Polite Copula です",
      level: "N5",
      theoryMarkdown: "### Key Formula\n[Noun] + です",
      dialogue: [
        {
          speaker: "Tanaka",
          jpText: "田中です。",
          enText: "I am Tanaka.",
        },
      ],
      vocabulary: [
        {
          jpText: "学生",
          reading: "がくせい",
          enText: "Student",
        },
      ],
      exercises: [
        {
          order: 1,
          type: "multiple_choice" as const,
          prompt: "Select polite copula:",
          options: ["です", "だ"],
          correctAnswer: "です",
          explanation: "です is polite.",
        },
      ],
    };

    vi.mocked(TutorContextModule.useTutor).mockReturnValue({
      curriculum: [],
      selectedLevel: "N5",
      currentLesson: mockLesson,
      isLoadingLesson: false,
      loadLesson: mockLoadLesson,
      submitProgress: mockSubmitProgress,
      submitFeedback: mockSubmitFeedback,
      addVocabularyToDeck: mockAddVocabularyToDeck,
      setSelectedTopicId: mockSetSelectedTopicId,
      closeLesson: mockCloseLesson,
    } as any);

    render(<TutorWorkspace />);

    // Step 1: Theory
    expect(screen.getByText(/Key Formula/)).toBeDefined();
    const continueDialogueBtn = screen.getByText("Continue to Dialogue");
    fireEvent.click(continueDialogueBtn);

    // Step 2: Dialogue
    expect(screen.getByText("Contextual Conversation")).toBeDefined();
    expect(screen.getByText("田中です。")).toBeDefined();

    // Test Audio play
    const audioBtn = screen.getByTitle("Play pronunciation audio");
    fireEvent.click(audioBtn);
    expect(mockSpeak).toHaveBeenCalledWith("田中です。", "ja-JP", 1, expect.any(Function));

    const continueExercisesBtn = screen.getByText("Continue to Exercises");
    fireEvent.click(continueExercisesBtn);

    // Step 3: Exercises
    expect(screen.getByText("Select polite copula:")).toBeDefined();
    const choice = screen.getByText("です");
    fireEvent.click(choice);

    expect(mockSubmitProgress).toHaveBeenCalledWith(100);

    // Step 4: Vocabulary & Flashcards
    const continueVocabBtn = screen.getByText("Vocabulary & Cards");
    fireEvent.click(continueVocabBtn);

    expect(screen.getByText("Lesson Vocabulary")).toBeDefined();
    expect(screen.getByText("学生")).toBeDefined();

    // Test Add to Flashcards
    const addCardsBtn = screen.getByText("Add All Words to Flashcards");
    fireEvent.click(addCardsBtn);

    await waitFor(() => {
      expect(mockAddVocabularyToDeck).toHaveBeenCalled();
    });

    // Test Feedback
    const helpfulBtn = screen.getByText("Helpful");
    fireEvent.click(helpfulBtn);

    expect(mockSubmitFeedback).toHaveBeenCalledWith("helpful");
  });

  it("renders empty state with AI generation button when curriculum is empty", () => {
    const mockGenerateNextUnit = vi.fn();
    vi.mocked(TutorContextModule.useTutor).mockReturnValue({
      curriculum: [],
      selectedLevel: "N1",
      currentLesson: null,
      isLoadingCurriculum: false,
      isLoadingLesson: false,
      isGeneratingUnit: false,
      generateNextUnit: mockGenerateNextUnit,
      loadLesson: mockLoadLesson,
      submitProgress: mockSubmitProgress,
      submitFeedback: mockSubmitFeedback,
      addVocabularyToDeck: mockAddVocabularyToDeck,
      setSelectedTopicId: mockSetSelectedTopicId,
      closeLesson: mockCloseLesson,
    } as any);

    render(<TutorWorkspace />);

    expect(
      screen.getByText("No lessons generated for JLPT N1 yet")
    ).toBeDefined();
    const generateBtn = screen.getByRole("button", {
      name: /Generate JLPT N1 Topics with AI/i,
    });
    expect(generateBtn).toBeDefined();

    fireEvent.click(generateBtn);
    expect(mockGenerateNextUnit).toHaveBeenCalled();
  });

  it("triggers generateNextUnit when '+ Generate Next Unit (AI)' is clicked", () => {
    const mockGenerateNextUnit = vi.fn();
    vi.mocked(TutorContextModule.useTutor).mockReturnValue({
      curriculum: [
        {
          id: "top_1",
          level: "N5",
          unitIndex: 1,
          unitTitle: "Foundations",
          lessonIndex: 1,
          title: "Polite Copula です",
          grammarKey: "desu",
          objective: "Learn to introduce yourself",
          isCompleted: false,
        },
      ],
      selectedLevel: "N5",
      currentLesson: null,
      isLoadingCurriculum: false,
      isLoadingLesson: false,
      isGeneratingUnit: false,
      generateNextUnit: mockGenerateNextUnit,
      loadLesson: mockLoadLesson,
      submitProgress: mockSubmitProgress,
      submitFeedback: mockSubmitFeedback,
      addVocabularyToDeck: mockAddVocabularyToDeck,
      setSelectedTopicId: mockSetSelectedTopicId,
      closeLesson: mockCloseLesson,
    } as any);

    render(<TutorWorkspace />);

    const nextUnitBtn = screen.getByRole("button", {
      name: /\+ Generate Next Unit \(AI\)/i,
    });
    expect(nextUnitBtn).toBeDefined();

    fireEvent.click(nextUnitBtn);
    expect(mockGenerateNextUnit).toHaveBeenCalled();
  });

  it("should call closeLesson when top-left '< Curriculum' button is clicked", () => {
    const mockLesson = {
      id: "les_1",
      topicId: "top_1",
      title: "Polite Copula です",
      level: "N5",
      theoryMarkdown: "### Key Formula",
      dialogue: [],
      vocabulary: [],
      exercises: [],
    };

    vi.mocked(TutorContextModule.useTutor).mockReturnValue({
      curriculum: [],
      selectedLevel: "N5",
      currentLesson: mockLesson,
      isLoadingLesson: false,
      loadLesson: mockLoadLesson,
      closeLesson: mockCloseLesson,
      submitProgress: mockSubmitProgress,
      submitFeedback: mockSubmitFeedback,
      addVocabularyToDeck: mockAddVocabularyToDeck,
      setSelectedTopicId: mockSetSelectedTopicId,
    } as any);

    render(<TutorWorkspace />);

    const backBtn = screen.getByRole("button", { name: /curriculum/i });
    expect(backBtn).toBeDefined();
    fireEvent.click(backBtn);

    expect(mockCloseLesson).toHaveBeenCalledTimes(1);
  });

  it("should submit progress and call closeLesson when 'Finish & Return to Curriculum' is clicked", async () => {
    const mockLesson = {
      id: "les_1",
      topicId: "top_1",
      title: "Polite Copula です",
      level: "N5",
      theoryMarkdown: "### Key Formula",
      dialogue: [],
      vocabulary: [
        { jpText: "学生", reading: "がくせい", enText: "Student" }
      ],
      exercises: [],
    };

    vi.mocked(TutorContextModule.useTutor).mockReturnValue({
      curriculum: [],
      selectedLevel: "N5",
      currentLesson: mockLesson,
      isLoadingLesson: false,
      loadLesson: mockLoadLesson,
      closeLesson: mockCloseLesson,
      submitProgress: mockSubmitProgress.mockResolvedValue(true),
      submitFeedback: mockSubmitFeedback,
      addVocabularyToDeck: mockAddVocabularyToDeck,
      setSelectedTopicId: mockSetSelectedTopicId,
    } as any);

    render(<TutorWorkspace />);

    // Navigate to Vocabulary step (last step)
    const vocabStepBtn = screen.getByRole("button", { name: /4\.\s*Vocabulary/i });
    fireEvent.click(vocabStepBtn);

    const finishBtn = screen.getByRole("button", {
      name: /Finish & Return to Curriculum/i,
    });
    expect(finishBtn).toBeDefined();

    await fireEvent.click(finishBtn);

    await waitFor(() => {
      expect(mockSubmitProgress).toHaveBeenCalledWith(100);
      expect(mockCloseLesson).toHaveBeenCalledTimes(1);
    });
  });

  it("should show loading spinner on the active dialogue audio button while audio is loading", () => {
    let audioCallback: (() => void) | undefined;
    const mockAsyncSpeak = vi.fn().mockImplementation((_t, _l, _r, cb) => {
      audioCallback = cb;
      return new Promise(() => {}); // Remains pending
    });

    vi.mocked(SpeechModule.useSpeech).mockReturnValue({
      speak: mockAsyncSpeak,
      isPlaying: false,
      isLoading: true,
      stop: vi.fn(),
      isSupported: true,
      voices: [],
    } as any);

    const mockLesson = {
      id: "les_1",
      topicId: "top_1",
      title: "Polite Copula です",
      level: "N5",
      theoryMarkdown: "### Key Formula",
      dialogue: [
        {
          speaker: "Tanaka",
          jpText: "田中です。",
          enText: "I am Tanaka.",
        },
      ],
      vocabulary: [],
      exercises: [],
    };

    vi.mocked(TutorContextModule.useTutor).mockReturnValue({
      curriculum: [],
      selectedLevel: "N5",
      currentLesson: mockLesson,
      isLoadingLesson: false,
      loadLesson: mockLoadLesson,
      closeLesson: mockCloseLesson,
      submitProgress: mockSubmitProgress,
      submitFeedback: mockSubmitFeedback,
      addVocabularyToDeck: mockAddVocabularyToDeck,
      setSelectedTopicId: mockSetSelectedTopicId,
    } as any);

    render(<TutorWorkspace />);

    // Navigate to dialogue step
    fireEvent.click(screen.getByText("Continue to Dialogue"));

    const audioBtn = screen.getByTitle("Play pronunciation audio");
    fireEvent.click(audioBtn);

    // mockAsyncSpeak was called
    expect(mockAsyncSpeak).toHaveBeenCalledWith("田中です。", "ja-JP", 1, expect.any(Function));

    // Because isLoading is true and this button is active, an animated spinner svg must be present inside the button
    const svgIcon = audioBtn.querySelector("svg");
    expect(svgIcon?.getAttribute("class")).toContain("animate-spin");
  });

  it("should show loading spinner on feedback button while submitting feedback", async () => {
    let resolveFeedback: (val: boolean) => void;
    const feedbackPromise = new Promise<boolean>((resolve) => {
      resolveFeedback = resolve;
    });
    const mockAsyncFeedback = vi.fn().mockReturnValue(feedbackPromise);

    const mockLesson = {
      id: "les_1",
      topicId: "top_1",
      title: "Polite Copula です",
      level: "N5",
      theoryMarkdown: "### Key Formula",
      dialogue: [],
      vocabulary: [
        { jpText: "学生", reading: "がくせい", enText: "Student" }
      ],
      exercises: [],
    };

    vi.mocked(TutorContextModule.useTutor).mockReturnValue({
      curriculum: [],
      selectedLevel: "N5",
      currentLesson: mockLesson,
      isLoadingLesson: false,
      loadLesson: mockLoadLesson,
      closeLesson: mockCloseLesson,
      submitProgress: mockSubmitProgress,
      submitFeedback: mockAsyncFeedback,
      addVocabularyToDeck: mockAddVocabularyToDeck,
      setSelectedTopicId: mockSetSelectedTopicId,
    } as any);

    render(<TutorWorkspace />);

    // Navigate to step 4 (vocabulary / feedback)
    fireEvent.click(screen.getByRole("button", { name: /4\.\s*Vocabulary/i }));

    const helpfulBtn = screen.getByRole("button", { name: /Helpful/i });
    fireEvent.click(helpfulBtn);

    expect(mockAsyncFeedback).toHaveBeenCalledWith("helpful");

    // While in-flight, button should show animate-spin
    const svgIcon = helpfulBtn.querySelector("svg");
    expect(svgIcon?.getAttribute("class")).toContain("animate-spin");

    // Resolve feedback
    await act(async () => {
      resolveFeedback!(true);
      await feedbackPromise;
    });

    expect(helpfulBtn.getAttribute("disabled")).not.toBeNull();
  });

  it("toggles Furigana on and off via the header toggle button", () => {
    const mockLesson = {
      id: "les_furigana",
      topicId: "top_1",
      title: "Polite Copula です",
      level: "N5",
      theoryMarkdown: "### Key Formula",
      dialogue: [],
      vocabulary: [
        { jpText: "学生", reading: "がくせい", enText: "Student" },
      ],
      exercises: [],
    };

    vi.mocked(TutorContextModule.useTutor).mockReturnValue({
      curriculum: [],
      selectedLevel: "N5",
      currentLesson: mockLesson,
      isLoadingLesson: false,
      loadLesson: mockLoadLesson,
      closeLesson: mockCloseLesson,
      submitProgress: mockSubmitProgress,
      submitFeedback: mockSubmitFeedback,
      addVocabularyToDeck: mockAddVocabularyToDeck,
      setSelectedTopicId: mockSetSelectedTopicId,
    } as any);

    const { container } = render(<TutorWorkspace />);

    // Go to vocabulary step
    fireEvent.click(screen.getByRole("button", { name: /4\.\s*Vocabulary/i }));

    // By default, furigana is ON, so vocabulary word has <ruby>
    const rubyElement = container.querySelector("ruby");
    expect(rubyElement).not.toBeNull();
    expect(rubyElement).toHaveTextContent("がくせい");
    expect(rubyElement).toHaveTextContent("学生");

    // Click Furigana toggle button in header
    const furiganaToggle = screen.getByTestId("tutor-furigana-toggle");
    fireEvent.click(furiganaToggle);

    // Now furigana is OFF, so ruby element is replaced by plain text with parens
    expect(container.querySelector("ruby")).toBeNull();
    expect(container).toHaveTextContent("学生");
    expect(container).toHaveTextContent("(がくせい)");
  });

  it("applies responsive mobile layout classes on curriculum dashboard and active lesson view", () => {
    // 1. Dashboard View
    vi.mocked(TutorContextModule.useTutor).mockReturnValue({
      curriculum: [
        {
          id: "top_resp",
          level: "N5",
          unitIndex: 1,
          unitTitle: "Basics",
          lessonIndex: 1,
          title: "Introduction",
          grammarKey: "intro",
          objective: "Intro objective",
          isCompleted: false,
        },
      ],
      selectedLevel: "N5",
      currentLesson: null,
      isLoadingLesson: false,
      loadLesson: mockLoadLesson,
      closeLesson: mockCloseLesson,
      submitProgress: mockSubmitProgress,
      submitFeedback: mockSubmitFeedback,
      addVocabularyToDeck: mockAddVocabularyToDeck,
      setSelectedTopicId: mockSetSelectedTopicId,
    } as any);

    const { container, rerender } = render(<TutorWorkspace />);

    const dashboardRoot = container.firstElementChild as HTMLElement;
    expect(dashboardRoot.className).toContain("p-3 sm:p-6 md:p-8");
    expect(dashboardRoot.className).toContain("overflow-x-hidden");
    expect(dashboardRoot.className).toContain("pb-safe");

    // 2. Active Lesson View
    const mockLesson = {
      id: "les_resp",
      topicId: "top_resp",
      title: "Introduction",
      level: "N5",
      theoryMarkdown: "# Intro",
      dialogue: [{ speaker: "A", jpText: "こんにちは", enText: "Hello" }],
      vocabulary: [{ jpText: "今", reading: "いま", enText: "now" }],
      exercises: [],
    };

    vi.mocked(TutorContextModule.useTutor).mockReturnValue({
      curriculum: [],
      selectedLevel: "N5",
      currentLesson: mockLesson,
      isLoadingLesson: false,
      loadLesson: mockLoadLesson,
      closeLesson: mockCloseLesson,
      submitProgress: mockSubmitProgress,
      submitFeedback: mockSubmitFeedback,
      addVocabularyToDeck: mockAddVocabularyToDeck,
      setSelectedTopicId: mockSetSelectedTopicId,
    } as any);

    rerender(<TutorWorkspace />);

    // Check header has responsive layout
    const header = container.querySelector(".border-b.bg-card\\/60") as HTMLElement;
    expect(header).not.toBeNull();
    expect(header.className).toContain("flex-col sm:flex-row");
    expect(header.className).toContain("p-3 sm:p-4");

    // Check 4 steps have mobile number indicators
    const theoryBtn = screen.getByRole("button", { name: /1\.\s*Theory/i });
    expect(theoryBtn.getAttribute("aria-label")).toBe("1. Theory");
    const mobileIndicator = theoryBtn.querySelector(".sm\\:hidden");
    expect(mobileIndicator?.textContent).toBe("1");

    // Check dialogue step action bar has flex-col-reverse on mobile
    fireEvent.click(screen.getByRole("button", { name: /2\.\s*Dialogue/i }));
    const backBtn = screen.getByRole("button", { name: /Back to Theory/i });
    const actionBar = backBtn.parentElement as HTMLElement;
    expect(actionBar.className).toContain("flex-col-reverse sm:flex-row");
  });

  it("strictly enforces 320px/425px mobile constraints on buttons and empty state containers", () => {
    // Empty state testing
    vi.mocked(TutorContextModule.useTutor).mockReturnValue({
      curriculum: [],
      selectedLevel: "N5",
      currentLesson: null,
      isLoadingLesson: false,
      loadLesson: mockLoadLesson,
      closeLesson: mockCloseLesson,
      submitProgress: mockSubmitProgress,
      submitFeedback: mockSubmitFeedback,
      addVocabularyToDeck: mockAddVocabularyToDeck,
      setSelectedTopicId: mockSetSelectedTopicId,
    } as any);

    const { container, rerender } = render(<TutorWorkspace />);

    // Empty state card must not have static p-10 (which overflows 320px)
    const emptyStateCard = container.querySelector(".border-dashed") as HTMLElement;
    expect(emptyStateCard).not.toBeNull();
    expect(emptyStateCard.className).not.toContain("p-10");
    expect(emptyStateCard.className).toContain("p-4 sm:p-6 md:p-8");
    expect(emptyStateCard.className).toContain("w-full min-w-0 max-w-full overflow-hidden");

    // Empty state generate button must have whitespace-normal and break-words to avoid single-line blowout
    const emptyStateBtn = screen.getByRole("button", { name: /Generate JLPT N5 Topics with AI/i });
    expect(emptyStateBtn.className).toContain("whitespace-normal");
    expect(emptyStateBtn.className).toContain("break-words");
    expect(emptyStateBtn.className).toContain("min-w-0 max-w-full");

    // Active lesson button wrapping checks across steps
    const mockLesson = {
      id: "les_wrap",
      topicId: "top_wrap",
      title: "Test Lesson",
      level: "N5",
      theoryMarkdown: "# Test",
      dialogue: [{ speaker: "A", jpText: "テスト", enText: "test" }],
      vocabulary: [{ jpText: "単語", reading: "たんご", enText: "word" }],
      exercises: [
        {
          order: 1,
          type: "multiple_choice",
          prompt: "Choose the correct answer",
          options: ["Option A", "Option B"],
          correctAnswer: "Option A",
          explanation: "Explanation",
        },
      ],
    };

    vi.mocked(TutorContextModule.useTutor).mockReturnValue({
      curriculum: [],
      selectedLevel: "N5",
      currentLesson: mockLesson,
      isLoadingLesson: false,
      loadLesson: mockLoadLesson,
      closeLesson: mockCloseLesson,
      submitProgress: mockSubmitProgress,
      submitFeedback: mockSubmitFeedback,
      addVocabularyToDeck: mockAddVocabularyToDeck,
      setSelectedTopicId: mockSetSelectedTopicId,
    } as any);

    rerender(<TutorWorkspace />);

    // Theory step button
    const theoryContinueBtn = screen.getByRole("button", { name: /Continue to Dialogue/i });
    expect(theoryContinueBtn.className).toContain("whitespace-normal");
    expect(theoryContinueBtn.className).toContain("break-words");
    expect(theoryContinueBtn.className).toContain("min-w-0 max-w-full");

    // Dialogue step buttons
    fireEvent.click(screen.getByRole("button", { name: /2\.\s*Dialogue/i }));
    const dialogueBackBtn = screen.getByRole("button", { name: /Back to Theory/i });
    const dialogueContinueBtn = screen.getByRole("button", { name: /Continue to Exercises/i });
    expect(dialogueBackBtn.className).toContain("whitespace-normal");
    expect(dialogueBackBtn.className).toContain("break-words");
    expect(dialogueContinueBtn.className).toContain("whitespace-normal");
    expect(dialogueContinueBtn.className).toContain("break-words");

    // Exercises step buttons
    fireEvent.click(screen.getByRole("button", { name: /3\.\s*Practice/i }));
    const exerciseBackBtn = screen.getByRole("button", { name: /Back to Dialogue/i });
    const exerciseContinueBtn = screen.getByRole("button", { name: /Vocabulary & Cards/i });
    expect(exerciseBackBtn.className).toContain("whitespace-normal");
    expect(exerciseBackBtn.className).toContain("break-words");
    expect(exerciseContinueBtn.className).toContain("whitespace-normal");
    expect(exerciseContinueBtn.className).toContain("break-words");

    // Vocabulary step buttons
    fireEvent.click(screen.getByRole("button", { name: /4\.\s*Vocabulary/i }));
    const vocabBackBtn = screen.getByRole("button", { name: /Back to Exercises/i });
    const finishBtn = screen.getByRole("button", { name: /Finish & Return to Curriculum/i });
    const addAllBtn = screen.getByRole("button", { name: /Add All Words to Flashcards/i });
    expect(vocabBackBtn.className).toContain("whitespace-normal");
    expect(vocabBackBtn.className).toContain("break-words");
    expect(finishBtn.className).toContain("whitespace-normal");
    expect(finishBtn.className).toContain("break-words");
    expect(addAllBtn.className).toContain("whitespace-normal");
    expect(addAllBtn.className).toContain("break-words");
  });

  it("handles vocabulary audio playback, negative feedback, and back navigation from summary", async () => {
    const mockLesson = {
      id: "les_vocab_test",
      topicId: "top_vocab",
      title: "Test Lesson",
      level: "N5",
      theoryMarkdown: "# Test",
      dialogue: [{ speaker: "A", jpText: "テスト", enText: "test" }],
      vocabulary: [{ jpText: "単語", reading: "たんご", enText: "word" }],
      exercises: [
        {
          order: 1,
          type: "multiple_choice",
          prompt: "Choose the correct answer",
          options: ["A", "B"],
          correctAnswer: "A",
          explanation: "Explanation",
        },
      ],
    };

    vi.mocked(TutorContextModule.useTutor).mockReturnValue({
      curriculum: [],
      selectedLevel: "N5",
      currentLesson: mockLesson,
      isLoadingLesson: false,
      loadLesson: mockLoadLesson,
      closeLesson: mockCloseLesson,
      submitProgress: mockSubmitProgress,
      submitFeedback: mockSubmitFeedback,
      addVocabularyToDeck: mockAddVocabularyToDeck,
      setSelectedTopicId: mockSetSelectedTopicId,
    } as any);

    render(<TutorWorkspace />);

    // Go to Vocabulary step
    fireEvent.click(screen.getByRole("button", { name: /4\.\s*Vocabulary/i }));

    // Click audio button for vocabulary
    const listenBtn = screen.getByTitle("Listen");
    fireEvent.click(listenBtn);
    expect(mockSpeak).toHaveBeenCalledWith("単語", "ja-JP", 1, expect.any(Function));

    // Click 'Needs improvement' feedback button
    const needsImprovementBtn = screen.getByRole("button", { name: /Needs improvement/i });
    fireEvent.click(needsImprovementBtn);

    await waitFor(() => {
      expect(mockSubmitFeedback).toHaveBeenCalledWith("confusing");
    });

    // Click 'Back to Exercises' button
    const backToExercisesBtn = screen.getByRole("button", { name: /Back to Exercises/i });
    fireEvent.click(backToExercisesBtn);

    // Should now be on Exercises step
    expect(screen.getByText("Interactive Exercises")).toBeInTheDocument();

    // Click 'Back to Dialogue' button
    const backToDialogueBtn = screen.getByRole("button", { name: /Back to Dialogue/i });
    fireEvent.click(backToDialogueBtn);
    expect(screen.getByText("Contextual Conversation")).toBeInTheDocument();

    // Click 'Back to Theory' button
    const backToTheoryBtn = screen.getByRole("button", { name: /Back to Theory/i });
    fireEvent.click(backToTheoryBtn);
    expect(screen.getByRole("button", { name: /Continue to Dialogue/i })).toBeInTheDocument();

    // Go back to Exercises and test bottom 'Vocabulary & Cards' button
    fireEvent.click(screen.getByRole("button", { name: /3\.\s*Practice/i }));
    const toVocabBtn = screen.getByRole("button", { name: /^Vocabulary & Cards/i });
    fireEvent.click(toVocabBtn);
    expect(screen.getByText("Lesson Vocabulary")).toBeInTheDocument();
  });

  it("handles error notification banner and dismiss button", () => {
    const mockClearError = vi.fn();
    vi.mocked(TutorContextModule.useTutor).mockReturnValue({
      curriculum: [],
      selectedLevel: "N5",
      currentLesson: null,
      isLoadingLesson: false,
      loadLesson: mockLoadLesson,
      closeLesson: mockCloseLesson,
      submitProgress: mockSubmitProgress,
      submitFeedback: mockSubmitFeedback,
      addVocabularyToDeck: mockAddVocabularyToDeck,
      setSelectedTopicId: mockSetSelectedTopicId,
      error: "Failed to communicate with tutor service",
      clearError: mockClearError,
    } as any);

    render(<TutorWorkspace />);

    expect(screen.getByText("Failed to communicate with tutor service")).toBeInTheDocument();
    const dismissBtn = screen.getByRole("button", { name: /dismiss/i });
    fireEvent.click(dismissBtn);
    expect(mockClearError).toHaveBeenCalled();
  });

  it("renders practice completion banner and navigates to vocabulary when all exercises are answered", async () => {
    const mockLesson = {
      id: "les_practice",
      topicId: "top_practice",
      title: "Practice Completion Test",
      level: "N5",
      theoryMarkdown: "# Theory",
      dialogue: [{ speaker: "Teacher", jpText: "こんにちは", enText: "Hello" }],
      vocabulary: [{ jpText: "今日", reading: "きょう", enText: "Today" }],
      exercises: [
        {
          order: 1,
          type: "multiple_choice" as const,
          prompt: "What is the greeting?",
          options: ["こんにちは", "さようなら"],
          correctAnswer: "こんにちは",
          explanation: "Greeting explanation",
        },
      ],
    };

    vi.mocked(TutorContextModule.useTutor).mockReturnValue({
      curriculum: [],
      selectedLevel: "N5",
      currentLesson: mockLesson,
      isLoadingLesson: false,
      loadLesson: mockLoadLesson,
      closeLesson: mockCloseLesson,
      submitProgress: mockSubmitProgress,
      submitFeedback: mockSubmitFeedback,
      addVocabularyToDeck: mockAddVocabularyToDeck,
      setSelectedTopicId: mockSetSelectedTopicId,
      error: null,
      clearError: vi.fn(),
    } as any);

    render(<TutorWorkspace />);

    // Go to Practice step
    fireEvent.click(screen.getByRole("button", { name: /3\.\s*Practice/i }));
    expect(screen.getByText("Interactive Exercises")).toBeInTheDocument();

    // Answer the exercise correctly
    const correctOptionBtn = screen.getByRole("button", { name: /こんにちは/i });
    fireEvent.click(correctOptionBtn);

    // Verify completion banner appears
    await waitFor(() => {
      expect(screen.getByText("Practice Completed!")).toBeInTheDocument();
      expect(screen.getByText(/Score: 100% • Progress automatically saved\./i)).toBeInTheDocument();
    });

    // Click "View Vocabulary & Cards →" button inside the completion banner
    const viewVocabBannerBtn = screen.getByRole("button", { name: /View Vocabulary & Cards →/i });
    fireEvent.click(viewVocabBannerBtn);

    // Should now be on Vocabulary step
    expect(screen.getByText("Lesson Vocabulary")).toBeInTheDocument();
  });

  it("renders curriculum topic list with completed, recommended, and regular status", () => {
    vi.mocked(TutorContextModule.useTutor).mockReturnValue({
      curriculum: [
        {
          id: "top_done",
          level: "N5",
          title: "Greetings",
          objective: "Learn basic hellos",
          lessonIndex: 1,
          isCompleted: true,
        },
        {
          id: "top_rec",
          level: "N5",
          title: "Numbers",
          objective: "Learn counting 1-10",
          lessonIndex: 2,
          isCompleted: false,
        },
        {
          id: "top_later",
          level: "N5",
          title: "Time",
          objective: "Learn hours and minutes",
          lessonIndex: 3,
          isCompleted: false,
        },
      ],
      selectedLevel: "N5",
      currentLesson: null,
      isLoadingLesson: false,
      loadLesson: mockLoadLesson,
      closeLesson: mockCloseLesson,
      submitProgress: mockSubmitProgress,
      submitFeedback: mockSubmitFeedback,
      addVocabularyToDeck: mockAddVocabularyToDeck,
      setSelectedTopicId: mockSetSelectedTopicId,
      setSelectedLevel: mockSetSelectedLevel,
      error: null,
      clearError: vi.fn(),
    } as any);

    render(<TutorWorkspace />);

    expect(screen.getByText("Greetings")).toBeInTheDocument();
    expect(screen.getAllByText("Numbers")[0]).toBeInTheDocument();
    expect(screen.getByText("Time")).toBeInTheDocument();
  });

  it("starts lesson when clicking directly on a topic card in the curriculum roadmap", () => {
    vi.mocked(TutorContextModule.useTutor).mockReturnValue({
      curriculum: [
        {
          id: "top_direct",
          level: "N5",
          unitIndex: 1,
          unitTitle: "Basics",
          lessonIndex: 1,
          title: "Direct Topic Test",
          grammarKey: "direct",
          objective: "Learn direct selection",
          isCompleted: false,
        },
      ],
      selectedLevel: "N5",
      currentLesson: null,
      isLoadingLesson: false,
      loadLesson: mockLoadLesson,
      closeLesson: mockCloseLesson,
      submitProgress: mockSubmitProgress,
      submitFeedback: mockSubmitFeedback,
      addVocabularyToDeck: mockAddVocabularyToDeck,
      setSelectedTopicId: mockSetSelectedTopicId,
      setSelectedLevel: mockSetSelectedLevel,
      error: null,
      clearError: vi.fn(),
    } as any);

    render(<TutorWorkspace />);

    // Click the topic card directly in the unit topics list (heading h4)
    const topicHeading = screen.getByRole("heading", { name: "Direct Topic Test" });
    fireEvent.click(topicHeading);

    expect(mockLoadLesson).toHaveBeenCalledWith("top_direct");
  });

  it("navigates across 4 steps using the top step buttons and dismisses lesson error banner", () => {
    const mockClearError = vi.fn();
    const mockLesson = {
      id: "les_nav",
      topicId: "top_nav",
      title: "Step Navigation Test",
      level: "N5",
      theoryMarkdown: "# Theory Nav Content",
      dialogue: [{ speaker: "A", jpText: "テスト", enText: "Test" }],
      vocabulary: [{ jpText: "本", reading: "ほん", enText: "Book" }],
      exercises: [],
    };

    vi.mocked(TutorContextModule.useTutor).mockReturnValue({
      curriculum: [],
      selectedLevel: "N5",
      currentLesson: mockLesson,
      isLoadingLesson: false,
      loadLesson: mockLoadLesson,
      closeLesson: mockCloseLesson,
      submitProgress: mockSubmitProgress,
      submitFeedback: mockSubmitFeedback,
      addVocabularyToDeck: mockAddVocabularyToDeck,
      setSelectedTopicId: mockSetSelectedTopicId,
      error: "Temporary lesson error banner",
      clearError: mockClearError,
    } as any);

    render(<TutorWorkspace />);

    // Error banner should be rendered within active lesson view
    expect(screen.getByText("Temporary lesson error banner")).toBeInTheDocument();
    const dismissBtn = screen.getByRole("button", { name: /dismiss/i });
    fireEvent.click(dismissBtn);
    expect(mockClearError).toHaveBeenCalled();

    // Step 1 is active
    expect(screen.getByText("Theory Nav Content")).toBeInTheDocument();

    // Click Step 2: Dialogue
    const step2Btn = screen.getByRole("button", { name: "2. Dialogue" });
    fireEvent.click(step2Btn);
    expect(screen.getByText("Contextual Conversation")).toBeInTheDocument();

    // Click Step 3: Practice
    const step3Btn = screen.getByRole("button", { name: "3. Practice" });
    fireEvent.click(step3Btn);
    expect(screen.getByText("Interactive Exercises")).toBeInTheDocument();

    // Click Step 4: Vocabulary
    const step4Btn = screen.getByRole("button", { name: "4. Vocabulary" });
    fireEvent.click(step4Btn);
    expect(screen.getByText("Lesson Vocabulary")).toBeInTheDocument();

    // Click Step 1: Theory again
    const step1Btn = screen.getByRole("button", { name: "1. Theory" });
    fireEvent.click(step1Btn);
    expect(screen.getByText("Theory Nav Content")).toBeInTheDocument();
  });

  it("handles confusing feedback and toggles furigana with varied vocabulary readings", async () => {
    const mockLesson = {
      id: "les_vocab",
      topicId: "top_vocab",
      title: "Vocab & Feedback Test",
      level: "N5",
      theoryMarkdown: "# Theory",
      dialogue: [],
      vocabulary: [
        { jpText: "食べる", reading: "たべる", enText: "to eat" },
        { jpText: "パン", reading: "パン", enText: "bread" },
        { jpText: "猫", reading: "", enText: "cat" },
      ],
      exercises: [],
    };

    vi.mocked(TutorContextModule.useTutor).mockReturnValue({
      curriculum: [],
      selectedLevel: "N5",
      currentLesson: mockLesson,
      isLoadingLesson: false,
      loadLesson: mockLoadLesson,
      closeLesson: mockCloseLesson,
      submitProgress: mockSubmitProgress,
      submitFeedback: mockSubmitFeedback,
      addVocabularyToDeck: mockAddVocabularyToDeck,
      setSelectedTopicId: mockSetSelectedTopicId,
      error: null,
      clearError: vi.fn(),
    } as any);

    render(<TutorWorkspace />);

    // Go to step 4: Vocabulary
    fireEvent.click(screen.getByRole("button", { name: "4. Vocabulary" }));

    // Verify vocabulary rendering with furigana disabled by default (shows in parentheses)
    expect(screen.getByText("食べる")).toBeInTheDocument();
    expect(screen.getByText("(たべる)")).toBeInTheDocument();
    expect(screen.getByText("パン")).toBeInTheDocument();
    expect(screen.getByText("猫")).toBeInTheDocument();

    // Toggle furigana on (renders ruby without parentheses)
    const furiganaToggle = screen.getByTestId("tutor-furigana-toggle");
    fireEvent.click(furiganaToggle);
    expect(screen.getByText("たべる")).toBeInTheDocument();

    // Toggle furigana back off
    fireEvent.click(furiganaToggle);
    expect(screen.getByText("(たべる)")).toBeInTheDocument();

    // Submit 'confusing' feedback
    const needsImprovementBtn = screen.getByRole("button", { name: /needs improvement/i });
    fireEvent.click(needsImprovementBtn);
    expect(mockSubmitFeedback).toHaveBeenCalledWith("confusing");

    // Clicking again should not trigger further submissions
    fireEvent.click(needsImprovementBtn);
    expect(mockSubmitFeedback).toHaveBeenCalledTimes(1);
  });

  it("handles toggling audio off when already playing in dialogue", async () => {
    const mockStop = vi.fn();
    const mockPendingSpeak = vi.fn().mockImplementation(() => new Promise(() => {}));

    vi.mocked(SpeechModule.useSpeech).mockReturnValue({
      speak: mockPendingSpeak,
      isPlaying: false,
      isLoading: false,
      stop: mockStop,
      isSupported: true,
      voices: [],
    } as any);

    const mockLesson = {
      id: "les_audio",
      topicId: "top_audio",
      title: "Audio Test",
      level: "N5",
      theoryMarkdown: "# Theory",
      dialogue: [{ speaker: "A", jpText: "こんにちは", enText: "Hello" }],
      vocabulary: [{ jpText: "猫", reading: "ねこ", enText: "Cat" }],
      exercises: [],
    };

    vi.mocked(TutorContextModule.useTutor).mockReturnValue({
      curriculum: [],
      selectedLevel: "N5",
      currentLesson: mockLesson,
      isLoadingLesson: false,
      loadLesson: mockLoadLesson,
      closeLesson: mockCloseLesson,
      submitProgress: mockSubmitProgress,
      submitFeedback: mockSubmitFeedback,
      addVocabularyToDeck: mockAddVocabularyToDeck,
      setSelectedTopicId: mockSetSelectedTopicId,
      error: null,
      clearError: vi.fn(),
    } as any);

    render(<TutorWorkspace />);

    // Go to Dialogue
    fireEvent.click(screen.getByRole("button", { name: "2. Dialogue" }));

    const playBtn = screen.getByRole("button", { name: "Play pronunciation audio" });
    // First click starts audio
    fireEvent.click(playBtn);
    expect(mockPendingSpeak).toHaveBeenCalledWith("こんにちは", "ja-JP", 1, expect.any(Function));

    // Second click on same audio stops it
    fireEvent.click(playBtn);
    expect(mockStop).toHaveBeenCalled();
  });

  it("handles lesson completion with partial exercises and handles submit error", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const mockLesson = {
      id: "les_score",
      topicId: "top_score",
      title: "Score Test",
      level: "N5",
      theoryMarkdown: "# Theory",
      dialogue: [],
      vocabulary: [{ jpText: "犬", reading: "いぬ", enText: "Dog" }],
      exercises: [
        {
          order: 1,
          type: "multiple_choice" as const,
          prompt: "Q1",
          options: ["Alpha Answer", "Beta Answer"],
          correctAnswer: "Alpha Answer",
          explanation: "",
        },
        {
          order: 2,
          type: "multiple_choice" as const,
          prompt: "Q2",
          options: ["Gamma Answer", "Delta Answer"],
          correctAnswer: "Gamma Answer",
          explanation: "",
        },
      ],
    };

    const mockFailingSubmitProgress = vi.fn().mockRejectedValue(new Error("Progress submit failure"));

    vi.mocked(TutorContextModule.useTutor).mockReturnValue({
      curriculum: [],
      selectedLevel: "N5",
      currentLesson: mockLesson,
      isLoadingLesson: false,
      loadLesson: mockLoadLesson,
      closeLesson: mockCloseLesson,
      submitProgress: mockFailingSubmitProgress,
      submitFeedback: mockSubmitFeedback,
      addVocabularyToDeck: mockAddVocabularyToDeck,
      setSelectedTopicId: mockSetSelectedTopicId,
      error: null,
      clearError: vi.fn(),
    } as any);

    render(<TutorWorkspace />);

    // Go to practice
    fireEvent.click(screen.getByRole("button", { name: "3. Practice" }));

    // Answer Q1 correctly
    const optionBtn = screen.getByRole("button", { name: /Alpha Answer/i });
    fireEvent.click(optionBtn);

    // Navigate to Vocabulary step
    fireEvent.click(screen.getByRole("button", { name: "4. Vocabulary" }));

    // Click finish button
    const finishBtn = screen.getByRole("button", { name: /finish & return to curriculum/i });
    await fireEvent.click(finishBtn);

    await waitFor(() => {
      expect(mockFailingSubmitProgress).toHaveBeenCalledWith(50);
      expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to submit progress on finish:", expect.any(Error));
      expect(mockCloseLesson).toHaveBeenCalled();
    });

    consoleErrorSpy.mockRestore();
  });
});


