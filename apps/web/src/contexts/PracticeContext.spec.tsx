import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import {
  PracticeProvider,
  usePractice,
  GUEST_TRANSLATION_STORAGE_KEY,
  AUTH_TRANSLATION_STORAGE_KEY,
  TOKEN_STORAGE_KEY,
} from "./PracticeContext";
import {
  MVP_TRANSLATION_PROMPTS,
  getTodayLocalDate,
  buildTranslationDailyState,
  type TranslationDailyState,
  type SubmitTranslationResponse,
  type TranslationProgress,
} from "@nipponic/shared";
import { API_URL } from "@/lib/api-config";

let mockIsAuthenticated = false;

vi.mock("./AuthContext", () => ({
  useAuth: () => ({
    isAuthenticated: mockIsAuthenticated,
  }),
}));

describe("PracticeContext", () => {
  const today = getTodayLocalDate();

  beforeEach(() => {
    vi.clearAllMocks();
    mockIsAuthenticated = false;
    localStorage.clear();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Offline by default")));
  });

  afterEach(() => {
    mockIsAuthenticated = false;
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it("throws an error when usePractice is called outside PracticeProvider", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => usePractice())).toThrow(
      "usePractice must be used within a PracticeProvider"
    );
    consoleSpy.mockRestore();
  });

  describe("Guest Flow", () => {
    it("loads Level 1 JP->EN prompt, wrong answer keeps unlocked without advancing, correct answer advances difficulty 1->2, sets isLockedToday: true, persists to localStorage", async () => {
      mockIsAuthenticated = false;

      const { result } = renderHook(() => usePractice(), {
        wrapper: PracticeProvider,
      });

      // Synchronously and cleanly initialized with Level 1 prompt
      expect(result.current.dailyState.prompt).not.toBeNull();
      expect(result.current.dailyState.prompt?.id).toBe("mvp-1-jp-en");
      expect(result.current.dailyState.prompt?.difficulty).toBe(1);
      expect(result.current.dailyState.prompt?.direction).toBe("JP_TO_EN");
      expect(result.current.dailyState.isLockedToday).toBe(false);
      expect(result.current.dailyState.allCompleted).toBe(false);
      expect(result.current.dailyState.progress.currentDifficulty).toBe(1);

      // Wrong answer attempt
      let wrongResult = null as SubmitTranslationResponse | null;
      await act(async () => {
        wrongResult = await result.current.submitTranslation("I love drinking coffee");
      });

      expect(wrongResult).not.toBeNull();
      expect(wrongResult?.isCorrect).toBe(false);
      expect(result.current.lastAttemptResult?.isCorrect).toBe(false);
      expect(result.current.dailyState.isLockedToday).toBe(false);
      expect(result.current.dailyState.progress.currentDifficulty).toBe(1);
      expect(result.current.dailyState.prompt?.id).toBe("mvp-1-jp-en");

      // Correct answer attempt
      let correctResult = null as SubmitTranslationResponse | null;
      await act(async () => {
        correctResult = await result.current.submitTranslation("Please give me some water.");
      });

      expect(correctResult).not.toBeNull();
      expect(correctResult?.isCorrect).toBe(true);
      expect(result.current.lastAttemptResult?.isCorrect).toBe(true);

      // Advances difficulty 1 -> 2
      expect(result.current.dailyState.progress.currentDifficulty).toBe(2);
      expect(result.current.dailyState.progress.totalCompleted).toBe(1);
      expect(result.current.dailyState.progress.completedPromptIds).toEqual(["mvp-1-jp-en"]);
      expect(result.current.dailyState.progress.lastCompletedDate).toBe(today);

      // Locked for today
      expect(result.current.dailyState.isLockedToday).toBe(true);

      // Next prompt is Level 2
      expect(result.current.dailyState.prompt?.id).toBe("mvp-2-en-jp");
      expect(result.current.dailyState.prompt?.difficulty).toBe(2);

      // Persisted to localStorage guest key
      const storedGuestRaw = localStorage.getItem(GUEST_TRANSLATION_STORAGE_KEY);
      expect(storedGuestRaw).not.toBeNull();
      const storedProgress: TranslationProgress = JSON.parse(storedGuestRaw!);
      expect(storedProgress.currentDifficulty).toBe(2);
      expect(storedProgress.completedPromptIds).toEqual(["mvp-1-jp-en"]);
      expect(storedProgress.lastCompletedDate).toBe(today);
      expect(storedProgress.totalCompleted).toBe(1);

      // Attempting to submit again while locked today returns alreadyLockedToday response
      let lockedAttempt = null as SubmitTranslationResponse | null;
      await act(async () => {
        lockedAttempt = await result.current.submitTranslation("Any answer");
      });

      expect(lockedAttempt).not.toBeNull();
      expect(lockedAttempt?.isCorrect).toBe(false);
      expect(lockedAttempt?.alreadyLockedToday).toBe(true);
      expect(lockedAttempt?.explanation).toBe(
        "Daily challenge already completed for today. Come back tomorrow!"
      );
    });

    it("guest devUnlockNext(false) unlocks Level 2 and devUnlockNext(true) resets all", async () => {
      mockIsAuthenticated = false;

      // Seed localStorage with completed Level 1 from today
      const completedL1Progress: TranslationProgress = {
        currentDifficulty: 2,
        completedPromptIds: ["mvp-1-jp-en"],
        lastCompletedDate: today,
        totalCompleted: 1,
      };
      localStorage.setItem(
        GUEST_TRANSLATION_STORAGE_KEY,
        JSON.stringify(completedL1Progress)
      );

      const { result } = renderHook(() => usePractice(), {
        wrapper: PracticeProvider,
      });

      await waitFor(() => {
        expect(result.current.dailyState.isLockedToday).toBe(true);
      });
      expect(result.current.dailyState.prompt?.id).toBe("mvp-2-en-jp");

      // devUnlockNext(false) -> clears today's lock without resetting completed history
      await act(async () => {
        await result.current.devUnlockNext(false);
      });

      expect(result.current.dailyState.isLockedToday).toBe(false);
      expect(result.current.dailyState.prompt?.id).toBe("mvp-2-en-jp");
      expect(result.current.dailyState.prompt?.difficulty).toBe(2);
      expect(result.current.dailyState.progress.completedPromptIds).toEqual(["mvp-1-jp-en"]);
      expect(result.current.dailyState.progress.lastCompletedDate).toBeNull();
      expect(result.current.lastAttemptResult).toBeNull();

      // Check localStorage updated
      const unlockedGuest = JSON.parse(
        localStorage.getItem(GUEST_TRANSLATION_STORAGE_KEY)!
      );
      expect(unlockedGuest.lastCompletedDate).toBeNull();

      // devUnlockNext(true) -> resets all progress back to Level 1
      await act(async () => {
        await result.current.devUnlockNext(true);
      });

      expect(result.current.dailyState.isLockedToday).toBe(false);
      expect(result.current.dailyState.prompt?.id).toBe("mvp-1-jp-en");
      expect(result.current.dailyState.prompt?.difficulty).toBe(1);
      expect(result.current.dailyState.progress.completedPromptIds).toEqual([]);
      expect(result.current.dailyState.progress.totalCompleted).toBe(0);
      expect(result.current.dailyState.progress.currentDifficulty).toBe(1);

      const resetGuest = JSON.parse(
        localStorage.getItem(GUEST_TRANSLATION_STORAGE_KEY)!
      );
      expect(resetGuest.completedPromptIds).toEqual([]);
      expect(resetGuest.totalCompleted).toBe(0);
    });
  });

  describe("Authenticated Flow", () => {
    it("fetches GET /translation/daily, submits via POST /translation/submit, handles offline fallback when fetch rejects", async () => {
      mockIsAuthenticated = true;
      const testToken = "mock-jwt-bearer-token";
      localStorage.setItem(TOKEN_STORAGE_KEY, testToken);

      const initialServerDailyState: TranslationDailyState = {
        prompt: MVP_TRANSLATION_PROMPTS[0] ?? null,
        progress: {
          currentDifficulty: 1,
          completedPromptIds: [],
          lastCompletedDate: null,
          totalCompleted: 0,
        },
        isLockedToday: false,
        allCompleted: false,
        totalPrompts: MVP_TRANSLATION_PROMPTS.length,
        nextDifficultyLabel: "Level 2 · Elementary",
      };

      const fetchMock = vi.fn().mockImplementation((url: string) => {
        if (url.includes("/translation/daily")) {
          return Promise.resolve({
            ok: true,
            json: async () => initialServerDailyState,
          });
        }
        return Promise.reject(new Error("Unknown URL"));
      });
      vi.stubGlobal("fetch", fetchMock);

      const { result } = renderHook(() => usePractice(), {
        wrapper: PracticeProvider,
      });

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(
          `${API_URL}/translation/daily?localDate=${today}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${testToken}`,
            },
          }
        );
      });

      // Verify state was populated from server and cached to auth storage key
      expect(result.current.dailyState.prompt?.id).toBe("mvp-1-jp-en");
      const authCached = JSON.parse(
        localStorage.getItem(AUTH_TRANSLATION_STORAGE_KEY)!
      );
      expect(authCached.currentDifficulty).toBe(1);

      // Now mock POST /translation/submit
      const updatedServerSubmitResponse: SubmitTranslationResponse = {
        isCorrect: true,
        canonicalAnswer: "Please give me some water.",
        answerReading: "おみずをください。",
        explanation: "Everyday polite request",
        state: {
          prompt: MVP_TRANSLATION_PROMPTS[1] ?? null,
          progress: {
            currentDifficulty: 2,
            completedPromptIds: ["mvp-1-jp-en"],
            lastCompletedDate: today,
            totalCompleted: 1,
          },
          isLockedToday: true,
          allCompleted: false,
          totalPrompts: MVP_TRANSLATION_PROMPTS.length,
          nextDifficultyLabel: "Level 3 · Intermediate",
        },
      };

      fetchMock.mockImplementation((url: string) => {
        if (url.includes("/translation/submit")) {
          return Promise.resolve({
            ok: true,
            json: async () => updatedServerSubmitResponse,
          });
        }
        return Promise.reject(new Error("Unexpected request"));
      });

      let submitRes: SubmitTranslationResponse | null = null;
      await act(async () => {
        submitRes = await result.current.submitTranslation("Please give me some water.");
      });

      expect(fetchMock).toHaveBeenCalledWith(
        `${API_URL}/translation/submit`,
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${testToken}`,
          },
          body: JSON.stringify({
            promptId: "mvp-1-jp-en",
            answer: "Please give me some water.",
            localDate: today,
          }),
        })
      );

      expect(submitRes).toEqual(updatedServerSubmitResponse);
      expect(result.current.dailyState.isLockedToday).toBe(true);
      expect(result.current.dailyState.prompt?.id).toBe("mvp-2-en-jp");
      expect(result.current.lastAttemptResult).toEqual(updatedServerSubmitResponse);

      const authCachedAfterSubmit = JSON.parse(
        localStorage.getItem(AUTH_TRANSLATION_STORAGE_KEY)!
      );
      expect(authCachedAfterSubmit.completedPromptIds).toEqual(["mvp-1-jp-en"]);
      expect(authCachedAfterSubmit.lastCompletedDate).toBe(today);

      // Unlock for next test so we can test offline fallback
      await act(async () => {
        await result.current.devUnlockNext(false);
      });
      expect(result.current.dailyState.isLockedToday).toBe(false);
      expect(result.current.dailyState.prompt?.id).toBe("mvp-2-en-jp");

      // Now simulate offline network error (fetch rejects)
      fetchMock.mockRejectedValue(new Error("Network connection dropped"));

      let offlineSubmitRes = null as SubmitTranslationResponse | null;
      await act(async () => {
        // Level 2 canonical answer: "毎朝コーヒーを飲みます。"
        offlineSubmitRes = await result.current.submitTranslation(
          "毎朝コーヒーを飲みます。"
        );
      });

      // Should fall back to local evaluation without throwing
      expect(offlineSubmitRes).not.toBeNull();
      expect(offlineSubmitRes?.isCorrect).toBe(true);
      expect(result.current.dailyState.progress.currentDifficulty).toBe(3);
      expect(result.current.dailyState.progress.totalCompleted).toBe(2);
      expect(result.current.dailyState.isLockedToday).toBe(true);

      // Persisted into auth cache
      const authCachedOffline = JSON.parse(
        localStorage.getItem(AUTH_TRANSLATION_STORAGE_KEY)!
      );
      expect(authCachedOffline.currentDifficulty).toBe(3);
      expect(authCachedOffline.completedPromptIds).toEqual([
        "mvp-1-jp-en",
        "mvp-2-en-jp",
      ]);
    });

    it("handles server HTTP error on submitTranslation", async () => {
      mockIsAuthenticated = true;
      localStorage.setItem(TOKEN_STORAGE_KEY, "bearer-token");

      const fetchMock = vi.fn().mockImplementation((url: string) => {
        if (url.includes("/translation/daily")) {
          return Promise.resolve({
            ok: true,
            json: async () =>
              buildTranslationDailyState(
                {
                  currentDifficulty: 1,
                  completedPromptIds: [],
                  lastCompletedDate: null,
                  totalCompleted: 0,
                },
                today
              ),
          });
        }
        if (url.includes("/translation/submit")) {
          return Promise.resolve({
            ok: false,
            status: 400,
            json: async () => ({ message: "Invalid submission payload" }),
          });
        }
        return Promise.reject(new Error("Unexpected URL"));
      });
      vi.stubGlobal("fetch", fetchMock);

      const { result } = renderHook(() => usePractice(), {
        wrapper: PracticeProvider,
      });

      await waitFor(() => {
        expect(result.current.dailyState.prompt?.id).toBe("mvp-1-jp-en");
      });

      let submitResult: SubmitTranslationResponse | null = null;
      await act(async () => {
        submitResult = await result.current.submitTranslation("Some text");
      });

      expect(submitResult).toBeNull();
      expect(result.current.error).toBe("Invalid submission payload");

      act(() => {
        result.current.clearError();
      });
      expect(result.current.error).toBeNull();
    });

    it("devUnlockNext calls dev-unlock API endpoint when authenticated in non-production", async () => {
      mockIsAuthenticated = true;
      const testToken = "dev-token";
      localStorage.setItem(TOKEN_STORAGE_KEY, testToken);

      const unlockedState: TranslationDailyState = {
        prompt: MVP_TRANSLATION_PROMPTS[1] ?? null,
        progress: {
          currentDifficulty: 2,
          completedPromptIds: ["mvp-1-jp-en"],
          lastCompletedDate: null,
          totalCompleted: 1,
        },
        isLockedToday: false,
        allCompleted: false,
        totalPrompts: MVP_TRANSLATION_PROMPTS.length,
        nextDifficultyLabel: "Level 3 · Intermediate",
      };

      const fetchMock = vi.fn().mockImplementation((url: string) => {
        if (url.includes("/translation/daily")) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              ...unlockedState,
              isLockedToday: true,
              progress: { ...unlockedState.progress, lastCompletedDate: today },
            }),
          });
        }
        if (url.includes("/translation/dev-unlock")) {
          return Promise.resolve({
            ok: true,
            json: async () => unlockedState,
          });
        }
        return Promise.reject(new Error("Unexpected URL"));
      });
      vi.stubGlobal("fetch", fetchMock);

      const { result } = renderHook(() => usePractice(), {
        wrapper: PracticeProvider,
      });

      await waitFor(() => {
        expect(result.current.dailyState.isLockedToday).toBe(true);
      });

      await act(async () => {
        await result.current.devUnlockNext(false);
      });

      expect(fetchMock).toHaveBeenCalledWith(
        `${API_URL}/translation/dev-unlock?localDate=${today}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${testToken}`,
          },
          body: JSON.stringify({ resetAll: false }),
        }
      );

      expect(result.current.dailyState.isLockedToday).toBe(false);
      expect(result.current.lastAttemptResult).toBeNull();
    });
  });

  describe("Edge cases and helper utilities", () => {
    it("returns null on submitTranslation when all prompts are completed", async () => {
      mockIsAuthenticated = false;

      // Seed all 4 completed prompts
      const allDoneProgress: TranslationProgress = {
        currentDifficulty: 4,
        completedPromptIds: MVP_TRANSLATION_PROMPTS.map((p) => p.id),
        lastCompletedDate: today,
        totalCompleted: 4,
      };
      localStorage.setItem(
        GUEST_TRANSLATION_STORAGE_KEY,
        JSON.stringify(allDoneProgress)
      );

      const { result } = renderHook(() => usePractice(), {
        wrapper: PracticeProvider,
      });

      await waitFor(() => {
        expect(result.current.dailyState.allCompleted).toBe(true);
      });

      let res: SubmitTranslationResponse | null = null;
      await act(async () => {
        res = await result.current.submitTranslation("Any text");
      });

      expect(res).toBeNull();
    });

    it("clearLastResult resets lastAttemptResult to null", async () => {
      mockIsAuthenticated = false;

      const { result } = renderHook(() => usePractice(), {
        wrapper: PracticeProvider,
      });

      await act(async () => {
        await result.current.submitTranslation("wrong answer");
      });
      expect(result.current.lastAttemptResult).not.toBeNull();

      act(() => {
        result.current.clearLastResult();
      });
      expect(result.current.lastAttemptResult).toBeNull();
    });
  });
});
