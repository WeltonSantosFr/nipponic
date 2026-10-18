import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { TutorProvider, useTutor } from "./TutorContext";
import {
  getCurriculumAction,
  getLessonAction,
  generateNextUnitAction,
} from "@/actions/tutor";
import type { CurriculumTopic, Lesson } from "@nipponic/shared";

vi.mock("@/actions/tutor", () => ({
  getCurriculumAction: vi.fn(),
  getLessonAction: vi.fn(),
  submitLessonProgressAction: vi.fn(),
  submitLessonFeedbackAction: vi.fn(),
  generateNextUnitAction: vi.fn(),
}));

vi.mock("./AuthContext", () => ({
  useAuth: () => ({
    isAuthenticated: true,
  }),
}));

vi.mock("./FlashCardsContext", () => ({
  useFlashCards: () => ({
    decks: [],
    createDeck: vi.fn(),
    createCard: vi.fn(),
    addCardsToDeck: vi.fn(),
  }),
}));

describe("TutorContext Regression Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should clear curriculum immediately and set isLoadingCurriculum when switching to an uncached level", async () => {
    const mockN5Topics: CurriculumTopic[] = [
      {
        id: "top_n5_1",
        level: "N5",
        unitIndex: 1,
        unitTitle: "Basics",
        lessonIndex: 1,
        title: "N5 Topic 1",
        grammarKey: "desu",
        objective: "Learn desu",
        hasLesson: true,
        isCompleted: false,
      },
    ];

    const mockN1Topics: CurriculumTopic[] = [
      {
        id: "top_n1_1",
        level: "N1",
        unitIndex: 1,
        unitTitle: "Advanced",
        lessonIndex: 1,
        title: "N1 Topic 1",
        grammarKey: "advanced-n1",
        objective: "Learn N1",
        hasLesson: false,
        isCompleted: false,
      },
    ];

    let resolveN1: (val: CurriculumTopic[]) => void;
    const n1Promise = new Promise<CurriculumTopic[]>((resolve) => {
      resolveN1 = resolve;
    });

    vi.mocked(getCurriculumAction).mockImplementation(async (level) => {
      if (level === "N5") return mockN5Topics;
      if (level === "N1") return n1Promise;
      return [];
    });

    const { result } = renderHook(() => useTutor(), {
      wrapper: ({ children }) => <TutorProvider>{children}</TutorProvider>,
    });

    // Wait for initial N5 load to complete
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.selectedLevel).toBe("N5");
    expect(result.current.curriculum).toEqual(mockN5Topics);
    expect(result.current.isLoadingCurriculum).toBe(false);

    // Switch to N1 (which is not yet in cache and has an unresolved promise)
    act(() => {
      result.current.setSelectedLevel("N1");
    });

    // Stale N5 topics MUST be cleared immediately and loading state must be active
    expect(result.current.selectedLevel).toBe("N1");
    expect(result.current.curriculum).toEqual([]);
    expect(result.current.isLoadingCurriculum).toBe(true);

    // Resolve N1 network request
    await act(async () => {
      resolveN1(mockN1Topics);
      await Promise.resolve();
    });

    expect(result.current.curriculum).toEqual(mockN1Topics);
    expect(result.current.isLoadingCurriculum).toBe(false);
  });

  it("should set error notification when getLessonAction returns null", async () => {
    vi.mocked(getCurriculumAction).mockResolvedValue([]);
    vi.mocked(getLessonAction).mockResolvedValue(null);

    const { result } = renderHook(() => useTutor(), {
      wrapper: ({ children }) => <TutorProvider>{children}</TutorProvider>,
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.error).toBeNull();

    let res: Lesson | null = null;
    await act(async () => {
      res = await result.current.loadLesson("failed_topic");
    });

    expect(res).toBeNull();
    expect(result.current.currentLesson).toBeNull();
    expect(result.current.error).toBe(
      "Failed to generate or load this lesson. Please check your network and try again."
    );

    // Dismiss error
    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it("should set error notification when getLessonAction throws an error", async () => {
    vi.mocked(getCurriculumAction).mockResolvedValue([]);
    vi.mocked(getLessonAction).mockRejectedValue(new Error("Network offline"));

    const { result } = renderHook(() => useTutor(), {
      wrapper: ({ children }) => <TutorProvider>{children}</TutorProvider>,
    });

    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      await result.current.loadLesson("error_topic");
    });

    expect(result.current.currentLesson).toBeNull();
    expect(result.current.error).toBe("Failed to generate or load lesson. Please try again.");
  });

  it("should clear both currentLesson and selectedTopicId when closeLesson is called", async () => {
    const mockLesson: Lesson = {
      id: "les_1",
      topicId: "top_1",
      title: "Test Lesson",
      level: "N5",
      theoryMarkdown: "# Test",
      dialogue: [],
      vocabulary: [],
      exercises: [],
    };

    vi.mocked(getCurriculumAction).mockResolvedValue([]);
    vi.mocked(getLessonAction).mockResolvedValue(mockLesson);

    const { result } = renderHook(() => useTutor(), {
      wrapper: ({ children }) => <TutorProvider>{children}</TutorProvider>,
    });

    await act(async () => {
      await result.current.loadLesson("top_1");
    });

    expect(result.current.selectedTopicId).toBe("top_1");
    expect(result.current.currentLesson).toEqual(mockLesson);

    act(() => {
      result.current.closeLesson();
    });

    expect(result.current.selectedTopicId).toBeNull();
    expect(result.current.currentLesson).toBeNull();
  });
});
