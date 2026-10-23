"use client";

import { useState, memo } from "react";
import type { LessonExercise } from "@nipponic/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, XCircle, RotateCcw, HelpCircle } from "lucide-react";
import { FuriganaText } from "@/components/furigana-text";

interface InteractiveExerciseProps {
  exercise: LessonExercise;
  onAnswer: (isCorrect: boolean) => void;
  isAnswered: boolean;
  wasCorrect?: boolean;
  showFurigana?: boolean;
}

export const InteractiveExercise = memo(function InteractiveExercise({
  exercise,
  onAnswer,
  isAnswered,
  wasCorrect,
  showFurigana = true,
}: InteractiveExerciseProps) {
  // State for multiple choice
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  // State for fill in the blank
  const [inputAnswer, setInputAnswer] = useState<string>("");

  // State for reorder
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [availableChips, setAvailableChips] = useState<string[]>(() => {
    if (exercise.type === "reorder" && exercise.options) {
      return [...exercise.options];
    }
    return [];
  });

  const handleSelectOption = (option: string) => {
    if (isAnswered) return;
    setSelectedOption(option);
    const isCorrect = option.trim() === exercise.correctAnswer.trim();
    onAnswer(isCorrect);
  };

  const handleCheckFillBlank = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isAnswered || !inputAnswer.trim()) return;
    const isCorrect =
      inputAnswer.trim().toLowerCase() ===
      exercise.correctAnswer.trim().toLowerCase();
    onAnswer(isCorrect);
  };

  const handleTapChip = (chip: string, index: number) => {
    if (isAnswered) return;
    setSelectedChips((prev) => [...prev, chip]);
    setAvailableChips((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveChip = (chip: string, index: number) => {
    if (isAnswered) return;
    setSelectedChips((prev) => prev.filter((_, i) => i !== index));
    setAvailableChips((prev) => [...prev, chip]);
  };

  const handleResetChips = () => {
    if (isAnswered) return;
    setSelectedChips([]);
    setAvailableChips(exercise.options ? [...exercise.options] : []);
  };

  const handleCheckReorder = () => {
    if (isAnswered || selectedChips.length === 0) return;
    const constructed = selectedChips.join(" ").trim();
    const isCorrect =
      constructed.replace(/\s+/g, "") ===
      exercise.correctAnswer.trim().replace(/\s+/g, "");
    onAnswer(isCorrect);
  };

  return (
    <div className="rounded-xl border border-border/80 bg-card p-5 shadow-xs space-y-4">
      {/* Header with Exercise Order and Type */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Exercise {exercise.order} •{" "}
          {exercise.type === "multiple_choice"
            ? "Multiple Choice"
            : exercise.type === "fill_blank"
            ? "Fill in the Blank"
            : "Sentence Order"}
        </span>
        {isAnswered && (
          <div
            className={`flex items-center gap-1.5 text-xs font-medium ${
              wasCorrect ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"
            }`}
          >
            {wasCorrect ? (
              <>
                <CheckCircle2 size={16} />
                <span>Correct</span>
              </>
            ) : (
              <>
                <XCircle size={16} />
                <span>Incorrect</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Prompt */}
      <div className="text-sm font-medium text-foreground leading-relaxed">
        <FuriganaText text={exercise.prompt} showFurigana={showFurigana} />
      </div>

      {/* Multiple Choice Options */}
      {exercise.type === "multiple_choice" && exercise.options && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          {exercise.options.map((option, idx) => {
            const isSelected = selectedOption === option;
            const isRightAnswer = option.trim() === exercise.correctAnswer.trim();

            let buttonClass =
              "justify-start text-left h-auto py-2.5 px-3.5 border text-sm font-medium transition-all cursor-pointer";
            if (!isAnswered) {
              buttonClass += isSelected
                ? " border-primary bg-primary/10 text-primary"
                : " border-border hover:bg-muted/50 text-foreground";
            } else {
              if (isRightAnswer) {
                buttonClass +=
                  " border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold";
              } else if (isSelected && !isRightAnswer) {
                buttonClass +=
                  " border-red-500 bg-red-500/10 text-red-600 line-through opacity-80";
              } else {
                buttonClass += " border-border/50 text-muted-foreground opacity-60";
              }
            }

            return (
              <Button
                key={idx}
                type="button"
                variant="outline"
                className={buttonClass}
                disabled={isAnswered}
                onClick={() => handleSelectOption(option)}
              >
                <span className="w-5 text-xs text-muted-foreground font-mono shrink-0">
                  {String.fromCharCode(65 + idx)}.
                </span>
                <span className="flex-1">
                  <FuriganaText text={option} showFurigana={showFurigana} />
                </span>
              </Button>
            );
          })}
        </div>
      )}

      {/* Fill in the Blank Form */}
      {exercise.type === "fill_blank" && (
        <form onSubmit={handleCheckFillBlank} className="flex gap-2 pt-1">
          <Input
            type="text"
            placeholder="Type your answer here..."
            value={inputAnswer}
            onChange={(e) => setInputAnswer(e.target.value)}
            disabled={isAnswered}
            className="flex-1 text-sm bg-muted/30"
          />
          <Button
            type="submit"
            size="sm"
            disabled={isAnswered || !inputAnswer.trim()}
            className="cursor-pointer font-medium"
          >
            Check Answer
          </Button>
        </form>
      )}

      {/* Reorder Word Chips */}
      {exercise.type === "reorder" && (
        <div className="space-y-3 pt-1">
          {/* Construction Drop Zone */}
          <div className="min-h-12 p-2.5 rounded-lg border-2 border-dashed border-border/80 bg-muted/20 flex flex-wrap gap-2 items-center">
            {selectedChips.length === 0 ? (
              <span className="text-xs text-muted-foreground italic px-1">
                Tap the words below in the correct order...
              </span>
            ) : (
              selectedChips.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  disabled={isAnswered}
                  onClick={() => handleRemoveChip(chip, idx)}
                  className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium shadow-2xs hover:bg-primary/90 transition-all cursor-pointer"
                  title="Click to remove"
                >
                  <FuriganaText text={chip} showFurigana={showFurigana} />
                </button>
              ))
            )}
          </div>

          {/* Available Word Chips */}
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {availableChips.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  disabled={isAnswered}
                  onClick={() => handleTapChip(chip, idx)}
                  className="px-3 py-1.5 rounded-md border border-border bg-card hover:bg-muted text-sm font-medium transition-all cursor-pointer shadow-2xs"
                >
                  <FuriganaText text={chip} showFurigana={showFurigana} />
                </button>
              ))}
            </div>

            {!isAnswered && (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleResetChips}
                  disabled={selectedChips.length === 0}
                  className="h-8 gap-1 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <RotateCcw size={13} />
                  Reset
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleCheckReorder}
                  disabled={selectedChips.length === 0}
                  className="h-8 text-xs cursor-pointer"
                >
                  Check Order
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Explanation Box on Answer */}
      {isAnswered && (
        <div
          className={`p-3.5 rounded-lg text-xs leading-relaxed border space-y-1 ${
            wasCorrect
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-950 dark:text-emerald-200"
              : "bg-red-500/10 border-red-500/20 text-red-950 dark:text-red-200"
          }`}
        >
          <div className="flex items-center gap-1.5 font-semibold">
            <HelpCircle size={14} />
            <span>Explanation</span>
          </div>
          <div>
            <FuriganaText text={exercise.explanation} showFurigana={showFurigana} />
          </div>
          {!wasCorrect && (
            <div className="font-medium pt-1">
              Correct answer:{" "}
              <span className="font-bold underline">
                <FuriganaText text={exercise.correctAnswer} showFurigana={showFurigana} />
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
});
