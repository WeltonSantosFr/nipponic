import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { TutorProvider, useTutor } from "./TutorContext";
import {
  getCurriculumAction,
  getLessonAction,
  submitLessonProgressAction,
  submitLessonFeedbackAction,
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

let mockIsAuthenticated = true;
let mockDecks: any[] = [];
const mockCreateDeck = vi.fn();
const mockCreateCard = vi.fn();
const mockAddCardsToDeck = vi.fn();

vi.mock("./AuthContext", () => ({
  useAuth: () => ({
    isAuthenticated: mockIsAuthenticated,
  }),
}));

vi.mock("./FlashCardsContext", () => ({
  useFlashCards: () => ({
    decks: mockDecks,
    createDeck: mockCreateDeck,
    createCard: mockCreateCard,
    addCardsToDeck: mockAddCardsToDeck,
  }),
}));

const makeLesson = (id: string, overrides: Partial<Lesson> = {}): Lesson => ({
  id,
  topicId: `topic_${id}`,
  title: `Lesson ${id}`,
  level: "N5",
  theoryMarkdown: "# Theory Content",
  dialogue: [],
  vocabulary: [
    { jpText: "食べる", reading: "たべる", enText: "to eat" },
    { jpText: "水", reading: "水", enText: "water" },
  ],
  exercises: [],
  score: undefined,
  isCompleted: false,
  ...overrides,
});

describe("TutorContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsAuthenticated = true;
    mockDecks = [];
    localStorage.clear();
    vi.mocked(getCurriculumAction).mockResolvedValue([]);
    vi.mocked(getLessonAction).mockResolvedValue(null);
    vi.mocked(submitLessonProgressAction).mockResolvedValue({ success: true, score: 85 });
    vi.mocked(submitLessonFeedbackAction).mockResolvedValue({ success: true });
    vi.mocked(generateNextUnitAction).mockResolvedValue([]);
    mockCreateDeck.mockResolvedValue({ id: "new-deck-123", name: "Tutor: JLPT N5" });
    mockCreateCard.mockImplementation(async (data) => ({ id: `card_${Math.random()}`, ...data }));
    mockAddCardsToDeck.mockResolvedValue(undefined);
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network offline")));
  });

  afterEach(() => {
    mockIsAuthenticated = true;
    mockDecks = [];
    vi.unstubAllGlobals();
  });

  it("throws an error when useTutor is used outside TutorProvider", () => {
    // Suppress React boundary console.error for expected throw
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => useTutor())).toThrow(
      "useTutor must be used within a TutorProvider"
    );
    consoleSpy.mockRestore();
  });

  describe("Curriculum Loading & Fallbacks", () => {
    it("clears curriculum immediately and sets isLoadingCurriculum when switching to an uncached level", async () => {
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

      await waitFor(() => {
        expect(result.current.curriculum).toEqual(mockN5Topics);
        expect(result.current.isLoadingCurriculum).toBe(false);
      });

      // Switch to N1 (uncached)
      act(() => {
        result.current.setSelectedLevel("N1");
      });

      expect(result.current.curriculum).toEqual([]);
      expect(result.current.isLoadingCurriculum).toBe(true);

      // Resolve N1
      await act(async () => {
        resolveN1!(mockN1Topics);
      });

      await waitFor(() => {
        expect(result.current.curriculum).toEqual(mockN1Topics);
        expect(result.current.isLoadingCurriculum).toBe(false);
      });
    });

    it("uses in-memory cache and initiates silent background reload on cached level switch", async () => {
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
      const mockN4Topics: CurriculumTopic[] = [
        {
          id: "top_n4_1",
          level: "N4",
          unitIndex: 1,
          unitTitle: "Basics N4",
          lessonIndex: 1,
          title: "N4 Topic 1",
          grammarKey: "n4-desu",
          objective: "Learn N4",
          hasLesson: true,
          isCompleted: false,
        },
      ];

      vi.mocked(getCurriculumAction).mockImplementation(async (level) => {
        if (level === "N5") return mockN5Topics;
        if (level === "N4") return mockN4Topics;
        return [];
      });

      const { result } = renderHook(() => useTutor(), {
        wrapper: ({ children }) => <TutorProvider>{children}</TutorProvider>,
      });

      await waitFor(() => expect(result.current.curriculum).toEqual(mockN5Topics));

      // Load N4 to cache it
      act(() => {
        result.current.setSelectedLevel("N4");
      });
      await waitFor(() => expect(result.current.curriculum).toEqual(mockN4Topics));

      // Switch back to N5 - should load instantly from memory cache
      act(() => {
        result.current.setSelectedLevel("N5");
      });

      expect(result.current.curriculum).toEqual(mockN5Topics);
    });

    it("leaves curriculum empty and clears cache when backend returns empty array (e.g. unseeded N4..N1 levels)", async () => {
      // Pre-populate old cache for N1
      localStorage.setItem(
        "nipponic.tutor_curriculum_cache",
        JSON.stringify({ N1: [{ id: "old_n1", title: "Old N1" }] })
      );

      vi.mocked(getCurriculumAction).mockResolvedValue([]);
      vi.stubGlobal(
        "fetch",
        vi.fn().mockImplementation(async (url: string) => {
          if (url.includes("/tutor/curriculum")) {
            return {
              ok: true,
              json: async () => [],
            };
          }
          return { ok: false };
        })
      );

      const { result } = renderHook(() => useTutor(), {
        wrapper: ({ children }) => <TutorProvider>{children}</TutorProvider>,
      });

      await waitFor(() => {
        expect(result.current.curriculum).toEqual([]);
      });

      // Switch to N1 with empty server response
      act(() => {
        result.current.setSelectedLevel("N1");
      });

      await waitFor(() => {
        expect(result.current.curriculum).toEqual([]);
      });

      // Assert that localStorage cache for N1 was cleared
      const raw = localStorage.getItem("nipponic.tutor_curriculum_cache");
      const parsed = raw ? JSON.parse(raw) : {};
      expect(parsed["N1"]).toBeUndefined();
    });

    it("falls back to direct API when getCurriculumAction throws or returns empty and merges local progress", async () => {
      // Local progress for guest user
      localStorage.setItem("nipponic.tutor_progress", JSON.stringify({
        top_api_1: { completedAt: "2026-10-18T10:00:00Z", score: 95 }
      }));
      localStorage.setItem("nipponic.token", "test-auth-token");

      vi.mocked(getCurriculumAction).mockRejectedValue(new Error("Server action unavailable"));

      const directTopics: CurriculumTopic[] = [
        {
          id: "top_api_1",
          level: "N5",
          unitIndex: 1,
          unitTitle: "Unit 1",
          lessonIndex: 1,
          title: "API Topic 1",
          grammarKey: "k-1",
          objective: "Obj",
          hasLesson: true,
          isCompleted: false,
        },
      ];

      vi.stubGlobal(
        "fetch",
        vi.fn().mockImplementation(async (url: string, opts: any) => {
          if (url.includes("/tutor/curriculum?level=N5")) {
            expect(opts.headers.Authorization).toBe("Bearer test-auth-token");
            return {
              ok: true,
              json: async () => directTopics,
            };
          }
          return { ok: false, status: 500 };
        })
      );

      const { result } = renderHook(() => useTutor(), {
        wrapper: ({ children }) => <TutorProvider>{children}</TutorProvider>,
      });

      await waitFor(() => {
        expect(result.current.curriculum).toHaveLength(1);
        expect(result.current.curriculum[0]?.id).toBe("top_api_1");
        // Merged with local progress
        expect(result.current.curriculum[0]?.isCompleted).toBe(true);
        expect(result.current.curriculum[0]?.completedScore).toBe(95);
      });
    });

    it("falls back to cached curriculum from localStorage when both server action and direct API fail", async () => {
      const cachedTopics: CurriculumTopic[] = [
        {
          id: "top_cached_1",
          level: "N5",
          unitIndex: 1,
          unitTitle: "Unit 1",
          lessonIndex: 1,
          title: "Cached Topic",
          grammarKey: "key-cached",
          objective: "Cached objective",
          hasLesson: true,
          isCompleted: false,
        },
      ];
      localStorage.setItem("nipponic.tutor_curriculum_cache", JSON.stringify({ N5: cachedTopics }));

      vi.mocked(getCurriculumAction).mockRejectedValue(new Error("Server action failed"));
      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Direct API failed")));

      const { result } = renderHook(() => useTutor(), {
        wrapper: ({ children }) => <TutorProvider>{children}</TutorProvider>,
      });

      await waitFor(() => {
        expect(result.current.curriculum).toEqual(cachedTopics);
      });
    });

    it("sets error notification when an unexpected error occurs loading curriculum and no cache exists", async () => {
      vi.mocked(getCurriculumAction).mockResolvedValue([] as any);
      vi.stubGlobal(
        "fetch",
        vi.fn().mockImplementation(async (url: string) => {
          if (url.includes("/tutor/curriculum")) {
            return {
              ok: true,
              json: async () => ({ length: 1 }),
            };
          }
          return { ok: false };
        })
      );

      const { result } = renderHook(() => useTutor(), {
        wrapper: ({ children }) => <TutorProvider>{children}</TutorProvider>,
      });

      await waitFor(() => {
        expect(result.current.error).toBe(
          "Failed to load curriculum topics. Please check your network and try again."
        );
      });

      // Clear error
      act(() => {
        result.current.clearError();
      });
      expect(result.current.error).toBeNull();
    });

    it("falls back to stored curriculum when unexpected error occurs during load", async () => {
      const cached = [{ id: "c1", level: "N5", unitIndex: 1, unitTitle: "U", lessonIndex: 1, title: "T", grammarKey: "k", objective: "O", hasLesson: false, isCompleted: false }];
      localStorage.setItem("nipponic.tutor_curriculum_cache", JSON.stringify({ N5: cached }));

      vi.mocked(getCurriculumAction).mockResolvedValue([] as any);
      vi.stubGlobal(
        "fetch",
        vi.fn().mockImplementation(async (url: string) => {
          if (url.includes("/tutor/curriculum")) {
            return {
              ok: true,
              json: async () => ({ length: 1 }),
            };
          }
          return { ok: false };
        })
      );

      const { result } = renderHook(() => useTutor(), {
        wrapper: ({ children }) => <TutorProvider>{children}</TutorProvider>,
      });

      await waitFor(() => {
        expect(result.current.curriculum).toEqual(cached);
      });
    });

    it("gracefully handles corrupted JSON in localStorage progress and curriculum caches", async () => {
      localStorage.setItem("nipponic.tutor_progress", "invalid-json{{");
      localStorage.setItem("nipponic.tutor_curriculum_cache", "invalid-json{{");

      const { result } = renderHook(() => useTutor(), {
        wrapper: ({ children }) => <TutorProvider>{children}</TutorProvider>,
      });

      await waitFor(() => {
        expect(result.current.curriculum).toBeDefined();
      });
    });

    it("setSelectedLevel loads stored curriculum from localStorage and merges local progress", async () => {
      const storedTopics: CurriculumTopic[] = [
        {
          id: "top_stored_n2",
          level: "N2",
          unitIndex: 1,
          unitTitle: "Unit N2",
          lessonIndex: 1,
          title: "Topic N2",
          grammarKey: "k-n2",
          objective: "Obj",
          hasLesson: true,
          isCompleted: false,
        },
      ];
      localStorage.setItem("nipponic.tutor_curriculum_cache", JSON.stringify({ N2: storedTopics }));
      localStorage.setItem("nipponic.tutor_progress", JSON.stringify({
        top_stored_n2: { completedAt: "2026-10-18T10:00:00Z", score: 92 }
      }));

      const { result } = renderHook(() => useTutor(), {
        wrapper: ({ children }) => <TutorProvider>{children}</TutorProvider>,
      });

      await waitFor(() => expect(result.current.curriculum).toBeDefined());

      act(() => {
        result.current.setSelectedLevel("N2");
      });

      await waitFor(() => {
        expect(result.current.curriculum[0]?.id).toBe("top_stored_n2");
        expect(result.current.curriculum[0]?.isCompleted).toBe(true);
        expect(result.current.curriculum[0]?.completedScore).toBe(92);
      });
    });
  });

  describe("Unit Generation", () => {
    it("generateNextUnit merges generated topics with localProgress and handles unexpected outer catch", async () => {
      localStorage.setItem("nipponic.tutor_progress", JSON.stringify({
        top_gen_with_prog: { completedAt: "2026-10-18T10:00:00Z", score: 88 }
      }));

      const generated: CurriculumTopic[] = [
        {
          id: "top_gen_with_prog",
          level: "N5",
          unitIndex: 2,
          unitTitle: "Unit 2",
          lessonIndex: 1,
          title: "Topic with progress",
          grammarKey: "k-prog",
          objective: "Obj",
          hasLesson: false,
          isCompleted: false,
        },
      ];
      vi.mocked(generateNextUnitAction).mockResolvedValue(generated);

      const { result } = renderHook(() => useTutor(), {
        wrapper: ({ children }) => <TutorProvider>{children}</TutorProvider>,
      });

      let success = false;
      await act(async () => {
        success = await result.current.generateNextUnit();
      });

      expect(success).toBe(true);
      expect(result.current.curriculum[0]?.isCompleted).toBe(true);
      expect(result.current.curriculum[0]?.completedScore).toBe(88);

      // Unexpected exception in outer catch
      vi.mocked(generateNextUnitAction).mockResolvedValue([] as any);
      vi.stubGlobal(
        "fetch",
        vi.fn().mockImplementation(async (url: string) => {
          if (url.includes("/tutor/curriculum/generate")) {
            return {
              ok: true,
              json: async () => ({ length: 1 }), // triggers TypeError in mapping
            };
          }
          return { ok: false };
        })
      );

      let failSuccess = true;
      await act(async () => {
        failSuccess = await result.current.generateNextUnit();
      });

      expect(failSuccess).toBe(false);
      expect(result.current.error).toBe("Failed to generate next unit with AI. Please try again.");
    });

    it("blocks generateNextUnit and shows English error when user is offline", async () => {
      const originalOnLine = navigator.onLine;
      Object.defineProperty(navigator, "onLine", { configurable: true, value: false });

      const { result } = renderHook(() => useTutor(), {
        wrapper: ({ children }) => <TutorProvider>{children}</TutorProvider>,
      });

      let success = true;
      await act(async () => {
        success = await result.current.generateNextUnit();
      });

      expect(success).toBe(false);
      expect(result.current.error).toBe(
        "You are currently offline. Connect to the internet to generate new units with AI."
      );

      Object.defineProperty(navigator, "onLine", { configurable: true, value: originalOnLine });
    });

    it("generates next unit successfully via generateNextUnitAction", async () => {
      const generated: CurriculumTopic[] = [
        {
          id: "top_gen_1",
          level: "N5",
          unitIndex: 2,
          unitTitle: "Unit 2",
          lessonIndex: 1,
          title: "New Unit Topic",
          grammarKey: "k-2",
          objective: "Obj 2",
          hasLesson: false,
          isCompleted: false,
        },
      ];
      vi.mocked(generateNextUnitAction).mockResolvedValue(generated);

      const { result } = renderHook(() => useTutor(), {
        wrapper: ({ children }) => <TutorProvider>{children}</TutorProvider>,
      });

      let success = false;
      await act(async () => {
        success = await result.current.generateNextUnit();
      });

      expect(success).toBe(true);
      expect(result.current.curriculum).toEqual(generated);
    });

    it("falls back to direct API when generateNextUnitAction fails", async () => {
      vi.mocked(generateNextUnitAction).mockRejectedValue(new Error("Timeout"));
      const directTopics: CurriculumTopic[] = [
        {
          id: "top_direct_gen",
          level: "N5",
          unitIndex: 2,
          unitTitle: "Unit 2",
          lessonIndex: 1,
          title: "Direct Generated Topic",
          grammarKey: "k-dir",
          objective: "Obj",
          hasLesson: false,
          isCompleted: false,
        },
      ];

      vi.stubGlobal(
        "fetch",
        vi.fn().mockImplementation(async (url: string) => {
          if (url.includes("/tutor/curriculum/generate")) {
            return {
              ok: true,
              json: async () => directTopics,
            };
          }
          return { ok: false, status: 500 };
        })
      );

      const { result } = renderHook(() => useTutor(), {
        wrapper: ({ children }) => <TutorProvider>{children}</TutorProvider>,
      });

      let success = false;
      await act(async () => {
        success = await result.current.generateNextUnit("N5");
      });

      expect(success).toBe(true);
      expect(result.current.curriculum).toEqual(directTopics);
    });

    it("handles failure when both action and direct API fail during generateNextUnit", async () => {
      vi.mocked(generateNextUnitAction).mockRejectedValue(new Error("Timeout"));
      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("API Down")));

      const { result } = renderHook(() => useTutor(), {
        wrapper: ({ children }) => <TutorProvider>{children}</TutorProvider>,
      });

      let success = true;
      await act(async () => {
        success = await result.current.generateNextUnit();
      });

      expect(success).toBe(false);
    });
  });

  describe("Lesson Loading & Closing", () => {
    it("loads lesson successfully and updates state", async () => {
      const lesson = makeLesson("les-1");
      vi.mocked(getLessonAction).mockResolvedValue(lesson);

      const { result } = renderHook(() => useTutor(), {
        wrapper: ({ children }) => <TutorProvider>{children}</TutorProvider>,
      });

      let loadedLesson: Lesson | null = null;
      await act(async () => {
        loadedLesson = await result.current.loadLesson("topic-1");
      });

      expect(loadedLesson).toEqual(lesson);
      expect(result.current.currentLesson).toEqual(lesson);
      expect(result.current.selectedTopicId).toBe("topic-1");
    });

    it("sets error notification when getLessonAction returns null", async () => {
      vi.mocked(getLessonAction).mockResolvedValue(null);

      const { result } = renderHook(() => useTutor(), {
        wrapper: ({ children }) => <TutorProvider>{children}</TutorProvider>,
      });

      let res: Lesson | null = null;
      await act(async () => {
        res = await result.current.loadLesson("topic-null");
      });

      expect(res).toBeNull();
      expect(result.current.error).toBe(
        "Failed to generate or load this lesson. Please check your network and try again."
      );
    });

    it("sets error notification when getLessonAction throws an error", async () => {
      vi.mocked(getLessonAction).mockRejectedValue(new Error("Action failed"));

      const { result } = renderHook(() => useTutor(), {
        wrapper: ({ children }) => <TutorProvider>{children}</TutorProvider>,
      });

      let res: Lesson | null = null;
      await act(async () => {
        res = await result.current.loadLesson("topic-throw");
      });

      expect(res).toBeNull();
      expect(result.current.error).toBe("Failed to generate or load lesson. Please try again.");
    });

    it("falls back to direct API and loads lesson successfully when getLessonAction returns null", async () => {
      vi.mocked(getLessonAction).mockResolvedValue(null);
      const directLesson = makeLesson("les-dir-ok");
      vi.stubGlobal(
        "fetch",
        vi.fn().mockImplementation(async (url: string) => {
          if (url.includes("/tutor/topics/topic-direct-ok/lesson")) {
            return {
              ok: true,
              json: async () => directLesson,
            };
          }
          return { ok: false };
        })
      );

      const { result } = renderHook(() => useTutor(), {
        wrapper: ({ children }) => <TutorProvider>{children}</TutorProvider>,
      });

      let res: Lesson | null = null;
      await act(async () => {
        res = await result.current.loadLesson("topic-direct-ok");
      });

      expect(res).toEqual(directLesson);
      expect(result.current.currentLesson).toEqual(directLesson);
    });

    it("handles unexpected runtime exception during loadLesson in outer catch", async () => {
      vi.mocked(getLessonAction).mockResolvedValue(null);
      vi.stubGlobal(
        "fetch",
        vi.fn().mockImplementation(async (url: string) => {
          if (url.includes("/tutor/topics/")) {
            return {
              ok: true,
              json: async () => {
                throw new Error("JSON parsing crash");
              },
            };
          }
          return { ok: false };
        })
      );

      const { result } = renderHook(() => useTutor(), {
        wrapper: ({ children }) => <TutorProvider>{children}</TutorProvider>,
      });

      let res: Lesson | null = null;
      await act(async () => {
        res = await result.current.loadLesson("topic-parse-crash");
      });

      expect(res).toBeNull();
      expect(result.current.error).toBe(
        "Failed to generate or load this lesson. Please check your network and try again."
      );
    });

    it("clears both currentLesson and selectedTopicId when closeLesson is called", async () => {
      const lesson = makeLesson("les-close");
      vi.mocked(getLessonAction).mockResolvedValue(lesson);

      const { result } = renderHook(() => useTutor(), {
        wrapper: ({ children }) => <TutorProvider>{children}</TutorProvider>,
      });

      await act(async () => {
        await result.current.loadLesson("topic-close");
      });
      expect(result.current.currentLesson).not.toBeNull();
      expect(result.current.selectedTopicId).toBe("topic-close");

      act(() => {
        result.current.closeLesson();
      });

      expect(result.current.currentLesson).toBeNull();
      expect(result.current.selectedTopicId).toBeNull();
    });
  });

  describe("submitProgress", () => {
    it("returns false if currentLesson is null", async () => {
      const { result } = renderHook(() => useTutor(), {
        wrapper: ({ children }) => <TutorProvider>{children}</TutorProvider>,
      });

      let success = true;
      await act(async () => {
        success = await result.current.submitProgress(100);
      });

      expect(success).toBe(false);
    });

    it("persists progress locally and calls submitLessonProgressAction when authenticated", async () => {
      const lesson = makeLesson("les-prog", { topicId: "top-prog" });
      const topic: CurriculumTopic = {
        id: "top-prog",
        level: "N5",
        unitIndex: 1,
        unitTitle: "Unit",
        lessonIndex: 1,
        title: "Topic Prog",
        grammarKey: "k",
        objective: "Obj",
        hasLesson: true,
        isCompleted: false,
      };
      vi.mocked(getCurriculumAction).mockResolvedValue([topic]);
      vi.mocked(getLessonAction).mockResolvedValue(lesson);

      const { result } = renderHook(() => useTutor(), {
        wrapper: ({ children }) => <TutorProvider>{children}</TutorProvider>,
      });

      await waitFor(() => expect(result.current.curriculum).toHaveLength(1));

      await act(async () => {
        await result.current.loadLesson("top-prog");
      });

      let res = false;
      await act(async () => {
        res = await result.current.submitProgress(85);
      });

      expect(res).toBe(true);
      expect(submitLessonProgressAction).toHaveBeenCalledWith("les-prog", { score: 85 });
      expect(result.current.currentLesson?.isCompleted).toBe(true);
      expect(result.current.currentLesson?.score).toBe(85);
      expect(result.current.curriculum[0]?.isCompleted).toBe(true);
      expect(result.current.curriculum[0]?.completedScore).toBe(85);

      // Verify localStorage
      const stored = JSON.parse(localStorage.getItem("nipponic.tutor_progress") || "{}");
      expect(stored["les-prog"].score).toBe(85);
    });

    it("falls back to direct API when submitLessonProgressAction throws", async () => {
      const lesson = makeLesson("les-prog-fallback");
      vi.mocked(getLessonAction).mockResolvedValue(lesson);
      vi.mocked(submitLessonProgressAction).mockRejectedValue(new Error("Timeout"));

      const fetchSpy = vi.fn().mockResolvedValue({ ok: true });
      vi.stubGlobal("fetch", fetchSpy);

      const { result } = renderHook(() => useTutor(), {
        wrapper: ({ children }) => <TutorProvider>{children}</TutorProvider>,
      });

      await act(async () => {
        await result.current.loadLesson("top-1");
      });

      let res = false;
      await act(async () => {
        res = await result.current.submitProgress(90);
      });

      expect(res).toBe(true);
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining("/tutor/lessons/les-prog-fallback/progress"),
        expect.objectContaining({ method: "POST" })
      );
    });

    it("handles unauthenticated state by persisting progress locally without backend call", async () => {
      mockIsAuthenticated = false;
      const lesson = makeLesson("les-guest");
      vi.mocked(getLessonAction).mockResolvedValue(lesson);

      const { result } = renderHook(() => useTutor(), {
        wrapper: ({ children }) => <TutorProvider>{children}</TutorProvider>,
      });

      await act(async () => {
        await result.current.loadLesson("top-1");
      });

      let res = false;
      await act(async () => {
        res = await result.current.submitProgress(70);
      });

      expect(res).toBe(true);
      expect(submitLessonProgressAction).not.toHaveBeenCalled();
      const stored = JSON.parse(localStorage.getItem("nipponic.tutor_progress") || "{}");
      expect(stored["les-guest"].score).toBe(70);
    });
  });

  describe("submitFeedback", () => {
    it("returns false if currentLesson is null", async () => {
      const { result } = renderHook(() => useTutor(), {
        wrapper: ({ children }) => <TutorProvider>{children}</TutorProvider>,
      });

      let res = true;
      await act(async () => {
        res = await result.current.submitFeedback("helpful");
      });

      expect(res).toBe(false);
    });

    it("submits feedback successfully via submitLessonFeedbackAction", async () => {
      const lesson = makeLesson("les-fb-1");
      vi.mocked(getLessonAction).mockResolvedValue(lesson);
      vi.mocked(submitLessonFeedbackAction).mockResolvedValue({ success: true });

      const { result } = renderHook(() => useTutor(), {
        wrapper: ({ children }) => <TutorProvider>{children}</TutorProvider>,
      });

      await act(async () => {
        await result.current.loadLesson("top-1");
      });

      let res = false;
      await act(async () => {
        res = await result.current.submitFeedback("helpful", "Great lesson!");
      });

      expect(res).toBe(true);
      expect(submitLessonFeedbackAction).toHaveBeenCalledWith("les-fb-1", {
        rating: "helpful",
        comment: "Great lesson!",
      });
    });

    it("falls back to direct API when submitLessonFeedbackAction returns failure or throws", async () => {
      const lesson = makeLesson("les-fb-direct");
      vi.mocked(getLessonAction).mockResolvedValue(lesson);
      vi.mocked(submitLessonFeedbackAction).mockRejectedValue(new Error("Action error"));

      vi.stubGlobal(
        "fetch",
        vi.fn().mockImplementation(async (url: string) => {
          if (url.includes("/tutor/lessons/les-fb-direct/feedback")) {
            return {
              ok: true,
              json: async () => ({ success: true }),
            };
          }
          return { ok: false };
        })
      );

      const { result } = renderHook(() => useTutor(), {
        wrapper: ({ children }) => <TutorProvider>{children}</TutorProvider>,
      });

      await act(async () => {
        await result.current.loadLesson("top-1");
      });

      let res = false;
      await act(async () => {
        res = await result.current.submitFeedback("confusing", "Could be clearer");
      });

      expect(res).toBe(true);
    });

    it("returns false when both action and direct API fail during submitFeedback", async () => {
      const lesson = makeLesson("les-fb-fail");
      vi.mocked(getLessonAction).mockResolvedValue(lesson);
      vi.mocked(submitLessonFeedbackAction).mockRejectedValue(new Error("Action error"));
      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("API offline")));

      const { result } = renderHook(() => useTutor(), {
        wrapper: ({ children }) => <TutorProvider>{children}</TutorProvider>,
      });

      await act(async () => {
        await result.current.loadLesson("top-1");
      });

      let res = true;
      await act(async () => {
        res = await result.current.submitFeedback("confusing");
      });

      expect(res).toBe(false);
    });
  });

  describe("addVocabularyToDeck", () => {
    it("returns 0 if currentLesson is null or vocabulary is empty", async () => {
      const { result } = renderHook(() => useTutor(), {
        wrapper: ({ children }) => <TutorProvider>{children}</TutorProvider>,
      });

      let res = await result.current.addVocabularyToDeck();
      expect(res.createdCount).toBe(0);

      // Lesson with empty vocabulary
      const emptyVocabLesson = makeLesson("empty-vocab", { vocabulary: [] });
      vi.mocked(getLessonAction).mockResolvedValue(emptyVocabLesson);

      await act(async () => {
        await result.current.loadLesson("top-1");
      });

      res = await result.current.addVocabularyToDeck();
      expect(res.createdCount).toBe(0);
    });

    it("adds vocabulary to existing deck if found matching Tutor: JLPT N5", async () => {
      mockDecks = [{ id: "existing-deck-id", name: "Tutor: JLPT N5" }];
      const lesson = makeLesson("les-vocab-1", {
        vocabulary: [
          { jpText: "食べる", reading: "たべる", enText: "to eat" },
          { jpText: "水", reading: "水", enText: "water" }, // reading matches jpText
        ],
      });
      vi.mocked(getLessonAction).mockResolvedValue(lesson);

      const { result } = renderHook(() => useTutor(), {
        wrapper: ({ children }) => <TutorProvider>{children}</TutorProvider>,
      });

      await act(async () => {
        await result.current.loadLesson("top-1");
      });

      let res = { createdCount: 0 };
      await act(async () => {
        res = await result.current.addVocabularyToDeck();
      });

      expect(res.createdCount).toBe(2);
      expect(mockCreateDeck).not.toHaveBeenCalled(); // Used existing deck
      expect(mockCreateCard).toHaveBeenCalledWith({
        jpText: "食べる",
        enText: "[たべる] to eat",
      });
      expect(mockCreateCard).toHaveBeenCalledWith({
        jpText: "水",
        enText: "water",
      });
      expect(mockAddCardsToDeck).toHaveBeenCalledWith("existing-deck-id", expect.any(Array));
    });

    it("creates a new deck if matching deck does not exist, and uses specified targetDeckId when given", async () => {
      mockDecks = [];
      const lesson = makeLesson("les-vocab-2");
      vi.mocked(getLessonAction).mockResolvedValue(lesson);

      const { result } = renderHook(() => useTutor(), {
        wrapper: ({ children }) => <TutorProvider>{children}</TutorProvider>,
      });

      await act(async () => {
        await result.current.loadLesson("top-1");
      });

      // Provide custom targetDeckId
      let res = { createdCount: 0 };
      await act(async () => {
        res = await result.current.addVocabularyToDeck("custom-target-deck");
      });

      expect(res.createdCount).toBe(2);
      expect(mockAddCardsToDeck).toHaveBeenCalledWith("custom-target-deck", expect.any(Array));

      // Without targetDeckId and no existing deck -> creates deck
      mockAddCardsToDeck.mockClear();
      await act(async () => {
        res = await result.current.addVocabularyToDeck();
      });

      expect(mockCreateDeck).toHaveBeenCalledWith("Tutor: JLPT N5");
      expect(mockAddCardsToDeck).toHaveBeenCalledWith("new-deck-123", expect.any(Array));
    });

    it("returns 0 if deck creation fails", async () => {
      mockDecks = [];
      mockCreateDeck.mockResolvedValue(null);
      const lesson = makeLesson("les-vocab-fail");
      vi.mocked(getLessonAction).mockResolvedValue(lesson);

      const { result } = renderHook(() => useTutor(), {
        wrapper: ({ children }) => <TutorProvider>{children}</TutorProvider>,
      });

      await act(async () => {
        await result.current.loadLesson("top-1");
      });

      let res = { createdCount: -1 };
      await act(async () => {
        res = await result.current.addVocabularyToDeck();
      });

      expect(res.createdCount).toBe(0);
    });
  });
});
