"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
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
} from "@/actions/tutor";
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
  error: string | null;
  loadLesson: (topicId: string) => Promise<Lesson | null>;
  submitProgress: (score: number) => Promise<boolean>;
  submitFeedback: (
    rating: "helpful" | "confusing",
    comment?: string
  ) => Promise<boolean>;
  addVocabularyToDeck: (targetDeckId?: string) => Promise<{ createdCount: number }>;
}

const TutorContext = createContext<TutorContextData>({} as TutorContextData);

const LOCAL_STORAGE_KEY = "nipponic.tutor_progress";

interface LocalProgress {
  [lessonId: string]: {
    completedAt: string;
    score: number;
  };
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

export function TutorProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const { decks, createDeck, createCard, addCardsToDeck } = useFlashCards();

  const [selectedLevel, setSelectedLevel] = useState<CurriculumLevel>("N5");
  const [curriculum, setCurriculum] = useState<CurriculumTopic[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [isLoadingCurriculum, setIsLoadingCurriculum] = useState<boolean>(false);
  const [isLoadingLesson, setIsLoadingLesson] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch curriculum for selected level
  const loadCurriculum = useCallback(async (level: CurriculumLevel) => {
    setIsLoadingCurriculum(true);
    setError(null);
    try {
      const data = await getCurriculumAction(level);
      const localProgress = getStoredProgress();

      // Merge server progress with local storage for guests
      const merged = data.map((topic) => {
        if (topic.isCompleted) return topic;
        // Check if cached locally
        return topic;
      });

      setCurriculum(merged);
    } catch (err) {
      console.error("Failed to load curriculum:", err);
      setError("Failed to load curriculum topics. Please try again.");
    } finally {
      setIsLoadingCurriculum(false);
    }
  }, []);

  useEffect(() => {
    loadCurriculum(selectedLevel);
  }, [selectedLevel, loadCurriculum, isAuthenticated]);

  const loadLesson = useCallback(
    async (topicId: string): Promise<Lesson | null> => {
      setSelectedTopicId(topicId);
      setIsLoadingLesson(true);
      setError(null);

      try {
        const lesson = await getLessonAction(topicId);
        setCurrentLesson(lesson);
        return lesson;
      } catch (err) {
        console.error(`Failed to load lesson for topic ${topicId}:`, err);
        setError("Failed to generate or load lesson. Please try again.");
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
        await submitLessonProgressAction(currentLesson.id, { score });
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
      const res = await submitLessonFeedbackAction(currentLesson.id, {
        rating,
        comment,
      });
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

  return (
    <TutorContext.Provider
      value={{
        curriculum,
        selectedLevel,
        setSelectedLevel,
        selectedTopicId,
        setSelectedTopicId,
        currentLesson,
        isLoadingCurriculum,
        isLoadingLesson,
        error,
        loadLesson,
        submitProgress,
        submitFeedback,
        addVocabularyToDeck,
      }}
    >
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
