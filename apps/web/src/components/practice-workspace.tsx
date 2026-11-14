"use client";

import { useState, useEffect } from "react";
import { usePractice } from "@/contexts/PracticeContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Lock,
  Unlock,
  RotateCcw,
  Eye,
  EyeOff,
  Lightbulb,
  Loader2,
  Trophy,
} from "lucide-react";

export function PracticeWorkspace() {
  const {
    dailyState,
    isLoading,
    isSubmitting,
    lastAttemptResult,
    error,
    clearError,
    submitTranslation,
    devUnlockNext,
  } = usePractice();

  const [userAnswer, setUserAnswer] = useState("");
  const [showReading, setShowReading] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // Clear input, reading, and hint whenever active prompt changes
  useEffect(() => {
    setUserAnswer("");
    setShowReading(false);
    setShowHint(false);
  }, [dailyState?.prompt?.id]);

  const totalCompleted = dailyState?.progress?.totalCompleted ?? 0;
  const totalPrompts = dailyState?.totalPrompts ?? 4;
  const progressPercent = Math.min(
    100,
    Math.round((totalCompleted / Math.max(1, totalPrompts)) * 100)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = userAnswer.trim();
    if (!trimmed || isSubmitting) return;
    await submitTranslation(trimmed);
  };

  const renderContent = () => {
    // 1. Loading State (when loading and no prompt loaded yet)
    if (
      isLoading &&
      !dailyState?.prompt &&
      !dailyState?.allCompleted &&
      !dailyState?.isLockedToday
    ) {
      return (
        <div
          data-testid="practice-loading-state"
          className="p-8 sm:p-12 rounded-xl border border-border/80 bg-card flex flex-col items-center justify-center gap-3 text-center min-w-0 w-full"
        >
          <Loader2 className="h-8 w-8 animate-spin text-primary shrink-0" />
          <p className="text-sm font-medium text-muted-foreground break-words">
            Loading translation challenge...
          </p>
        </div>
      );
    }

    // 2. All Completed State
    if (dailyState?.allCompleted) {
      return (
        <div
          data-testid="practice-all-completed"
          className="p-5 sm:p-8 rounded-xl border border-border/80 bg-card space-y-5 sm:space-y-6 text-center min-w-0 w-full max-w-full shadow-xs"
        >
          <div className="flex flex-col items-center gap-2 sm:gap-3 min-w-0">
            <div className="p-3 sm:p-3.5 rounded-full bg-primary/10 text-primary">
              <Trophy className="h-8 w-8 sm:h-10 sm:w-10 shrink-0" />
            </div>
            <div className="space-y-1 min-w-0">
              <h2 className="text-xl sm:text-2xl font-extrabold text-foreground break-words">
                All MVP Challenges Completed!
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground break-words">
                Congratulations! You have mastered all translation challenges in this set ({totalCompleted} / {totalPrompts}).
              </p>
            </div>
            <Badge variant="default" className="text-xs font-bold gap-1 mt-1">
              <Sparkles className="h-3.5 w-3.5 shrink-0" />
              <span>{totalCompleted} / {totalPrompts} Completed</span>
            </Badge>
          </div>

          {/* Show final canonical answer & explanation if available */}
          {lastAttemptResult?.isCorrect && (
            <div className="text-left space-y-3 p-3.5 sm:p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-950 dark:text-emerald-200 min-w-0 w-full">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>Final Challenge Solution</span>
              </div>
              <div className="space-y-1 min-w-0">
                <div className="text-xs font-semibold text-muted-foreground">Canonical Answer:</div>
                <div className="text-base sm:text-lg font-bold text-foreground break-words">
                  {lastAttemptResult.canonicalAnswer}
                </div>
                {lastAttemptResult.answerReading && (
                  <div className="text-xs sm:text-sm text-muted-foreground break-words font-medium">
                    {lastAttemptResult.answerReading}
                  </div>
                )}
              </div>
              {lastAttemptResult.explanation && (
                <div className="pt-2 border-t border-emerald-500/20 text-xs sm:text-sm text-muted-foreground break-words">
                  <span className="font-semibold text-foreground">Explanation: </span>
                  {lastAttemptResult.explanation}
                </div>
              )}
            </div>
          )}

          {/* Non-production Restart Button */}
          {process.env.NODE_ENV !== "production" && (
            <div className="pt-2 flex flex-col sm:flex-row justify-center gap-2 sm:gap-3 w-full min-w-0">
              <Button
                variant="outline"
                onClick={() => devUnlockNext(true)}
                className="w-full sm:w-auto justify-center cursor-pointer gap-2"
              >
                <RotateCcw className="h-4 w-4 shrink-0" />
                <span>Restart Practice</span>
              </Button>
            </div>
          )}
        </div>
      );
    }

    // 3. Daily Locked State
    if (dailyState?.isLockedToday) {
      const nextLabel =
        dailyState.nextDifficultyLabel ||
        dailyState.prompt?.difficultyLabel ||
        "Next Level";

      return (
        <div
          data-testid="practice-daily-locked"
          className="p-5 sm:p-8 rounded-xl border border-border/80 bg-card space-y-5 sm:space-y-6 min-w-0 w-full max-w-full shadow-xs"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 min-w-0 w-full">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="p-2.5 sm:p-3 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                <CheckCircle2 className="h-6 w-6 sm:h-7 sm:w-7" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-foreground break-words">
                  Today&apos;s Challenge Completed!
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground break-words">
                  Great work today. Consistency is the secret to fluency.
                </p>
              </div>
            </div>
            <Badge variant="outline" className="text-xs font-semibold gap-1.5 shrink-0">
              <Lock className="h-3 w-3 shrink-0" />
              <span>Come back tomorrow</span>
            </Badge>
          </div>

          {/* Show correct answer & explanation if available */}
          {lastAttemptResult?.isCorrect && (
            <div className="space-y-3 p-3.5 sm:p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-950 dark:text-emerald-200 min-w-0 w-full">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>Completed Challenge Solution</span>
              </div>
              <div className="space-y-1 min-w-0">
                <div className="text-xs font-semibold text-muted-foreground">Canonical Answer:</div>
                <div className="text-base sm:text-lg font-bold text-foreground break-words">
                  {lastAttemptResult.canonicalAnswer}
                </div>
                {lastAttemptResult.answerReading && (
                  <div className="text-xs sm:text-sm text-muted-foreground break-words font-medium">
                    {lastAttemptResult.answerReading}
                  </div>
                )}
              </div>
              {lastAttemptResult.explanation && (
                <div className="pt-2 border-t border-emerald-500/20 text-xs sm:text-sm text-muted-foreground break-words">
                  <span className="font-semibold text-foreground">Explanation: </span>
                  {lastAttemptResult.explanation}
                </div>
              )}
            </div>
          )}

          {/* Next challenge preview */}
          <div className="p-3.5 sm:p-4 rounded-xl border border-border/80 bg-muted/40 min-w-0 w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 sm:gap-4 text-xs sm:text-sm">
            <span className="text-muted-foreground font-medium shrink-0">Next challenge:</span>
            <span className="font-bold text-foreground break-words sm:text-right">
              {nextLabel}
            </span>
          </div>

          {/* Non-production Dev Controls */}
          {process.env.NODE_ENV !== "production" && (
            <div className="pt-2 flex flex-col-reverse sm:flex-row justify-between gap-2 sm:gap-3 w-full border-t border-border/60">
              <Button
                variant="outline"
                size="sm"
                onClick={() => devUnlockNext(true)}
                className="w-full sm:w-auto justify-center cursor-pointer text-xs gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5 shrink-0" />
                <span>Dev: Reset All</span>
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => devUnlockNext(false)}
                className="w-full sm:w-auto justify-center cursor-pointer text-xs font-semibold gap-1.5"
              >
                <Unlock className="h-3.5 w-3.5 shrink-0" />
                <span>Dev: Unlock Next Challenge</span>
              </Button>
            </div>
          )}
        </div>
      );
    }

    // 4. Active Prompt State
    const prompt = dailyState?.prompt;
    if (prompt) {
      const isJpToEn = prompt.direction === "JP_TO_EN";
      const directionLabel = isJpToEn ? "Japanese → English" : "English → Japanese";
      const placeholderText = isJpToEn
        ? "Enter your English translation..."
        : "Enter your Japanese translation...";

      return (
        <div
          data-testid="practice-active-prompt"
          className="p-3.5 sm:p-5 rounded-xl border border-border/80 bg-card space-y-4 sm:space-y-5 min-w-0 max-w-full shadow-xs"
        >
          {/* Metadata Badges */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 min-w-0">
            <Badge variant="default" className="text-xs font-semibold">
              {directionLabel}
            </Badge>
            <Badge variant="outline" className="text-xs font-semibold">
              {prompt.difficultyLabel}
            </Badge>
            <Badge variant="secondary" className="text-xs font-semibold">
              JLPT {prompt.jlptLevel}
            </Badge>
            {prompt.grammarPoint && (
              <Badge variant="outline" className="text-xs font-semibold text-primary border-primary/30">
                {prompt.grammarPoint}
              </Badge>
            )}
          </div>

          {/* Source Sentence Display */}
          <div className="space-y-2 p-3.5 sm:p-5 rounded-xl bg-muted/30 border border-border/60 min-w-0 w-full">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              {isJpToEn ? "Japanese Sentence" : "English Sentence"}
            </div>
            <div
              data-testid="practice-source-text"
              className="text-lg sm:text-2xl font-bold text-foreground break-words leading-relaxed"
              lang={isJpToEn ? "ja" : "en"}
            >
              {prompt.sourceText}
            </div>

            {/* Optional Reading */}
            {showReading && prompt.sourceReading && (
              <div
                data-testid="practice-source-reading"
                className="text-xs sm:text-sm text-muted-foreground break-words font-medium pt-1.5 border-t border-border/40"
                lang="ja"
              >
                {prompt.sourceReading}
              </div>
            )}
          </div>

          {/* Reading and Hint Toggles */}
          <div className="flex flex-wrap items-center gap-2 w-full min-w-0">
            {prompt.sourceReading && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowReading((prev) => !prev)}
                className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer gap-1.5 shrink-0"
              >
                {showReading ? (
                  <>
                    <EyeOff className="h-3.5 w-3.5 shrink-0" />
                    <span>Hide Reading</span>
                  </>
                ) : (
                  <>
                    <Eye className="h-3.5 w-3.5 shrink-0" />
                    <span>Show Reading</span>
                  </>
                )}
              </Button>
            )}

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowHint((prev) => !prev)}
              className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer gap-1.5 shrink-0"
            >
              {showHint ? (
                <>
                  <Lightbulb className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                  <span>Hide Hint</span>
                </>
              ) : (
                <>
                  <Lightbulb className="h-3.5 w-3.5 shrink-0" />
                  <span>Show Hint</span>
                </>
              )}
            </Button>
          </div>

          {/* Hint Card */}
          {showHint && prompt.hint && (
            <div
              data-testid="practice-hint-box"
              className="flex items-start gap-2.5 p-3 sm:p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs sm:text-sm text-foreground shadow-xs animate-in fade-in min-w-0 w-full"
            >
              <Lightbulb className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <span className="font-semibold block text-[11px] uppercase tracking-wider text-amber-800 dark:text-amber-300 mb-0.5">
                  Hint
                </span>
                <span className="break-words">{prompt.hint}</span>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 w-full min-w-0">
            <div className="space-y-1.5 min-w-0 w-full">
              <label
                htmlFor="translation-input"
                className="text-xs sm:text-sm font-semibold text-foreground flex items-center justify-between gap-2"
              >
                <span>Your Translation</span>
                <span className="text-[11px] text-muted-foreground font-normal">
                  {isJpToEn ? "in English" : "in Japanese"}
                </span>
              </label>
              <Textarea
                id="translation-input"
                aria-label="Your translation"
                rows={3}
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder={placeholderText}
                disabled={isSubmitting}
                className="w-full min-w-0 break-words resize-none text-sm sm:text-base"
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
            </div>

            {/* Retry alert on incorrect attempt (WITHOUT leaking canonical answer) */}
            {lastAttemptResult &&
              !lastAttemptResult.isCorrect &&
              !lastAttemptResult.alreadyLockedToday && (
                <div
                  role="alert"
                  data-testid="practice-retry-alert"
                  className="flex items-center gap-2 sm:gap-2.5 p-3 sm:p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300 text-xs sm:text-sm shadow-xs animate-in fade-in min-w-0 w-full max-w-full"
                >
                  <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                  <span className="font-medium break-words">
                    Not quite right yet. Try again or check the hint!
                  </span>
                </div>
              )}

            {/* Action Bar */}
            <div className="flex flex-col-reverse sm:flex-row justify-between gap-2 sm:gap-3 w-full">
              <div className="text-[11px] sm:text-xs text-muted-foreground self-center hidden sm:block">
                Press Ctrl+Enter to submit
              </div>
              <Button
                type="submit"
                disabled={isSubmitting || !userAnswer.trim()}
                className="w-full sm:w-auto justify-center cursor-pointer font-semibold gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                    <span>Checking...</span>
                  </>
                ) : (
                  <span>Check Translation</span>
                )}
              </Button>
            </div>
          </form>
        </div>
      );
    }

    // Fallback if no prompt and not locked or completed
    return (
      <div className="p-6 sm:p-8 rounded-xl border border-border/80 bg-card text-center space-y-3 min-w-0 w-full">
        <p className="text-xs sm:text-sm text-muted-foreground break-words">
          No active challenge available right now.
        </p>
        {process.env.NODE_ENV !== "production" && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => devUnlockNext(true)}
            className="w-full sm:w-auto justify-center cursor-pointer text-xs gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5 shrink-0" />
            <span>Reset Practice</span>
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="w-full min-w-0 max-w-full overflow-x-hidden p-3 sm:p-6 md:p-8">
      <div className="max-w-3xl mx-auto w-full min-w-0 space-y-4 sm:space-y-6">
        {/* Error Banner */}
        {error && (
          <div
            role="alert"
            data-testid="practice-error-banner"
            className="flex items-center justify-between gap-2.5 sm:gap-3 p-3 sm:p-3.5 rounded-xl border border-destructive/40 bg-destructive/10 text-destructive text-xs sm:text-sm shadow-xs animate-in fade-in min-w-0 w-full max-w-full"
          >
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

        {/* Header Banner */}
        <div className="rounded-xl sm:rounded-2xl border border-border/80 bg-linear-to-r from-primary/10 via-primary/5 to-transparent p-3.5 sm:p-6 shadow-xs min-w-0 w-full max-w-full overflow-hidden">
          <div className="space-y-1.5 sm:space-y-2 min-w-0 w-full">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                Daily Challenge
              </span>
            </div>
            <h1 className="text-lg sm:text-2xl md:text-3xl font-extrabold tracking-tight text-foreground break-words">
              Daily Translation Practice
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground break-words">
              Complete one translation challenge a day. Each success unlocks a higher difficulty.
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mt-3.5 sm:mt-5 pt-3.5 sm:pt-4 border-t border-border/60 space-y-1.5 sm:space-y-2 w-full min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] sm:text-xs font-medium text-muted-foreground min-w-0 w-full">
              <span>Progress</span>
              <span className="break-words">
                {totalCompleted} of {totalPrompts} completed
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
              <div
                role="progressbar"
                aria-valuenow={progressPercent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Practice completion progress"
                className="h-full bg-primary transition-all duration-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Content Section based on state */}
        {renderContent()}
      </div>
    </div>
  );
}
