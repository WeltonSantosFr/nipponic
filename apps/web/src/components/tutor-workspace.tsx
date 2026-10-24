"use client";

import { useState, useMemo } from "react";
import { useTutor } from "@/contexts/TutorContext";
import { TokenizedText } from "@/components/tokenized-text";
import { MarkdownContent } from "@/components/markdown-content";
import { InteractiveExercise } from "@/components/interactive-exercise";
import { useSpeech } from "@/hooks/use-speech";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  MessageSquare,
  CheckSquare,
  Layers,
  Volume2,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  ArrowRight,
  Play,
  Loader2,
  Award,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";

type LessonStep = "theory" | "dialogue" | "exercises" | "vocabulary";

export function TutorWorkspace() {
  const {
    curriculum,
    selectedLevel,
    currentLesson,
    isLoadingCurriculum,
    isLoadingLesson,
    isGeneratingUnit,
    generateNextUnit,
    loadLesson,
    closeLesson,
    submitProgress,
    submitFeedback,
    addVocabularyToDeck,
    error,
    clearError,
  } = useTutor();

  const { speak, stop, isPlaying, isLoading } = useSpeech();

  const [activeStep, setActiveStep] = useState<LessonStep>("theory");
  const [exerciseAnswers, setExerciseAnswers] = useState<Record<number, boolean>>({});
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<boolean>(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState<boolean>(false);
  const [isAddingCards, setIsAddingCards] = useState<boolean>(false);
  const [cardsAddedCount, setCardsAddedCount] = useState<number | null>(null);
  const [activeAudioId, setActiveAudioId] = useState<string | null>(null);
  const [isFinishing, setIsFinishing] = useState<boolean>(false);
  const [showFurigana, setShowFurigana] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("nipponic_tutor_furigana");
        return saved !== null ? saved === "true" : true;
      } catch {
        return true;
      }
    }
    return true;
  });

  const handleToggleFurigana = () => {
    setShowFurigana((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("nipponic_tutor_furigana", String(next));
        } catch {
          // Ignore storage errors
        }
      }
      return next;
    });
  };

  // Group curriculum topics by unit
  const units = useMemo(() => {
    const map = new Map<number, { title: string; topics: typeof curriculum }>();
    curriculum.forEach((topic) => {
      if (!map.has(topic.unitIndex)) {
        map.set(topic.unitIndex, { title: topic.unitTitle, topics: [] });
      }
      map.get(topic.unitIndex)!.topics.push(topic);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a - b);
  }, [curriculum]);

  // Next recommended topic for daily study
  const nextRecommendedTopic = useMemo(() => {
    return curriculum.find((t) => !t.isCompleted) || curriculum[0];
  }, [curriculum]);

  const completedCount = useMemo(() => {
    return curriculum.filter((t) => t.isCompleted).length;
  }, [curriculum]);

  const completionPercent = curriculum.length
    ? Math.round((completedCount / curriculum.length) * 100)
    : 0;

  // Handle exercise completion
  const handleExerciseAnswer = (order: number, isCorrect: boolean) => {
    const updated = { ...exerciseAnswers, [order]: isCorrect };
    setExerciseAnswers(updated);

    // Check if all exercises are now answered
    if (
      currentLesson &&
      Object.keys(updated).length === currentLesson.exercises.length
    ) {
      const correctCount = Object.values(updated).filter(Boolean).length;
      const score = Math.round(
        (correctCount / currentLesson.exercises.length) * 100
      );
      submitProgress(score);
    }
  };

  const handleStartLesson = async (topicId: string) => {
    setActiveStep("theory");
    setExerciseAnswers({});
    setFeedbackSubmitted(false);
    setCardsAddedCount(null);
    await loadLesson(topicId);
  };

  const handleAddAllToFlashcards = async () => {
    setIsAddingCards(true);
    try {
      const res = await addVocabularyToDeck();
      setCardsAddedCount(res.createdCount);
    } finally {
      setIsAddingCards(false);
    }
  };

  const handlePlayAudio = async (id: string, text: string) => {
    if (activeAudioId === id) {
      stop();
      setActiveAudioId(null);
      return;
    }

    setActiveAudioId(id);
    try {
      await speak(text, "ja-JP", 1.0, () => {
        setActiveAudioId((current) => (current === id ? null : current));
      });
    } finally {
      setActiveAudioId((current) => (current === id ? null : current));
    }
  };

  const handleFinishLesson = async () => {
    setIsFinishing(true);
    try {
      if (currentLesson) {
        const exerciseCount = currentLesson.exercises?.length || 0;
        const answeredCount = Object.keys(exerciseAnswers).length;
        if (exerciseCount > 0 && answeredCount > 0) {
          const correctCount = Object.values(exerciseAnswers).filter(Boolean).length;
          const score = Math.round((correctCount / exerciseCount) * 100);
          await submitProgress(score);
        } else {
          await submitProgress(100);
        }
      }
    } catch (err) {
      console.error("Failed to submit progress on finish:", err);
    } finally {
      setIsFinishing(false);
      closeLesson();
    }
  };

  const handleFeedback = async (rating: "helpful" | "confusing") => {
    if (feedbackSubmitted || isSubmittingFeedback) return;
    setIsSubmittingFeedback(true);
    try {
      await submitFeedback(rating);
      setFeedbackSubmitted(true);
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  // If loading curriculum on first load with no cached items
  if (isLoadingCurriculum && curriculum.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 space-y-3 sm:space-y-4 w-full min-w-0 max-w-full text-center">
        <Loader2 className="h-7 w-7 sm:h-8 sm:w-8 animate-spin text-primary" />
        <p className="text-xs sm:text-sm font-medium text-muted-foreground break-words">
          Loading JLPT {selectedLevel} curriculum...
        </p>
      </div>
    );
  }

  // If a lesson is actively loading (JIT generation by Gemini)
  if (isLoadingLesson) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 space-y-3 sm:space-y-4 w-full min-w-0 max-w-full text-center">
        <div className="p-3 sm:p-4 rounded-2xl bg-primary/10 text-primary animate-pulse">
          <Sparkles size={32} />
        </div>
        <div className="text-center space-y-1.5 max-w-sm px-2">
          <h3 className="text-base sm:text-lg font-bold break-words">
            The AI Tutor is preparing your lesson...
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground break-words">
            Generating theory, natural dialogue, audio transcriptions, and interactive exercises.
          </p>
        </div>
        <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-primary mt-1" />
      </div>
    );
  }


  // Dashboard / Roadmap View when no lesson is active
  if (!currentLesson) {
    return (
      <div className="flex-1 overflow-y-auto p-3 sm:p-6 md:p-8 space-y-4 sm:space-y-6 md:space-y-8 max-w-5xl mx-auto w-full min-w-0 max-w-full overflow-x-hidden pb-safe">
        {/* Error Notification Banner */}
        {error && (
          <div className="flex items-center justify-between gap-2.5 sm:gap-3 p-3 sm:p-3.5 rounded-xl border border-destructive/40 bg-destructive/10 text-destructive text-xs sm:text-sm shadow-xs animate-in fade-in min-w-0 w-full max-w-full">
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
              <span className="font-medium break-words">{error}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-destructive hover:bg-destructive/20 hover:text-destructive cursor-pointer shrink-0"
              onClick={() => clearError()}
            >
              Dismiss
            </Button>
          </div>
        )}

        {/* Banner Section */}
        <div className="rounded-xl sm:rounded-2xl border border-border/80 bg-linear-to-r from-primary/10 via-primary/5 to-transparent p-3 sm:p-5 md:p-8 shadow-xs min-w-0 w-full max-w-full overflow-hidden">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 sm:gap-6 w-full min-w-0">
            <div className="space-y-1.5 sm:space-y-2 min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                  JLPT {selectedLevel}
                </span>
                <span className="text-[11px] sm:text-xs font-medium text-muted-foreground">
                  Structured Learning Path
                </span>
              </div>
              <h1 className="text-lg sm:text-2xl md:text-3xl font-extrabold tracking-tight text-foreground break-words">
                Daily AI Tutor
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-md break-words">
                Master Japanese grammar, dialogue nuances, and vocabulary step-by-step with structured micro-lessons.
              </p>
            </div>

            {/* Quick Continue Card */}
            {nextRecommendedTopic && (
              <div className="w-full sm:w-auto p-3 sm:p-4 rounded-xl border border-border/90 bg-card/90 shadow-xs space-y-2 sm:space-y-2.5 sm:min-w-[240px] min-w-0 max-w-full overflow-hidden">
                <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground gap-2">
                  <span className="truncate">Recommended Today</span>
                  <span className="shrink-0">Lesson {nextRecommendedTopic.lessonIndex}</span>
                </div>
                <div className="font-bold text-xs sm:text-sm text-foreground truncate min-w-0">
                  {nextRecommendedTopic.title}
                </div>
                <Button
                  onClick={() => handleStartLesson(nextRecommendedTopic.id)}
                  className="w-full gap-2 cursor-pointer shadow-xs font-semibold justify-center min-w-0 max-w-full whitespace-normal break-words h-auto min-h-9 py-2 px-3 text-xs sm:text-sm text-center"
                >
                  <Play size={14} className="shrink-0" />
                  <span className="break-words">Start Today&apos;s Lesson</span>
                </Button>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mt-3.5 sm:mt-5 pt-3.5 sm:pt-4 border-t border-border/60 space-y-1.5 sm:space-y-2 w-full min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] sm:text-xs font-medium text-muted-foreground min-w-0 w-full">
              <span>Level Progress</span>
              <span className="break-words">
                {completedCount} of {curriculum.length} lessons completed ({completionPercent}%)
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500 rounded-full"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Units Roadmap */}
        <div className="space-y-3.5 sm:space-y-5 w-full min-w-0 max-w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 w-full min-w-0">
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground truncate">
                Curriculum Roadmap
              </h2>
              <p className="text-xs text-muted-foreground break-words">
                {curriculum.length} lesson{curriculum.length === 1 ? "" : "s"} across {units.length} unit{units.length === 1 ? "" : "s"}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => generateNextUnit()}
              disabled={isGeneratingUnit}
              className="gap-1.5 cursor-pointer shadow-xs text-xs font-semibold w-full sm:w-auto justify-center min-w-0 max-w-full whitespace-normal break-words h-auto min-h-8 py-2 px-3 text-center"
            >
              {isGeneratingUnit ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />
                  <span className="break-words">Generating Unit with AI...</span>
                </>
              ) : (
                <>
                  <Sparkles size={13} className="text-primary shrink-0" />
                  <span className="break-words">+ Generate Next Unit (AI)</span>
                </>
              )}
            </Button>
          </div>

          {curriculum.length === 0 ? (
            <div className="rounded-xl sm:rounded-2xl border border-dashed border-border p-4 sm:p-6 md:p-8 text-center space-y-3 sm:space-y-4 bg-card/40 w-full min-w-0 max-w-full overflow-hidden">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center shrink-0">
                <Sparkles size={20} />
              </div>
              <div className="space-y-1.5 max-w-md mx-auto w-full min-w-0">
                <h3 className="text-sm sm:text-base font-bold text-foreground break-words">
                  No lessons generated for JLPT {selectedLevel} yet
                </h3>
                <p className="text-xs text-muted-foreground break-words">
                  The AI Tutor can generate a tailored study unit for JLPT {selectedLevel} with grammar explanations, natural dialogues, audio, and exercises.
                </p>
              </div>
              <Button
                onClick={() => generateNextUnit()}
                disabled={isGeneratingUnit}
                className="gap-2 cursor-pointer font-semibold shadow-xs w-full sm:w-auto justify-center min-w-0 max-w-full whitespace-normal break-words h-auto min-h-10 py-2.5 px-4 text-xs sm:text-sm text-center"
              >
                {isGeneratingUnit ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                    <span className="break-words">Generating JLPT {selectedLevel} Topics with AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={15} className="shrink-0" />
                    <span className="break-words">Generate JLPT {selectedLevel} Topics with AI</span>
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4 w-full min-w-0 max-w-full">
              {units.map(([unitIndex, unit]) => (
                <div
                  key={unitIndex}
                  className="rounded-xl border border-border/80 bg-card/60 p-3 sm:p-4 md:p-5 shadow-xs space-y-2.5 sm:space-y-3.5 min-w-0 max-w-full overflow-hidden"
                >
                  <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 w-full">
                    <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-muted text-muted-foreground text-xs font-bold flex items-center justify-center shrink-0">
                      {unitIndex}
                    </span>
                    <h3 className="font-bold text-xs sm:text-base text-foreground truncate min-w-0 flex-1">
                      Unit {unitIndex}: {unit.title}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 w-full min-w-0">
                    {unit.topics.map((topic) => (
                      <div
                        key={topic.id}
                        onClick={() => handleStartLesson(topic.id)}
                        className={`group p-2.5 sm:p-3.5 md:p-4 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-2 sm:gap-3 min-w-0 w-full overflow-hidden ${
                          topic.isCompleted
                            ? "border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/50"
                            : topic.id === nextRecommendedTopic?.id
                            ? "border-primary/50 bg-primary/5 hover:border-primary shadow-xs"
                            : "border-border/70 hover:border-border hover:bg-muted/40"
                        }`}
                      >
                        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1 overflow-hidden">
                          <div
                            className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                              topic.isCompleted
                                ? "bg-emerald-500 text-white"
                                : topic.id === nextRecommendedTopic?.id
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {topic.isCompleted ? (
                              <CheckCircle2 size={15} />
                            ) : (
                              topic.lessonIndex
                            )}
                          </div>
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <h4 className="text-xs sm:text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate min-w-0">
                              {topic.title}
                            </h4>
                            <p className="text-[11px] sm:text-xs text-muted-foreground truncate min-w-0">
                              {topic.objective}
                            </p>
                          </div>
                        </div>

                        <ChevronRight
                          size={15}
                          className="text-muted-foreground group-hover:text-foreground shrink-0 transition-transform group-hover:translate-x-0.5"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    );
  }

  // Active Lesson View
  return (
    <div className="flex-1 flex flex-col h-full w-full min-w-0 max-w-full overflow-hidden">
      {/* Lesson Header Navigation */}
      <div className="p-3 sm:p-4 border-b border-border/80 bg-card/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 shrink-0 min-w-0 max-w-full">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 w-full sm:w-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={closeLesson}
            className="gap-1 sm:gap-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer shrink-0 px-2 sm:px-3"
          >
            <ChevronLeft size={16} />
            Curriculum
          </Button>
          <div className="h-4 w-px bg-border/80 shrink-0" />
          <div className="min-w-0 flex-1">
            <span className="text-[10px] sm:text-[11px] font-bold text-primary uppercase tracking-wider block truncate">
              {currentLesson.level} • Lesson
            </span>
            <h2 className="text-sm sm:text-base font-bold text-foreground truncate">
              {currentLesson.title}
            </h2>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-1.5 sm:gap-2.5 w-full sm:w-auto shrink-0 min-w-0">
          {/* Furigana Toggle Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleFurigana}
            className={`h-7 sm:h-8 px-2 sm:px-2.5 text-xs gap-1 sm:gap-1.5 cursor-pointer font-medium shrink-0 ${
              showFurigana
                ? "border-primary/40 bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title={
              showFurigana
                ? "Hide Furigana readings"
                : "Show Furigana readings above Kanji"
            }
            data-testid="tutor-furigana-toggle"
          >
            {showFurigana ? <Eye size={13} /> : <EyeOff size={13} />}
            <span>Furigana</span>
          </Button>

          {/* 4 Steps Nav Selector */}
          <div className="flex p-0.5 bg-muted/70 rounded-lg border border-border/70 text-xs font-medium shrink-0">
            <button
              type="button"
              aria-label="1. Theory"
              onClick={() => setActiveStep("theory")}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                activeStep === "theory"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <BookOpen size={14} className="shrink-0" />
              <span className="hidden sm:inline">1. Theory</span>
              <span className="sm:hidden text-[11px] font-semibold" aria-hidden="true">1</span>
            </button>
            <button
              type="button"
              aria-label="2. Dialogue"
              onClick={() => setActiveStep("dialogue")}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                activeStep === "dialogue"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <MessageSquare size={14} className="shrink-0" />
              <span className="hidden sm:inline">2. Dialogue</span>
              <span className="sm:hidden text-[11px] font-semibold" aria-hidden="true">2</span>
            </button>
            <button
              type="button"
              aria-label="3. Practice"
              onClick={() => setActiveStep("exercises")}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                activeStep === "exercises"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <CheckSquare size={14} className="shrink-0" />
              <span className="hidden sm:inline">3. Practice</span>
              <span className="sm:hidden text-[11px] font-semibold" aria-hidden="true">3</span>
            </button>
            <button
              type="button"
              aria-label="4. Vocabulary"
              onClick={() => setActiveStep("vocabulary")}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                activeStep === "vocabulary"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Layers size={14} className="shrink-0" />
              <span className="hidden sm:inline">4. Vocabulary</span>
              <span className="sm:hidden text-[11px] font-semibold" aria-hidden="true">4</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error Notification Banner */}
      {error && (
        <div className="mx-3 sm:mx-4 mt-3 sm:mt-4 flex items-center justify-between gap-2.5 sm:gap-3 p-3 sm:p-3.5 rounded-xl border border-destructive/40 bg-destructive/10 text-destructive text-xs sm:text-sm shadow-xs animate-in fade-in min-w-0 max-w-full">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
            <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
            <span className="font-medium break-words">{error}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-destructive hover:bg-destructive/20 hover:text-destructive cursor-pointer shrink-0"
            onClick={() => clearError()}
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-6 md:p-8 max-w-4xl mx-auto w-full min-w-0 max-w-full overflow-x-hidden space-y-4 sm:space-y-6 pb-safe">
        {/* Step 1: Theory */}
        {activeStep === "theory" && (
          <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200 min-w-0 w-full max-w-full">
            <div className="rounded-xl sm:rounded-2xl border border-border/80 bg-card p-3 sm:p-5 md:p-8 shadow-xs min-w-0 max-w-full overflow-hidden">
              <MarkdownContent
                content={currentLesson.theoryMarkdown}
                showFurigana={showFurigana}
              />
            </div>

            <div className="flex justify-end w-full min-w-0">
              <Button
                onClick={() => setActiveStep("dialogue")}
                className="w-full sm:w-auto gap-2 cursor-pointer font-semibold shadow-xs justify-center min-w-0 max-w-full whitespace-normal break-words h-auto min-h-9 py-2 px-3 text-xs sm:text-sm text-center"
              >
                <span className="break-words">Continue to Dialogue</span>
                <ArrowRight size={16} className="shrink-0" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Dialogue */}
        {activeStep === "dialogue" && (
          <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200 min-w-0 w-full max-w-full">
            <div className="rounded-xl sm:rounded-2xl border border-border/80 bg-card p-3 sm:p-5 md:p-8 shadow-xs space-y-3.5 sm:space-y-6 min-w-0 max-w-full overflow-hidden">
              <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-border/60 min-w-0 w-full">
                <div className="space-y-0.5 min-w-0 flex-1">
                  <h3 className="text-sm sm:text-base font-bold text-foreground truncate">
                    Contextual Conversation
                  </h3>
                  <p className="text-xs text-muted-foreground break-words">
                    Listen to natural pronunciation and observe the grammar in context.
                  </p>
                </div>
              </div>

              <div className="space-y-2.5 sm:space-y-4 w-full min-w-0">
                {currentLesson.dialogue.map((line, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 sm:p-4 rounded-xl border border-border/70 bg-muted/20 hover:bg-muted/40 transition-colors flex items-start justify-between gap-2 sm:gap-4 min-w-0 w-full overflow-hidden"
                  >
                    <div className="space-y-1 sm:space-y-1.5 flex-1 min-w-0 overflow-hidden">
                      <div className="text-xs font-bold text-primary truncate">
                        {line.speaker}
                      </div>
                      <div className="text-xs sm:text-base font-medium text-foreground tracking-wide leading-relaxed break-words min-w-0">
                        <TokenizedText
                          text={line.jpText}
                          showFurigana={showFurigana}
                        />
                      </div>
                      <div className="text-xs text-muted-foreground pt-0.5 break-words min-w-0">
                        {line.enText}
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handlePlayAudio(`dialogue-${idx}`, line.jpText)}
                      className="shrink-0 text-muted-foreground hover:text-foreground cursor-pointer h-8 w-8 sm:h-9 sm:w-9"
                      title="Play pronunciation audio"
                      aria-label="Play pronunciation audio"
                    >
                      {activeAudioId === `dialogue-${idx}` && isLoading ? (
                        <Loader2 size={18} className="animate-spin text-primary" />
                      ) : activeAudioId === `dialogue-${idx}` && isPlaying ? (
                        <Volume2 size={18} className="text-primary animate-pulse" />
                      ) : (
                        <Volume2 size={18} />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-between gap-2 sm:gap-3 w-full min-w-0">
              <Button
                variant="outline"
                onClick={() => setActiveStep("theory")}
                className="w-full sm:w-auto gap-1.5 cursor-pointer justify-center min-w-0 max-w-full whitespace-normal break-words h-auto min-h-9 py-2 px-3 text-xs sm:text-sm text-center"
              >
                <ChevronLeft size={16} className="shrink-0" />
                <span className="break-words">Back to Theory</span>
              </Button>
              <Button
                onClick={() => setActiveStep("exercises")}
                className="w-full sm:w-auto gap-2 cursor-pointer font-semibold shadow-xs justify-center min-w-0 max-w-full whitespace-normal break-words h-auto min-h-9 py-2 px-3 text-xs sm:text-sm text-center"
              >
                <span className="break-words">Continue to Exercises</span>
                <ArrowRight size={16} className="shrink-0" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Interactive Practice */}
        {activeStep === "exercises" && (
          <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200 min-w-0 w-full max-w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2 pb-2 min-w-0 w-full">
              <div className="min-w-0 flex-1">
                <h3 className="text-sm sm:text-base font-bold text-foreground truncate">
                  Interactive Exercises
                </h3>
                <p className="text-xs text-muted-foreground break-words">
                  Test your understanding. Exercises are validated instantly with zero token consumption.
                </p>
              </div>

              {/* Progress Count */}
              <div className="text-xs font-semibold text-muted-foreground shrink-0 break-words">
                Answered: {Object.keys(exerciseAnswers).length} /{" "}
                {currentLesson.exercises.length}
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4 w-full min-w-0">
              {currentLesson.exercises.map((exercise) => {
                const isAnswered = exercise.order in exerciseAnswers;
                const wasCorrect = exerciseAnswers[exercise.order];

                return (
                  <InteractiveExercise
                    key={exercise.order}
                    exercise={exercise}
                    isAnswered={isAnswered}
                    wasCorrect={wasCorrect}
                    showFurigana={showFurigana}
                    onAnswer={(isCorrect) =>
                      handleExerciseAnswer(exercise.order, isCorrect)
                    }
                  />
                );
              })}
            </div>

            {/* Completion Banner */}
            {Object.keys(exerciseAnswers).length ===
              currentLesson.exercises.length && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 sm:p-4 md:p-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 min-w-0 w-full overflow-hidden">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                  <div className="p-2 rounded-full bg-emerald-500 text-white shrink-0">
                    <Award size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs sm:text-sm font-bold text-emerald-950 dark:text-emerald-100 truncate">
                      Practice Completed!
                    </h4>
                    <p className="text-[11px] sm:text-xs text-emerald-800 dark:text-emerald-300 break-words">
                      Score:{" "}
                      {Math.round(
                        (Object.values(exerciseAnswers).filter(Boolean).length /
                          currentLesson.exercises.length) *
                          100
                      )}
                      % • Progress automatically saved.
                    </p>
                  </div>
                </div>

                <Button
                  onClick={() => setActiveStep("vocabulary")}
                  className="w-full sm:w-auto cursor-pointer font-semibold shadow-xs justify-center min-w-0 max-w-full whitespace-normal break-words h-auto min-h-9 py-2 px-3 text-xs sm:text-sm text-center shrink-0"
                >
                  <span className="break-words">View Vocabulary & Cards →</span>
                </Button>
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row justify-between gap-2 sm:gap-3 w-full min-w-0">
              <Button
                variant="outline"
                onClick={() => setActiveStep("dialogue")}
                className="w-full sm:w-auto gap-1.5 cursor-pointer justify-center min-w-0 max-w-full whitespace-normal break-words h-auto min-h-9 py-2 px-3 text-xs sm:text-sm text-center"
              >
                <ChevronLeft size={16} className="shrink-0" />
                <span className="break-words">Back to Dialogue</span>
              </Button>
              <Button
                onClick={() => setActiveStep("vocabulary")}
                className="w-full sm:w-auto gap-2 cursor-pointer font-semibold shadow-xs justify-center min-w-0 max-w-full whitespace-normal break-words h-auto min-h-9 py-2 px-3 text-xs sm:text-sm text-center"
              >
                <span className="break-words">Vocabulary & Cards</span>
                <ArrowRight size={16} className="shrink-0" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Vocabulary & Flashcards */}
        {activeStep === "vocabulary" && (
          <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200 min-w-0 w-full max-w-full">
            <div className="rounded-xl sm:rounded-2xl border border-border/80 bg-card p-3 sm:p-5 md:p-8 shadow-xs space-y-3.5 sm:space-y-6 min-w-0 max-w-full overflow-hidden">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 pb-3 sm:pb-4 border-b border-border/60 min-w-0 w-full">
                <div className="space-y-0.5 min-w-0 flex-1">
                  <h3 className="text-sm sm:text-base font-bold text-foreground truncate">
                    Lesson Vocabulary
                  </h3>
                  <p className="text-xs text-muted-foreground break-words">
                    Review introduced vocabulary and export directly to your Flashcards.
                  </p>
                </div>

                <Button
                  onClick={handleAddAllToFlashcards}
                  disabled={isAddingCards || cardsAddedCount !== null}
                  className="gap-2 cursor-pointer font-semibold shadow-xs w-full sm:w-auto justify-center shrink-0 min-w-0 max-w-full whitespace-normal break-words h-auto min-h-9 py-2 px-3 text-xs sm:text-sm text-center"
                >
                  {isAddingCards ? (
                    <>
                      <Loader2 size={15} className="animate-spin shrink-0" />
                      <span className="break-words">Adding cards...</span>
                    </>
                  ) : cardsAddedCount !== null ? (
                    <>
                      <CheckCircle2 size={15} className="shrink-0" />
                      <span className="break-words">Added {cardsAddedCount} cards!</span>
                    </>
                  ) : (
                    <>
                      <Layers size={15} className="shrink-0" />
                      <span className="break-words">Add All Words to Flashcards</span>
                    </>
                  )}
                </Button>
              </div>

              {/* Vocabulary Table */}
              <div className="divide-y divide-border/60 w-full min-w-0">
                {currentLesson.vocabulary.map((item, idx) => (
                  <div
                    key={idx}
                    className="py-2.5 sm:py-3 flex items-center justify-between gap-2.5 sm:gap-3 min-w-0 w-full overflow-hidden"
                  >
                    <div className="space-y-0.5 min-w-0 flex-1 overflow-hidden">
                      <div className="text-xs sm:text-base font-bold text-foreground break-words min-w-0">
                        {showFurigana && item.reading && item.reading !== item.jpText ? (
                          <ruby className="inline-flex flex-col items-start leading-none max-w-full">
                            <span className="text-[10px] font-normal text-muted-foreground select-none pb-0.5 leading-none break-words">
                              {item.reading}
                            </span>
                            <span className="leading-tight break-words">{item.jpText}</span>
                          </ruby>
                        ) : (
                          <>
                            <span className="break-words">{item.jpText}</span>
                            {item.reading && item.reading !== item.jpText && (
                              <span className="text-xs text-muted-foreground font-normal ml-2 break-words">
                                ({item.reading})
                              </span>
                            )}
                          </>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground break-words min-w-0">
                        {item.enText}
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handlePlayAudio(`vocab-${idx}`, item.jpText)}
                      className="text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
                      title="Listen"
                      aria-label="Listen"
                    >
                      {activeAudioId === `vocab-${idx}` && isLoading ? (
                        <Loader2 size={16} className="animate-spin text-primary" />
                      ) : activeAudioId === `vocab-${idx}` && isPlaying ? (
                        <Volume2 size={16} className="text-primary animate-pulse" />
                      ) : (
                        <Volume2 size={16} />
                      )}
                    </Button>
                  </div>
                ))}
              </div>

              {/* Feedback Section */}
              <div className="pt-3.5 sm:pt-6 border-t border-border/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 text-xs text-muted-foreground min-w-0 w-full">
                <span className="break-words">How was this lesson explanation?</span>
                <div className="flex items-center gap-2 w-full sm:w-auto min-w-0">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={feedbackSubmitted || isSubmittingFeedback}
                    onClick={() => handleFeedback("helpful")}
                    className="flex-1 sm:flex-none justify-center h-auto min-h-8 py-1.5 px-2.5 gap-1.5 text-xs cursor-pointer hover:text-emerald-600 hover:border-emerald-500/50 min-w-0 whitespace-normal break-words"
                  >
                    {isSubmittingFeedback ? (
                      <Loader2 size={13} className="animate-spin shrink-0" />
                    ) : (
                      <ThumbsUp size={13} className="shrink-0" />
                    )}
                    <span>Helpful</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={feedbackSubmitted || isSubmittingFeedback}
                    onClick={() => handleFeedback("confusing")}
                    className="flex-1 sm:flex-none justify-center h-auto min-h-8 py-1.5 px-2.5 gap-1.5 text-xs cursor-pointer hover:text-red-500 hover:border-red-500/50 min-w-0 whitespace-normal break-words"
                  >
                    {isSubmittingFeedback ? (
                      <Loader2 size={13} className="animate-spin shrink-0" />
                    ) : (
                      <ThumbsDown size={13} className="shrink-0" />
                    )}
                    <span>Needs improvement</span>
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-between gap-2 sm:gap-3 w-full min-w-0">
              <Button
                variant="outline"
                onClick={() => setActiveStep("exercises")}
                className="w-full sm:w-auto gap-1.5 cursor-pointer justify-center min-w-0 max-w-full whitespace-normal break-words h-auto min-h-9 py-2 px-3 text-xs sm:text-sm text-center"
              >
                <ChevronLeft size={16} className="shrink-0" />
                <span className="break-words">Back to Exercises</span>
              </Button>
              <Button
                onClick={handleFinishLesson}
                disabled={isFinishing}
                className="w-full sm:w-auto gap-2 cursor-pointer font-semibold shadow-xs justify-center min-w-0 max-w-full whitespace-normal break-words h-auto min-h-9 py-2 px-3 text-xs sm:text-sm text-center"
              >
                {isFinishing ? (
                  <>
                    <Loader2 size={16} className="animate-spin shrink-0" />
                    <span className="break-words">Finishing...</span>
                  </>
                ) : (
                  <>
                    <span className="break-words">Finish & Return to Curriculum</span>
                    <CheckCircle2 size={16} className="shrink-0" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
