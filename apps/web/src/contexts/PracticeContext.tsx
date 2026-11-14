"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import {
  MVP_TRANSLATION_PROMPTS,
  buildTranslationDailyState,
  evaluateTranslationAttempt,
  getTodayLocalDate,
  TranslationProgressSchema,
  type TranslationDailyState,
  type TranslationProgress,
  type SubmitTranslationResponse,
} from "@nipponic/shared";
import { API_URL } from "@/lib/api-config";
import { useAuth } from "./AuthContext";

export const GUEST_TRANSLATION_STORAGE_KEY = "nipponic.translation_progress.guest";
export const AUTH_TRANSLATION_STORAGE_KEY = "nipponic.translation_progress.auth";
export const TOKEN_STORAGE_KEY = "nipponic.token";

export interface PracticeContextData {
  dailyState: TranslationDailyState;
  isLoading: boolean;
  isSubmitting: boolean;
  lastAttemptResult: SubmitTranslationResponse | null;
  error: string | null;
  clearError: () => void;
  clearLastResult: () => void;
  refreshState: () => Promise<void>;
  submitTranslation: (answer: string) => Promise<SubmitTranslationResponse | null>;
  devUnlockNext: (resetAll?: boolean) => Promise<void>;
}

const DEFAULT_TRANSLATION_PROGRESS: TranslationProgress = {
  currentDifficulty: 1,
  completedPromptIds: [],
  lastCompletedDate: null,
  totalCompleted: 0,
};

const getStoredToken = (): string | null => {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
};

const getStoredProgress = (key: string): TranslationProgress => {
  if (typeof window === "undefined") return DEFAULT_TRANSLATION_PROGRESS;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return DEFAULT_TRANSLATION_PROGRESS;
    const parsed = JSON.parse(raw);
    const result = TranslationProgressSchema.safeParse(parsed);
    if (result.success) {
      return result.data;
    }
    return DEFAULT_TRANSLATION_PROGRESS;
  } catch {
    return DEFAULT_TRANSLATION_PROGRESS;
  }
};

const saveStoredProgress = (key: string, progress: TranslationProgress): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(progress));
  } catch {
    // Ignore storage write errors
  }
};

const PracticeContext = createContext<PracticeContextData | null>(null);

export function PracticeProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();

  const [dailyState, setDailyState] = useState<TranslationDailyState>(() =>
    buildTranslationDailyState(DEFAULT_TRANSLATION_PROGRESS, getTodayLocalDate())
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [lastAttemptResult, setLastAttemptResult] =
    useState<SubmitTranslationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearLastResult = useCallback(() => {
    setLastAttemptResult(null);
  }, []);

  const refreshState = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const today = getTodayLocalDate();
      const token = getStoredToken();

      if (isAuthenticated && token) {
        try {
          const res = await fetch(
            `${API_URL}/translation/daily?localDate=${today}`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (res.ok) {
            const data: TranslationDailyState = await res.json();
            setDailyState(data);
            saveStoredProgress(AUTH_TRANSLATION_STORAGE_KEY, data.progress);
            return;
          }
        } catch {
          // Network offline / fetch failed -> fall through to cached state
        }
      }

      // Offline / fetch error / unauthenticated guest
      const storageKey = isAuthenticated
        ? AUTH_TRANSLATION_STORAGE_KEY
        : GUEST_TRANSLATION_STORAGE_KEY;
      const cachedProgress = getStoredProgress(storageKey);
      const derivedState = buildTranslationDailyState(cachedProgress, today);
      setDailyState(derivedState);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void refreshState();
  }, [refreshState]);

  const submitTranslation = useCallback(
    async (answer: string): Promise<SubmitTranslationResponse | null> => {
      if (!dailyState.prompt || dailyState.allCompleted) {
        return null;
      }

      if (dailyState.isLockedToday) {
        const lockedResult: SubmitTranslationResponse = {
          isCorrect: false,
          alreadyLockedToday: true,
          canonicalAnswer: dailyState.prompt.canonicalAnswer,
          ...(dailyState.prompt.answerReading
            ? { answerReading: dailyState.prompt.answerReading }
            : {}),
          explanation:
            "Daily challenge already completed for today. Come back tomorrow!",
          state: dailyState,
        };
        setLastAttemptResult(lockedResult);
        return lockedResult;
      }

      setIsSubmitting(true);
      setError(null);

      try {
        const today = getTodayLocalDate();
        const token = getStoredToken();

        const evaluateAndPersistLocally = (
          storageKey: string
        ): SubmitTranslationResponse => {
          const prompt = dailyState.prompt!;
          const evalResult = evaluateTranslationAttempt(prompt, answer);

          if (evalResult.isCorrect) {
            const currentCompleted = dailyState.progress.completedPromptIds;
            const completedPromptIds = currentCompleted.includes(prompt.id)
              ? currentCompleted
              : [...currentCompleted, prompt.id];
            const totalCompleted = completedPromptIds.length;
            const currentDifficulty = Math.min(
              MVP_TRANSLATION_PROMPTS.length,
              totalCompleted + 1
            );

            const updatedProgress: TranslationProgress = {
              completedPromptIds,
              totalCompleted,
              currentDifficulty,
              lastCompletedDate: today,
            };

            const newState = buildTranslationDailyState(updatedProgress, today);
            saveStoredProgress(storageKey, updatedProgress);
            setDailyState(newState);

            const result: SubmitTranslationResponse = {
              isCorrect: true,
              canonicalAnswer: prompt.canonicalAnswer,
              ...(prompt.answerReading
                ? { answerReading: prompt.answerReading }
                : {}),
              explanation: prompt.explanation,
              state: newState,
            };
            setLastAttemptResult(result);
            return result;
          }

          const result: SubmitTranslationResponse = {
            isCorrect: false,
            canonicalAnswer: prompt.canonicalAnswer,
            ...(prompt.answerReading
              ? { answerReading: prompt.answerReading }
              : {}),
            explanation: prompt.explanation,
            state: dailyState,
          };
          setLastAttemptResult(result);
          return result;
        };

        if (isAuthenticated && token) {
          try {
            const res = await fetch(`${API_URL}/translation/submit`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                promptId: dailyState.prompt.id,
                answer,
                localDate: today,
              }),
            });

            if (res.ok) {
              const data: SubmitTranslationResponse = await res.json();
              setDailyState(data.state);
              saveStoredProgress(
                AUTH_TRANSLATION_STORAGE_KEY,
                data.state.progress
              );
              setLastAttemptResult(data);
              return data;
            }

            let errorMessage = "Failed to submit translation";
            try {
              const errJson = await res.json();
              if (errJson && typeof errJson.message === "string") {
                errorMessage = errJson.message;
              }
            } catch {
              // Ignore JSON parse error
            }
            setError(errorMessage);
            return null;
          } catch {
            // fetch threw (offline / network error) -> fallback to local evaluation
            return evaluateAndPersistLocally(AUTH_TRANSLATION_STORAGE_KEY);
          }
        }

        // Guest flow (!isAuthenticated or no token)
        return evaluateAndPersistLocally(GUEST_TRANSLATION_STORAGE_KEY);
      } finally {
        setIsSubmitting(false);
      }
    },
    [dailyState, isAuthenticated]
  );

  const devUnlockNext = useCallback(
    async (resetAll: boolean = false): Promise<void> => {
      const today = getTodayLocalDate();
      const token = getStoredToken();
      const isDev = process.env.NODE_ENV !== "production";

      if (isAuthenticated && token && isDev) {
        try {
          const res = await fetch(
            `${API_URL}/translation/dev-unlock?localDate=${today}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ resetAll }),
            }
          );

          if (res.ok) {
            const data = await res.json();
            const nextState: TranslationDailyState =
              data && data.state ? data.state : data;
            setDailyState(nextState);
            saveStoredProgress(
              AUTH_TRANSLATION_STORAGE_KEY,
              nextState.progress
            );
            setLastAttemptResult(null);
            return;
          }
        } catch {
          // Fall through to local unlock on fetch failure
        }
      }

      const storageKey = isAuthenticated
        ? AUTH_TRANSLATION_STORAGE_KEY
        : GUEST_TRANSLATION_STORAGE_KEY;

      const baseProgress = dailyState.progress || getStoredProgress(storageKey);

      const updatedProgress: TranslationProgress = resetAll
        ? { ...DEFAULT_TRANSLATION_PROGRESS }
        : {
            ...baseProgress,
            lastCompletedDate: null,
          };

      const newState = buildTranslationDailyState(updatedProgress, today);
      saveStoredProgress(storageKey, updatedProgress);
      setDailyState(newState);
      setLastAttemptResult(null);
    },
    [dailyState, isAuthenticated]
  );

  const value = useMemo<PracticeContextData>(
    () => ({
      dailyState,
      isLoading,
      isSubmitting,
      lastAttemptResult,
      error,
      clearError,
      clearLastResult,
      refreshState,
      submitTranslation,
      devUnlockNext,
    }),
    [
      dailyState,
      isLoading,
      isSubmitting,
      lastAttemptResult,
      error,
      clearError,
      clearLastResult,
      refreshState,
      submitTranslation,
      devUnlockNext,
    ]
  );

  return (
    <PracticeContext.Provider value={value}>
      {children}
    </PracticeContext.Provider>
  );
}

export function usePractice(): PracticeContextData {
  const context = useContext(PracticeContext);
  if (!context) {
    throw new Error("usePractice must be used within a PracticeProvider");
  }
  return context;
}

export function useOptionalPractice(): PracticeContextData | null {
  return useContext(PracticeContext);
}

export { PracticeContext };

