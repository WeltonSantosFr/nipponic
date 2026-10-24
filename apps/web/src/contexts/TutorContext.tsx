"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import type {
  CurriculumLevel,
  CurriculumTopic,
  Lesson,
} from "@nipponic/shared";
import {
  getCurriculumAction,
  getLessonAction,
  submitLessonProgressAction,
  submitLessonFeedbackAction,
  generateNextUnitAction,
} from "@/actions/tutor";
import { API_URL } from "@/lib/api-config";
import { useAuth } from "./AuthContext";
import { useFlashCards } from "./FlashCardsContext";

export interface TutorContextData {
  curriculum: CurriculumTopic[];
  selectedLevel: CurriculumLevel;
  setSelectedLevel: (level: CurriculumLevel) => void;
  selectedTopicId: string | null;
  setSelectedTopicId: (topicId: string | null) => void;
  currentLesson: Lesson | null;
  isLoadingCurriculum: boolean;
  isLoadingLesson: boolean;
  isGeneratingUnit: boolean;
  error: string | null;
  clearError: () => void;
  loadLesson: (topicId: string) => Promise<Lesson | null>;
  generateNextUnit: (level?: CurriculumLevel) => Promise<boolean>;
  submitProgress: (score: number) => Promise<boolean>;
  submitFeedback: (
    rating: "helpful" | "confusing",
    comment?: string
  ) => Promise<boolean>;
  addVocabularyToDeck: (targetDeckId?: string) => Promise<{ createdCount: number }>;
  closeLesson: () => void;
}

const TutorContext = createContext<TutorContextData>({} as TutorContextData);

const LOCAL_STORAGE_KEY = "nipponic.tutor_progress";
const CURRICULUM_CACHE_KEY = "nipponic.tutor_curriculum_cache";

interface LocalProgress {
  [lessonId: string]: {
    completedAt: string;
    score: number;
  };
}

interface LocalCurriculumCache {
  [level: string]: CurriculumTopic[];
}

const getStoredProgress = (): LocalProgress => {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const persistProgress = (lessonId: string, score: number) => {
  if (typeof window === "undefined") return;
  try {
    const current = getStoredProgress();
    current[lessonId] = {
      completedAt: new Date().toISOString(),
      score,
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(current));
  } catch {
    // Ignore storage write errors
  }
};

const getStoredCurriculum = (level: CurriculumLevel): CurriculumTopic[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CURRICULUM_CACHE_KEY);
    if (!raw) return [];
    const parsed: LocalCurriculumCache = JSON.parse(raw);
    return Array.isArray(parsed[level]) ? parsed[level] : [];
  } catch {
    return [];
  }
};

const persistCurriculum = (level: CurriculumLevel, topics: CurriculumTopic[]) => {
  if (typeof window === "undefined" || !topics || topics.length === 0) return;
  try {
    const raw = localStorage.getItem(CURRICULUM_CACHE_KEY);
    const current: LocalCurriculumCache = raw ? JSON.parse(raw) : {};
    current[level] = topics;
    localStorage.setItem(CURRICULUM_CACHE_KEY, JSON.stringify(current));
  } catch {
    // Ignore storage write errors
  }
};

const getClientAuthHeaders = (): Record<string, string> => {
  if (typeof window === "undefined") return {};
  try {
    const token = localStorage.getItem("nipponic.token");
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
  } catch {
    // Ignore storage read errors
  }
  return {};
};

export function TutorProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const { decks, createDeck, createCard, addCardsToDeck } = useFlashCards();

  const [selectedLevel, setSelectedLevelState] = useState<CurriculumLevel>("N5");
  const [curriculumCache, setCurriculumCache] = useState<
    Record<CurriculumLevel, CurriculumTopic[]>
  >({
    N5: [],
    N4: [],
    N3: [],
    N2: [],
    N1: [],
  });
  const [curriculum, setCurriculum] = useState<CurriculumTopic[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [isLoadingCurriculum, setIsLoadingCurriculum] = useState<boolean>(false);
  const [isLoadingLesson, setIsLoadingLesson] = useState<boolean>(false);
  const [isGeneratingUnit, setIsGeneratingUnit] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Fetch curriculum for selected level with offline fallback and optional silent background revalidation
  const loadCurriculum = useCallback(
    async (level: CurriculumLevel, isSilent: boolean = false) => {
      if (!isSilent) {
        setIsLoadingCurriculum(true);
      }
      setError(null);
      try {
        let data: CurriculumTopic[] = [];
        try {
          data = await getCurriculumAction(level);
        } catch (fetchErr) {
          console.warn("Failed to fetch curriculum action, trying direct API:", fetchErr);
        }

        // Direct API fallback if server action failed or returned empty
        if ((!data || data.length === 0) && (typeof navigator === "undefined" || navigator.onLine)) {
          try {
            const authHeaders = getClientAuthHeaders();
            const res = await fetch(`${API_URL}/tutor/curriculum?level=${level}`, {
              method: "GET",
              headers: authHeaders,
            });
            if (res.ok) {
              data = await res.json();
            }
          } catch (directErr) {
            console.warn("Direct API getCurriculum fallback failed:", directErr);
          }
        }

        const localProgress = getStoredProgress();

        if (data && data.length > 0) {
          // Merge server progress with local storage for guests
          const merged = data.map((topic) => {
            if (topic.isCompleted) return topic;
            const local = localProgress[topic.id];
            if (local) {
              return {
                ...topic,
                isCompleted: true,
                completedScore: local.score,
              };
            }
            return topic;
          });

          persistCurriculum(level, merged);

          setCurriculumCache((prev) => ({
            ...prev,
            [level]: merged,
          }));

          setCurriculum(merged);
        } else {
          // Fallback to locally stored curriculum
          const stored = getStoredCurriculum(level);
          if (stored && stored.length > 0) {
            const merged = stored.map((topic) => {
              if (topic.isCompleted) return topic;
              const local = localProgress[topic.id];
              if (local) {
                return {
                  ...topic,
                  isCompleted: true,
                  completedScore: local.score,
                };
              }
              return topic;
            });

            setCurriculumCache((prev) => ({
              ...prev,
              [level]: merged,
            }));
            setCurriculum(merged);
          } else {
            // No local cache yet and server returned empty: provide initial foundational seed
            const fallbackSeed: CurriculumTopic[] = [
              {
                id: `seed-${level}-1-1`,
                level,
                unitIndex: 1,
                unitTitle: "Foundations & Essentials",
                lessonIndex: 1,
                title: level === "N1" ? "Classical Nuance (ざるを得ない)" : "Core Grammar Foundations",
                grammarKey: level === "N1" ? "zaru-o-enai" : "copula-desu",
                objective: "Learn foundational grammar concepts and core sentence patterns.",
                hasLesson: false,
                isCompleted: false,
              },
            ];
            setCurriculum(fallbackSeed);
          }
        }
      } catch (err) {
        console.error("Failed to load curriculum:", err);
        const stored = getStoredCurriculum(level);
        if (stored.length > 0) {
          setCurriculum(stored);
        } else {
          setError("Failed to load curriculum topics. Please check your network and try again.");
        }
      } finally {
        if (!isSilent) {
          setIsLoadingCurriculum(false);
        }
      }
    },
    []
  );

  // Instant level switching from in-memory cache or local storage
  const setSelectedLevel = useCallback(
    (level: CurriculumLevel) => {
      setSelectedLevelState(level);
      setSelectedTopicId(null);
      setCurrentLesson(null);
      setError(null);

      const cached = curriculumCache[level];
      if (cached && cached.length > 0) {
        setCurriculum(cached);
        // Silent background sync
        loadCurriculum(level, true);
      } else {
        const stored = getStoredCurriculum(level);
        if (stored && stored.length > 0) {
          setCurriculum(stored);
          loadCurriculum(level, true);
        } else {
          setCurriculum([]);
          setIsLoadingCurriculum(true);
          loadCurriculum(level, false);
        }
      }
    },
    [curriculumCache, loadCurriculum]
  );

  // Generate next unit with AI for current or specified level
  const generateNextUnit = useCallback(
    async (level?: CurriculumLevel): Promise<boolean> => {
      const targetLevel = level || selectedLevel;

      if (typeof navigator !== "undefined" && !navigator.onLine) {
        setError("You are currently offline. Connect to the internet to generate new units with AI.");
        return false;
      }

      setIsGeneratingUnit(true);
      setError(null);
      try {
        let updated: CurriculumTopic[] = [];
        try {
          updated = await generateNextUnitAction(targetLevel);
        } catch (serverActionErr) {
          console.warn("Server action generateNextUnit failed, attempting direct API fallback:", serverActionErr);
        }

        if (!updated || updated.length === 0) {
          try {
            const authHeaders = getClientAuthHeaders();
            const res = await fetch(`${API_URL}/tutor/curriculum/generate`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...authHeaders,
              },
              body: JSON.stringify({ level: targetLevel }),
            });
            if (res.ok) {
              updated = await res.json();
            }
          } catch (directApiErr) {
            console.warn("Direct API generateNextUnit fallback failed:", directApiErr);
          }
        }

        if (updated && updated.length > 0) {
          const localProgress = getStoredProgress();
          const merged = updated.map((topic) => {
            if (topic.isCompleted) return topic;
            const local = localProgress[topic.id];
            if (local) {
              return {
                ...topic,
                isCompleted: true,
                completedScore: local.score,
              };
            }
            return topic;
          });

          persistCurriculum(targetLevel, merged);

          setCurriculumCache((prev) => ({
            ...prev,
            [targetLevel]: merged,
          }));

          if (targetLevel === selectedLevel) {
            setCurriculum(merged);
          }
          return true;
        }
        return false;
      } catch (err) {
        console.error("Failed to generate next unit:", err);
        setError("Failed to generate next unit with AI. Please try again.");
        return false;
      } finally {
        setIsGeneratingUnit(false);
      }
    },
    [selectedLevel]
  );

  // Initial load
  useEffect(() => {
    loadCurriculum(selectedLevel, false);
  }, [loadCurriculum, isAuthenticated, selectedLevel]);

  const loadLesson = useCallback(
    async (topicId: string): Promise<Lesson | null> => {
      setSelectedTopicId(topicId);
      setIsLoadingLesson(true);
      setError(null);

      try {
        let lesson: Lesson | null = null;
        let serverActionFailedWithException = false;
        try {
          lesson = await getLessonAction(topicId);
        } catch (serverActionErr) {
          serverActionFailedWithException = true;
          console.warn(`Server action getLesson failed for ${topicId}, attempting direct API fallback:`, serverActionErr);
        }

        if (!lesson && (typeof navigator === "undefined" || navigator.onLine)) {
          try {
            const authHeaders = getClientAuthHeaders();
            const res = await fetch(`${API_URL}/tutor/topics/${topicId}/lesson`, {
              method: "GET",
              headers: authHeaders,
            });
            if (res.ok) {
              lesson = await res.json();
            }
          } catch (directApiErr) {
            console.warn(`Direct API getLesson fallback failed for ${topicId}:`, directApiErr);
          }
        }

        if (!lesson) {
          if (serverActionFailedWithException) {
            setError("Failed to generate or load lesson. Please try again.");
          } else {
            setError("Failed to generate or load this lesson. Please check your network and try again.");
          }
          setCurrentLesson(null);
          return null;
        }
        setCurrentLesson(lesson);
        return lesson;
      } catch (err) {
        console.error(`Failed to load lesson for topic ${topicId}:`, err);
        setError("Failed to generate or load lesson. Please try again.");
        setCurrentLesson(null);
        return null;
      } finally {
        setIsLoadingLesson(false);
      }
    },
    []
  );

  const submitProgress = useCallback(
    async (score: number): Promise<boolean> => {
      if (!currentLesson) return false;

      // 1. Save locally for guest resilience
      persistProgress(currentLesson.id, score);

      // 2. If authenticated, sync with backend
      if (isAuthenticated) {
        try {
          await submitLessonProgressAction(currentLesson.id, { score });
        } catch {
          try {
            const authHeaders = getClientAuthHeaders();
            await fetch(`${API_URL}/tutor/lessons/${currentLesson.id}/progress`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...authHeaders,
              },
              body: JSON.stringify({ score }),
            });
          } catch {
            // Ignore background sync errors
          }
        }
      }

      // 3. Update currentLesson state
      setCurrentLesson((prev) =>
        prev
          ? {
              ...prev,
              isCompleted: true,
              score: Math.max(prev.score ?? 0, score),
            }
          : null
      );

      // 4. Update curriculum list
      setCurriculum((prev) =>
        prev.map((t) =>
          t.id === currentLesson.topicId
            ? { ...t, isCompleted: true, completedScore: Math.max(t.completedScore ?? 0, score) }
            : t
        )
      );

      return true;
    },
    [currentLesson, isAuthenticated]
  );

  const submitFeedback = useCallback(
    async (
      rating: "helpful" | "confusing",
      comment?: string
    ): Promise<boolean> => {
      if (!currentLesson) return false;
      let res = { success: false };
      try {
        res = await submitLessonFeedbackAction(currentLesson.id, {
          rating,
          comment,
        });
      } catch {
        // Fallback to direct API
      }

      if (!res.success) {
        try {
          const authHeaders = getClientAuthHeaders();
          const apiRes = await fetch(
            `${API_URL}/tutor/lessons/${currentLesson.id}/feedback`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...authHeaders,
              },
              body: JSON.stringify({ rating, comment }),
            }
          );
          if (apiRes.ok) {
            const data = await apiRes.json();
            return !!data.success;
          }
        } catch {
          return false;
        }
      }
      return res.success;
    },
    [currentLesson]
  );

  const addVocabularyToDeck = useCallback(
    async (targetDeckId?: string): Promise<{ createdCount: number }> => {
      if (!currentLesson || !currentLesson.vocabulary.length) {
        return { createdCount: 0 };
      }

      const defaultDeckName = `Tutor: JLPT ${selectedLevel}`;
      let deckId = targetDeckId;

      if (!deckId) {
        const existingDeck = decks.find((d) => d.name === defaultDeckName);
        if (existingDeck) {
          deckId = existingDeck.id;
        } else {
          const newDeck = await createDeck(defaultDeckName);
          deckId = newDeck?.id;
        }
      }

      if (!deckId) return { createdCount: 0 };

      const createdCardIds: string[] = [];

      for (const item of currentLesson.vocabulary) {
        const enDefinition = item.reading && item.reading !== item.jpText
          ? `[${item.reading}] ${item.enText}`
          : item.enText;

        const card = await createCard({
          jpText: item.jpText,
          enText: enDefinition,
        });

        if (card) {
          createdCardIds.push(card.id);
        }
      }

      if (createdCardIds.length > 0) {
        await addCardsToDeck(deckId, createdCardIds);
      }

      return { createdCount: createdCardIds.length };
    },
    [currentLesson, selectedLevel, decks, createDeck, createCard, addCardsToDeck]
  );

  const closeLesson = useCallback(() => {
    setSelectedTopicId(null);
    setCurrentLesson(null);
  }, []);

  const contextValue = useMemo(
    () => ({
      curriculum,
      selectedLevel,
      setSelectedLevel,
      selectedTopicId,
      setSelectedTopicId,
      currentLesson,
      isLoadingCurriculum,
      isLoadingLesson,
      isGeneratingUnit,
      error,
      clearError,
      loadLesson,
      closeLesson,
      generateNextUnit,
      submitProgress,
      submitFeedback,
      addVocabularyToDeck,
    }),
    [
      curriculum,
      selectedLevel,
      setSelectedLevel,
      selectedTopicId,
      currentLesson,
      isLoadingCurriculum,
      isLoadingLesson,
      isGeneratingUnit,
      error,
      clearError,
      loadLesson,
      closeLesson,
      generateNextUnit,
      submitProgress,
      submitFeedback,
      addVocabularyToDeck,
    ]
  );

  return (
    <TutorContext.Provider value={contextValue}>
      {children}
    </TutorContext.Provider>
  );
}

export function useTutor() {
  const context = useContext(TutorContext);
  if (!context) {
    throw new Error("useTutor must be used within a TutorProvider");
  }
  return context;
}
