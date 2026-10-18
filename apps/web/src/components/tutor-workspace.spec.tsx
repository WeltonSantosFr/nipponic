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
}));

describe("TutorWorkspace", () => {
  const mockSpeak = vi.fn();
  const mockLoadLesson = vi.fn();
  const mockSubmitProgress = vi.fn();
  const mockSubmitFeedback = vi.fn();
  const mockAddVocabularyToDeck = vi.fn().mockResolvedValue({ createdCount: 2 });
  const mockSetSelectedTopicId = vi.fn();
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
});

