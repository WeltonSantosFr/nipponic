import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
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

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(SpeechModule.useSpeech).mockReturnValue({
      speak: mockSpeak,
      isPlaying: false,
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
    expect(mockSpeak).toHaveBeenCalledWith("田中です。", "ja-JP");

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
    } as any);

    render(<TutorWorkspace />);

    const nextUnitBtn = screen.getByRole("button", {
      name: /\+ Generate Next Unit \(AI\)/i,
    });
    expect(nextUnitBtn).toBeDefined();

    fireEvent.click(nextUnitBtn);
    expect(mockGenerateNextUnit).toHaveBeenCalled();
  });
});

