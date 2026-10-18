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
  RotateCcw,
  Loader2,
  Award,
  AlertCircle,
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
    setSelectedTopicId,
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
      <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground">
          Loading JLPT {selectedLevel} curriculum...
        </p>
      </div>
    );
  }

  // If a lesson is actively loading (JIT generation by Gemini)
  if (isLoadingLesson) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-4">
        <div className="p-4 rounded-2xl bg-primary/10 text-primary animate-pulse">
          <Sparkles size={36} />
        </div>
        <div className="text-center space-y-1.5">
          <h3 className="text-lg font-bold">The AI Tutor is preparing your lesson...</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Generating theory, natural dialogue, audio transcriptions, and interactive exercises.
          </p>
        </div>
        <Loader2 className="h-6 w-6 animate-spin text-primary mt-2" />
      </div>
    );
  }


  // Dashboard / Roadmap View when no lesson is active
  if (!currentLesson) {
    return (
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 max-w-5xl mx-auto">
        {/* Error Notification Banner */}
        {error && (
          <div className="flex items-center justify-between gap-3 p-4 rounded-xl border border-destructive/40 bg-destructive/10 text-destructive text-sm shadow-xs animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2.5 text-xs text-destructive hover:bg-destructive/20 hover:text-destructive cursor-pointer"
              onClick={() => clearError()}
            >
              Dismiss
            </Button>
          </div>
        )}

        {/* Banner Section */}
        <div className="rounded-2xl border border-border/80 bg-linear-to-r from-primary/10 via-primary/5 to-transparent p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider">
                  JLPT {selectedLevel}
                </span>
                <span className="text-xs font-medium text-muted-foreground">
                  Structured Learning Path
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                Daily AI Tutor
              </h1>
              <p className="text-sm text-muted-foreground max-w-md">
                Master Japanese grammar, dialogue nuances, and vocabulary step-by-step with structured micro-lessons.
              </p>
            </div>

            {/* Quick Continue Card */}
            {nextRecommendedTopic && (
              <div className="w-full sm:w-auto p-4 rounded-xl border border-border/90 bg-card/90 shadow-xs space-y-3 min-w-[260px]">
                <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                  <span>Recommended Today</span>
                  <span>Lesson {nextRecommendedTopic.lessonIndex}</span>
                </div>
                <div className="font-bold text-sm text-foreground line-clamp-1">
                  {nextRecommendedTopic.title}
                </div>
                <Button
                  onClick={() => handleStartLesson(nextRecommendedTopic.id)}
                  className="w-full gap-2 cursor-pointer shadow-xs font-semibold"
                >
                  <Play size={15} />
                  Start Today's Lesson
                </Button>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mt-6 pt-5 border-t border-border/60 space-y-2">
            <div className="flex justify-between text-xs font-medium text-muted-foreground">
              <span>Level Progress</span>
              <span>
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
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-foreground">
                Curriculum Roadmap
              </h2>
              <p className="text-xs text-muted-foreground">
                {curriculum.length} lesson{curriculum.length === 1 ? "" : "s"} across {units.length} unit{units.length === 1 ? "" : "s"}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => generateNextUnit()}
              disabled={isGeneratingUnit}
              className="gap-2 cursor-pointer shadow-xs text-xs font-semibold self-start sm:self-auto"
            >
              {isGeneratingUnit ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                  Generating Unit with AI...
                </>
              ) : (
                <>
                  <Sparkles size={14} className="text-primary" />
                  + Generate Next Unit (AI)
                </>
              )}
            </Button>
          </div>

          {curriculum.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center space-y-4 bg-card/40">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center">
                <Sparkles size={24} />
              </div>
              <div className="space-y-1.5 max-w-md mx-auto">
                <h3 className="text-base font-bold text-foreground">
                  No lessons generated for JLPT {selectedLevel} yet
                </h3>
                <p className="text-xs text-muted-foreground">
                  The AI Tutor can generate a tailored study unit for JLPT {selectedLevel} with grammar explanations, natural dialogues, audio, and exercises.
                </p>
              </div>
              <Button
                onClick={() => generateNextUnit()}
                disabled={isGeneratingUnit}
                className="gap-2 cursor-pointer font-semibold shadow-xs"
              >
                {isGeneratingUnit ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating JLPT {selectedLevel} Topics with AI...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    Generate JLPT {selectedLevel} Topics with AI
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {units.map(([unitIndex, unit]) => (
                <div
                  key={unitIndex}
                  className="rounded-xl border border-border/80 bg-card/60 p-5 shadow-xs space-y-4"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-md bg-muted text-muted-foreground text-xs font-bold flex items-center justify-center">
                      {unitIndex}
                    </span>
                    <h3 className="font-bold text-base text-foreground">
                      Unit {unitIndex}: {unit.title}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {unit.topics.map((topic) => (
                      <div
                        key={topic.id}
                        onClick={() => handleStartLesson(topic.id)}
                        className={`group p-4 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          topic.isCompleted
                            ? "border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/50"
                            : topic.id === nextRecommendedTopic?.id
                            ? "border-primary/50 bg-primary/5 hover:border-primary shadow-xs"
                            : "border-border/70 hover:border-border hover:bg-muted/40"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                              topic.isCompleted
                                ? "bg-emerald-500 text-white"
                                : topic.id === nextRecommendedTopic?.id
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {topic.isCompleted ? (
                              <CheckCircle2 size={16} />
                            ) : (
                              topic.lessonIndex
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                              {topic.title}
                            </h4>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {topic.objective}
                            </p>
                          </div>
                        </div>

                        <ChevronRight
                          size={16}
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
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Lesson Header Navigation */}
      <div className="p-4 border-b border-border/80 bg-card/60 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={closeLesson}
            className="gap-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <ChevronLeft size={16} />
            Curriculum
          </Button>
          <div className="h-4 w-px bg-border/80" />
          <div>
            <span className="text-[11px] font-bold text-primary uppercase tracking-wider">
              {currentLesson.level} • Lesson
            </span>
            <h2 className="text-base font-bold text-foreground line-clamp-1">
              {currentLesson.title}
            </h2>
          </div>
        </div>

        {/* 4 Steps Nav Selector */}
        <div className="flex p-0.5 bg-muted/70 rounded-lg border border-border/70 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveStep("theory")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              activeStep === "theory"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <BookOpen size={14} />
            <span className="hidden sm:inline">1. Theory</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveStep("dialogue")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              activeStep === "dialogue"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <MessageSquare size={14} />
            <span className="hidden sm:inline">2. Dialogue</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveStep("exercises")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              activeStep === "exercises"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <CheckSquare size={14} />
            <span className="hidden sm:inline">3. Practice</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveStep("vocabulary")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              activeStep === "vocabulary"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Layers size={14} />
            <span className="hidden sm:inline">4. Vocabulary</span>
          </button>
        </div>
      </div>

      {/* Error Notification Banner */}
      {error && (
        <div className="mx-4 mt-4 flex items-center justify-between gap-3 p-3.5 rounded-xl border border-destructive/40 bg-destructive/10 text-destructive text-sm shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-destructive hover:bg-destructive/20 hover:text-destructive cursor-pointer"
            onClick={() => clearError()}
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-4xl mx-auto w-full space-y-6">
        {/* Step 1: Theory */}
        {activeStep === "theory" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="rounded-2xl border border-border/80 bg-card p-6 md:p-8 shadow-xs">
              <MarkdownContent content={currentLesson.theoryMarkdown} />
            </div>

            <div className="flex justify-end">
              <Button
                onClick={() => setActiveStep("dialogue")}
                className="gap-2 cursor-pointer font-semibold shadow-xs"
              >
                <span>Continue to Dialogue</span>
                <ArrowRight size={16} />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Dialogue */}
        {activeStep === "dialogue" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="rounded-2xl border border-border/80 bg-card p-6 md:p-8 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-border/60">
                <div className="space-y-0.5">
                  <h3 className="text-base font-bold text-foreground">
                    Contextual Conversation
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Listen to natural pronunciation and observe the grammar in context.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {currentLesson.dialogue.map((line, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-border/70 bg-muted/20 hover:bg-muted/40 transition-colors flex items-start justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="text-xs font-bold text-primary">
                        {line.speaker}
                      </div>
                      <div className="text-base font-medium text-foreground tracking-wide leading-relaxed">
                        <TokenizedText text={line.jpText} />
                      </div>
                      <div className="text-xs text-muted-foreground pt-0.5">
                        {line.enText}
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handlePlayAudio(`dialogue-${idx}`, line.jpText)}
                      className="shrink-0 text-muted-foreground hover:text-foreground cursor-pointer h-9 w-9"
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

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setActiveStep("theory")}
                className="gap-1.5 cursor-pointer"
              >
                <ChevronLeft size={16} />
                Back to Theory
              </Button>
              <Button
                onClick={() => setActiveStep("exercises")}
                className="gap-2 cursor-pointer font-semibold shadow-xs"
              >
                <span>Continue to Exercises</span>
                <ArrowRight size={16} />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Interactive Practice */}
        {activeStep === "exercises" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-2">
              <div>
                <h3 className="text-base font-bold text-foreground">
                  Interactive Exercises
                </h3>
                <p className="text-xs text-muted-foreground">
                  Test your understanding. Exercises are validated instantly with zero token consumption.
                </p>
              </div>

              {/* Progress Count */}
              <div className="text-xs font-semibold text-muted-foreground">
                Answered: {Object.keys(exerciseAnswers).length} /{" "}
                {currentLesson.exercises.length}
              </div>
            </div>

            <div className="space-y-4">
              {currentLesson.exercises.map((exercise) => {
                const isAnswered = exercise.order in exerciseAnswers;
                const wasCorrect = exerciseAnswers[exercise.order];

                return (
                  <InteractiveExercise
                    key={exercise.order}
                    exercise={exercise}
                    isAnswered={isAnswered}
                    wasCorrect={wasCorrect}
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
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-emerald-500 text-white">
                    <Award size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-emerald-950 dark:text-emerald-100">
                      Practice Completed!
                    </h4>
                    <p className="text-xs text-emerald-800 dark:text-emerald-300">
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
                  className="cursor-pointer font-semibold shadow-xs"
                >
                  View Vocabulary & Cards →
                </Button>
              </div>
            )}

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setActiveStep("dialogue")}
                className="gap-1.5 cursor-pointer"
              >
                <ChevronLeft size={16} />
                Back to Dialogue
              </Button>
              <Button
                onClick={() => setActiveStep("vocabulary")}
                className="gap-2 cursor-pointer font-semibold shadow-xs"
              >
                <span>Vocabulary & Cards</span>
                <ArrowRight size={16} />
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Vocabulary & Flashcards */}
        {activeStep === "vocabulary" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="rounded-2xl border border-border/80 bg-card p-6 md:p-8 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
                <div className="space-y-0.5">
                  <h3 className="text-base font-bold text-foreground">
                    Lesson Vocabulary
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Review introduced vocabulary and export directly to your Flashcards.
                  </p>
                </div>

                <Button
                  onClick={handleAddAllToFlashcards}
                  disabled={isAddingCards || cardsAddedCount !== null}
                  className="gap-2 cursor-pointer font-semibold shadow-xs w-full sm:w-auto"
                >
                  {isAddingCards ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      Adding cards...
                    </>
                  ) : cardsAddedCount !== null ? (
                    <>
                      <CheckCircle2 size={15} />
                      Added {cardsAddedCount} cards!
                    </>
                  ) : (
                    <>
                      <Layers size={15} />
                      Add All Words to Flashcards
                    </>
                  )}
                </Button>
              </div>

              {/* Vocabulary Table */}
              <div className="divide-y divide-border/60">
                {currentLesson.vocabulary.map((item, idx) => (
                  <div
                    key={idx}
                    className="py-3 flex items-center justify-between gap-4"
                  >
                    <div className="space-y-0.5">
                      <div className="text-base font-bold text-foreground">
                        {item.jpText}
                        {item.reading && item.reading !== item.jpText && (
                          <span className="text-xs text-muted-foreground font-normal ml-2">
                            ({item.reading})
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.enText}
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handlePlayAudio(`vocab-${idx}`, item.jpText)}
                      className="text-muted-foreground hover:text-foreground cursor-pointer"
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
              <div className="pt-6 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
                <span>How was this lesson explanation?</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={feedbackSubmitted || isSubmittingFeedback}
                    onClick={() => handleFeedback("helpful")}
                    className="h-8 gap-1.5 text-xs cursor-pointer hover:text-emerald-600 hover:border-emerald-500/50"
                  >
                    {isSubmittingFeedback ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <ThumbsUp size={13} />
                    )}
                    Helpful
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={feedbackSubmitted || isSubmittingFeedback}
                    onClick={() => handleFeedback("confusing")}
                    className="h-8 gap-1.5 text-xs cursor-pointer hover:text-red-500 hover:border-red-500/50"
                  >
                    {isSubmittingFeedback ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <ThumbsDown size={13} />
                    )}
                    Needs improvement
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setActiveStep("exercises")}
                className="gap-1.5 cursor-pointer"
              >
                <ChevronLeft size={16} />
                Back to Exercises
              </Button>
              <Button
                onClick={handleFinishLesson}
                disabled={isFinishing}
                className="gap-2 cursor-pointer font-semibold shadow-xs"
              >
                {isFinishing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Finishing...</span>
                  </>
                ) : (
                  <>
                    <span>Finish & Return to Curriculum</span>
                    <CheckCircle2 size={16} />
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
