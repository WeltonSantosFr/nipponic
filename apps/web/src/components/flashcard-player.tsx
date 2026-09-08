"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, Deck, ReviewRating } from "@nipponic/shared";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSpeech } from "@/hooks/use-speech";
import { useFlashCards } from "@/contexts/FlashCardsContext";
import { formatIntervalPreview, getCardSRSStage } from "@/lib/srs";
import confetti from "canvas-confetti";
import {
  Volume2,
  VolumeX,
  X,
  Check,
  RotateCcw,
  Sparkles,
  Trophy,
  Layers,
  Flame,
  Zap,
} from "lucide-react";

interface FlashcardPlayerProps {
  deck: Deck;
  onClose: () => void;
}

export function FlashcardPlayer({ deck, onClose }: FlashcardPlayerProps) {
  const { reviewCard } = useFlashCards();
  const [queue, setQueue] = useState<Card[]>(() => [...deck.cards]);
  const [initialTotal] = useState<number>(deck.cards.length);
  const [completedCount, setCompletedCount] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [isFinished, setIsFinished] = useState<boolean>(deck.cards.length === 0);
  const [speechRate, setSpeechRate] = useState<number>(1.0);

  // Stats tracking for session
  const [stats, setStats] = useState<{
    again: number;
    hard: number;
    good: number;
    easy: number;
  }>({ again: 0, hard: 0, good: 0, easy: 0 });

  const { speak, stop, isPlaying } = useSpeech();

  const currentCard = queue[0];

  const triggerConfetti = useCallback(() => {
    try {
      const count = 200;
      const defaults = {
        origin: { y: 0.7 },
        zIndex: 9999,
      };

      const fire = (particleRatio: number, opts: confetti.Options) => {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio),
        });
      };

      fire(0.25, {
        spread: 26,
        startVelocity: 55,
      });
      fire(0.2, {
        spread: 60,
      });
      fire(0.35, {
        spread: 100,
        decay: 0.91,
        scalar: 0.8,
      });
      fire(0.1, {
        spread: 120,
        startVelocity: 25,
        decay: 0.92,
        scalar: 1.2,
      });
      fire(0.1, {
        spread: 120,
        startVelocity: 45,
      });
    } catch (err) {
      console.error("Confetti trigger error:", err);
    }
  }, []);

  const handleCardFlip = () => {
    setIsFlipped((prev) => !prev);
  };

  const handleRating = useCallback(
    async (rating: ReviewRating) => {
      if (!isFlipped || !currentCard) return;

      // Update backend & context with SM-2 spaced repetition calculation
      const updatedCard = await reviewCard(currentCard.id, rating);

      // Track statistics
      setStats((prev) => ({
        ...prev,
        again: rating === 1 ? prev.again + 1 : prev.again,
        hard: rating === 2 ? prev.hard + 1 : prev.hard,
        good: rating === 3 ? prev.good + 1 : prev.good,
        easy: rating === 4 ? prev.easy + 1 : prev.easy,
      }));

      setIsFlipped(false);

      if (rating === 1) {
        // Again (Forgot): place card at the end of current session queue to repeat
        const cardToQueue = updatedCard || currentCard;
        const nextQueue = [...queue.slice(1), cardToQueue];
        setQueue(nextQueue);
      } else {
        // Hard / Good / Easy: advance card
        const nextQueue = queue.slice(1);
        setCompletedCount((prev) => prev + 1);

        if (nextQueue.length === 0) {
          setQueue([]);
          setIsFinished(true);
          triggerConfetti();
        } else {
          setQueue(nextQueue);
        }
      }
    },
    [isFlipped, currentCard, queue, reviewCard, triggerConfetti]
  );

  const restartSession = () => {
    setQueue([...deck.cards]);
    setCompletedCount(0);
    setIsFlipped(false);
    setIsFinished(deck.cards.length === 0);
    setStats({ again: 0, hard: 0, good: 0, easy: 0 });
  };

  const handleSpeech = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    if (isPlaying) {
      stop();
    } else {
      speak(text, "ja-JP", speechRate);
    }
  };

  // Keyboard navigation shortcuts (Space/Enter to flip, 1-4 for SRS ratings)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        if (!isFinished && currentCard) {
          handleCardFlip();
        }
      } else if (isFlipped && !isFinished && currentCard) {
        if (e.key === "1") {
          e.preventDefault();
          handleRating(1);
        } else if (e.key === "2") {
          e.preventDefault();
          handleRating(2);
        } else if (e.key === "3") {
          e.preventDefault();
          handleRating(3);
        } else if (e.key === "4") {
          e.preventDefault();
          handleRating(4);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFlipped, isFinished, currentCard, handleRating, onClose]);

  // If the deck is completely empty
  if (deck.cards.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto overflow-x-hidden">
        <div
          className="relative w-full max-w-md p-6 sm:p-8 bg-card border border-border shadow-2xl rounded-2xl flex flex-col items-center text-center gap-4 my-auto min-w-0"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
            title="Close"
          >
            <X size={18} />
          </button>
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
            <Layers size={32} />
          </div>
          <h3 className="text-xl font-bold">This deck is empty</h3>
          <p className="text-sm text-muted-foreground">
            Add cards to &quot;{deck.name}&quot; from your arsenal before starting a play session.
          </p>
          <Button onClick={onClose} className="mt-2 w-full">
            Back to Deck
          </Button>
        </div>
      </div>
    );
  }

  const srsStage = currentCard ? getCardSRSStage(currentCard) : "new";

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-start sm:justify-center p-3 sm:p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200 select-none overflow-y-auto overflow-x-hidden">
      {/* Victory / Completion Screen */}
      {isFinished ? (
        <div
          className="relative w-full max-w-lg p-5 sm:p-8 md:p-10 bg-card border border-border/80 shadow-2xl rounded-2xl flex flex-col items-center text-center gap-4 sm:gap-6 animate-in zoom-in-95 duration-300 my-auto min-w-0"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            title="Close"
          >
            <X size={18} />
          </button>

          <div className="relative">
            <div className="h-16 sm:h-20 w-16 sm:w-20 rounded-full bg-amber-500/15 flex items-center justify-center text-amber-500 shadow-inner">
              <Trophy size={36} className="animate-bounce" />
            </div>
            <Sparkles
              size={22}
              className="absolute -top-2 -right-2 text-amber-400 animate-pulse"
            />
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Session Complete! 🎉
            </h2>
            <p className="text-xs sm:text-sm font-japanese text-primary font-medium">
              お疲れ様でした！ 復習セッションが完了しました。
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground pt-1">
              You reviewed <span className="font-bold text-foreground">{initialTotal}</span> cards in{" "}
              <span className="font-semibold text-foreground">&quot;{deck.name}&quot;</span>.
            </p>
          </div>

          {/* Session SRS Breakdown */}
          <div className="w-full grid grid-cols-4 gap-1.5 sm:gap-2 bg-muted/50 p-2.5 sm:p-3 rounded-xl border border-border/60 text-xs">
            <div className="flex flex-col items-center p-1 min-w-0">
              <span className="text-rose-500 font-bold text-sm sm:text-base">{stats.again}</span>
              <span className="text-muted-foreground text-[10px] sm:text-[11px] truncate">Again</span>
            </div>
            <div className="flex flex-col items-center p-1 min-w-0">
              <span className="text-amber-500 font-bold text-sm sm:text-base">{stats.hard}</span>
              <span className="text-muted-foreground text-[10px] sm:text-[11px] truncate">Hard</span>
            </div>
            <div className="flex flex-col items-center p-1 min-w-0">
              <span className="text-blue-500 font-bold text-sm sm:text-base">{stats.good}</span>
              <span className="text-muted-foreground text-[10px] sm:text-[11px] truncate">Good</span>
            </div>
            <div className="flex flex-col items-center p-1 min-w-0">
              <span className="text-emerald-500 font-bold text-sm sm:text-base">{stats.easy}</span>
              <span className="text-muted-foreground text-[10px] sm:text-[11px] truncate">Easy</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3 w-full pt-1 sm:pt-2">
            <Button
              variant="outline"
              onClick={restartSession}
              className="flex-1 gap-2 h-10 sm:h-11 text-xs sm:text-sm cursor-pointer"
            >
              <RotateCcw size={15} />
              <span>Review Again</span>
            </Button>
            <Button
              onClick={onClose}
              className="flex-1 gap-2 h-10 sm:h-11 text-xs sm:text-sm cursor-pointer"
            >
              <Check size={15} />
              <span>Finish</span>
            </Button>
          </div>
        </div>
      ) : (
        /* Active Card Playing State */
        <div
          className="relative w-full max-w-lg flex flex-col items-center gap-3 sm:gap-5 my-auto min-w-0"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Info Bar */}
          <div className="w-full flex items-center justify-between px-1 text-xs text-muted-foreground gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <span className="font-semibold text-foreground truncate max-w-[110px] sm:max-w-48">
                {deck.name}
              </span>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 shrink-0">
                {queue.length} in session
              </Badge>
              {srsStage === "mastered" ? (
                <Badge className="bg-emerald-600/80 text-[10px] h-4 shrink-0">Mastered</Badge>
              ) : srsStage === "learning" ? (
                <Badge variant="secondary" className="text-[10px] h-4 shrink-0">Learning</Badge>
              ) : srsStage === "review" ? (
                <Badge variant="default" className="text-[10px] h-4 shrink-0">Review</Badge>
              ) : (
                <Badge variant="outline" className="text-muted-foreground text-[10px] h-4 shrink-0">New</Badge>
              )}
            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* TTS Speed Toggle */}
              <div className="flex items-center bg-muted rounded-md p-0.5 text-[10px] font-mono">
                {[0.75, 1.0, 1.25].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => setSpeechRate(rate)}
                    className={`px-1 sm:px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                      speechRate === rate
                        ? "bg-background text-foreground font-bold shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1 text-[10px] sm:text-[11px]">
                <span className="hidden sm:inline">Progress:</span>
                <span className="font-bold text-primary">{completedCount}</span>
                <span>/</span>
                <span>{initialTotal}</span>
              </div>
            </div>
          </div>

          {/* Flashcard Box */}
          <div
            onClick={handleCardFlip}
            className={`relative w-full min-h-[280px] sm:min-h-[360px] p-5 sm:p-8 md:p-10 rounded-2xl border bg-card/95 shadow-2xl transition-all duration-300 flex flex-col justify-between cursor-pointer hover:border-primary/50 group overflow-hidden select-none min-w-0 ${
              isFlipped
                ? "border-primary/40 bg-card/100"
                : "border-border/80"
            }`}
          >
            {/* Top Header: Badge & Streak on Left, Close Button on Right */}
            <div className="flex items-center justify-between gap-2 w-full">
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <Badge
                  variant={isFlipped ? "secondary" : "default"}
                  className="text-[10px] sm:text-[11px] font-medium tracking-wide uppercase"
                >
                  {isFlipped ? "Meaning / Context" : "Prompt (Japanese)"}
                </Badge>

                {currentCard?.repetitions && currentCard.repetitions > 0 ? (
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1 bg-muted/60 px-2 py-0.5 rounded-md shrink-0">
                    <Flame size={12} className="text-amber-500" />
                    Streak: {currentCard.repetitions}
                  </span>
                ) : null}
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="p-1.5 -mr-1.5 -mt-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer shrink-0"
                title="Cancel play (Esc)"
              >
                <X size={18} />
              </button>
            </div>

            {/* Central Content Area */}
            <div className="my-auto flex flex-col items-center justify-center text-center gap-3 sm:gap-4 py-3 sm:py-4 w-full min-w-0">
              {!isFlipped ? (
                /* Japanese Face (Front) */
                <div className="flex flex-col items-center gap-3 sm:gap-4 max-w-full">
                  <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-normal text-foreground font-japanese select-text whitespace-pre-line break-words break-all max-w-full leading-snug">
                    {currentCard?.jpText}
                  </h1>

                  <button
                    type="button"
                    onClick={(e) => handleSpeech(e, currentCard?.jpText || "")}
                    disabled={isPlaying}
                    className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-all cursor-pointer text-xs font-semibold mt-1"
                    title={`Pronounce at ${speechRate}x`}
                  >
                    {isPlaying ? (
                      <VolumeX size={15} className="animate-pulse" />
                    ) : (
                      <Volume2 size={15} />
                    )}
                    <span>Pronounce ({speechRate}x)</span>
                  </button>
                </div>
              ) : (
                /* English Face (Back / Revealed) */
                <div className="flex flex-col items-center gap-2 sm:gap-3 animate-in fade-in duration-200 max-w-full">
                  <div className="flex items-center gap-1.5 text-muted-foreground text-xs sm:text-sm font-japanese font-medium max-w-full">
                    <span className="truncate max-w-[200px] sm:max-w-sm">{currentCard?.jpText}</span>
                    <button
                      type="button"
                      onClick={(e) =>
                        handleSpeech(e, currentCard?.jpText || "")
                      }
                      disabled={isPlaying}
                      className="p-1 rounded-full hover:text-primary hover:bg-primary/10 transition-colors shrink-0"
                      title="Pronounce Japanese"
                    >
                      <Volume2 size={14} />
                    </button>
                  </div>

                  <h1 className="text-xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground select-text whitespace-pre-line break-words break-all max-w-full leading-relaxed">
                    {currentCard?.enText}
                  </h1>
                </div>
              )}
            </div>

            {/* Bottom Flip Hint */}
            <div className="text-center pt-1 sm:pt-2">
              <span className="text-[10px] sm:text-[11px] text-muted-foreground/80 flex items-center justify-center gap-1">
                <span>{isFlipped ? "Tap card to flip back" : "Tap card to reveal answer"}</span>
                <span className="hidden sm:inline-flex items-center gap-1">
                  (or{" "}
                  <kbd className="font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded border border-border/60">
                    Space
                  </kbd>
                  )
                </span>
              </span>
            </div>
          </div>

          {/* Action Buttons: SM-2 Spaced Repetition Ratings */}
          {isFlipped && currentCard ? (
            <div className="w-full grid grid-cols-4 gap-1.5 sm:gap-3 animate-in slide-in-from-bottom-3 duration-200">
              {/* Rating 1: Again */}
              <button
                type="button"
                onClick={() => handleRating(1)}
                className="flex flex-col items-center justify-center py-2 sm:py-2.5 px-0.5 sm:px-1 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 hover:border-rose-500 transition-all cursor-pointer shadow-xs active:scale-95 min-w-0"
              >
                <span className="text-xs sm:text-sm font-bold truncate">Again</span>
                <span className="text-[9px] sm:text-[10px] opacity-80 font-mono mt-0.5 truncate">
                  {formatIntervalPreview(currentCard, 1)}
                </span>
                <span className="text-[8px] sm:text-[9px] opacity-60 font-mono mt-0.5 hidden sm:block">[1]</span>
              </button>

              {/* Rating 2: Hard */}
              <button
                type="button"
                onClick={() => handleRating(2)}
                className="flex flex-col items-center justify-center py-2 sm:py-2.5 px-0.5 sm:px-1 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:border-amber-500 transition-all cursor-pointer shadow-xs active:scale-95 min-w-0"
              >
                <span className="text-xs sm:text-sm font-bold truncate">Hard</span>
                <span className="text-[9px] sm:text-[10px] opacity-80 font-mono mt-0.5 truncate">
                  {formatIntervalPreview(currentCard, 2)}
                </span>
                <span className="text-[8px] sm:text-[9px] opacity-60 font-mono mt-0.5 hidden sm:block">[2]</span>
              </button>

              {/* Rating 3: Good */}
              <button
                type="button"
                onClick={() => handleRating(3)}
                className="flex flex-col items-center justify-center py-2 sm:py-2.5 px-0.5 sm:px-1 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 hover:border-blue-500 transition-all cursor-pointer shadow-xs active:scale-95 min-w-0"
              >
                <span className="text-xs sm:text-sm font-bold truncate">Good</span>
                <span className="text-[9px] sm:text-[10px] opacity-80 font-mono mt-0.5 truncate">
                  {formatIntervalPreview(currentCard, 3)}
                </span>
                <span className="text-[8px] sm:text-[9px] opacity-60 font-mono mt-0.5 hidden sm:block">[3]</span>
              </button>

              {/* Rating 4: Easy */}
              <button
                type="button"
                onClick={() => handleRating(4)}
                className="flex flex-col items-center justify-center py-2 sm:py-2.5 px-0.5 sm:px-1 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:border-emerald-500 transition-all cursor-pointer shadow-xs active:scale-95 min-w-0"
              >
                <span className="text-xs sm:text-sm font-bold truncate">Easy</span>
                <span className="text-[9px] sm:text-[10px] opacity-80 font-mono mt-0.5 truncate">
                  {formatIntervalPreview(currentCard, 4)}
                </span>
                <span className="text-[8px] sm:text-[9px] opacity-60 font-mono mt-0.5 hidden sm:block">[4]</span>
              </button>
            </div>
          ) : (
            <div className="w-full flex items-center justify-center py-1.5 text-[11px] sm:text-xs text-muted-foreground text-center">
              <span>Tap or press Space to reveal translation & SRS ratings</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
