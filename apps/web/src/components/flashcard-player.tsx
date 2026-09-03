"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, Deck } from "@nipponic/shared";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSpeech } from "@/hooks/use-speech";
import confetti from "canvas-confetti";
import {
  Volume2,
  X,
  Check,
  RotateCcw,
  Sparkles,
  Trophy,
  Layers,
} from "lucide-react";

interface FlashcardPlayerProps {
  deck: Deck;
  onClose: () => void;
}

export function FlashcardPlayer({ deck, onClose }: FlashcardPlayerProps) {
  const [queue, setQueue] = useState<Card[]>(() => [...deck.cards]);
  const [initialTotal] = useState<number>(deck.cards.length);
  const [completedCount, setCompletedCount] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [isFinished, setIsFinished] = useState<boolean>(deck.cards.length === 0);

  const { speak, isPlaying } = useSpeech();

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

  const handleRight = useCallback(() => {
    if (!isFlipped || !currentCard) return;

    const nextQueue = queue.slice(1);
    setCompletedCount((prev) => prev + 1);
    setIsFlipped(false);

    if (nextQueue.length === 0) {
      setQueue([]);
      setIsFinished(true);
      triggerConfetti();
    } else {
      setQueue(nextQueue);
    }
  }, [isFlipped, currentCard, queue, triggerConfetti]);

  const handleWrong = useCallback(() => {
    if (!isFlipped || !currentCard) return;

    // Move current card to the end of the queue
    const nextQueue = [...queue.slice(1), currentCard];
    setIsFlipped(false);
    setQueue(nextQueue);
  }, [isFlipped, currentCard, queue]);

  const restartSession = () => {
    setQueue([...deck.cards]);
    setCompletedCount(0);
    setIsFlipped(false);
    setIsFinished(deck.cards.length === 0);
  };

  const handleSpeech = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    speak(text, "ja-JP");
  };

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        if (!isFinished && currentCard) {
          handleCardFlip();
        }
      } else if (e.key === "1" || e.key === "ArrowLeft") {
        if (isFlipped && !isFinished) {
          e.preventDefault();
          handleWrong();
        }
      } else if (e.key === "2" || e.key === "ArrowRight") {
        if (isFlipped && !isFinished) {
          e.preventDefault();
          handleRight();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFlipped, isFinished, currentCard, handleRight, handleWrong, onClose]);

  // If the deck is completely empty
  if (deck.cards.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
        <div
          className="relative w-full max-w-md p-8 bg-card border border-border shadow-2xl rounded-2xl flex flex-col items-center text-center gap-4"
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
            Add cards to &quot;{deck.name}&quot; from your arsenal before starting a play
            session.
          </p>
          <Button onClick={onClose} className="mt-2 w-full">
            Back to Deck
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200 select-none">
      {/* Victory / Completion Screen */}
      {isFinished ? (
        <div
          className="relative w-full max-w-lg p-8 sm:p-10 bg-card border border-border/80 shadow-2xl rounded-2xl flex flex-col items-center text-center gap-6 animate-in zoom-in-95 duration-300"
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
            <div className="h-20 w-20 rounded-full bg-amber-500/15 flex items-center justify-center text-amber-500 shadow-inner">
              <Trophy size={40} className="animate-bounce" />
            </div>
            <Sparkles
              size={24}
              className="absolute -top-2 -right-2 text-amber-400 animate-pulse"
            />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Congratulations! 🎉
            </h2>
            <p className="text-xs sm:text-sm font-japanese text-primary font-medium">
              おめでとうございます！ すべてのカードを完了しました！
            </p>
            <p className="text-sm text-muted-foreground pt-1">
              You&apos;ve completed all <span className="font-bold text-foreground">{initialTotal}</span> cards in{" "}
              <span className="font-semibold text-foreground">&quot;{deck.name}&quot;</span>.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full pt-2">
            <Button
              variant="outline"
              onClick={restartSession}
              className="flex-1 gap-2 h-11 cursor-pointer"
            >
              <RotateCcw size={16} />
              Practice Again
            </Button>
            <Button
              onClick={onClose}
              className="flex-1 gap-2 h-11 cursor-pointer"
            >
              <Check size={16} />
              Finish
            </Button>
          </div>
        </div>
      ) : (
        /* Active Card Playing State */
        <div
          className="relative w-full max-w-lg flex flex-col items-center gap-5"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Info Bar */}
          <div className="w-full flex items-center justify-between px-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground truncate max-w-48">
                {deck.name}
              </span>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                {queue.length} left
              </Badge>
            </div>
            <div className="flex items-center gap-1.5 text-[11px]">
              <span>Completed:</span>
              <span className="font-bold text-primary">{completedCount}</span>
              <span>/</span>
              <span>{initialTotal}</span>
            </div>
          </div>

          {/* Flashcard Box */}
          <div
            onClick={handleCardFlip}
            className={`relative w-full min-h-[340px] sm:min-h-[380px] p-8 sm:p-10 rounded-2xl border bg-card/95 shadow-2xl transition-all duration-300 flex flex-col justify-between cursor-pointer hover:border-primary/50 group ${
              isFlipped
                ? "border-primary/40 bg-card/100"
                : "border-border/80"
            }`}
          >
            {/* Top Right Close 'X' Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="absolute top-4 right-4 p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer z-10"
              title="Cancel play"
            >
              <X size={18} />
            </button>

            {/* Top Side Badge */}
            <div className="flex items-center gap-2">
              <Badge
                variant={isFlipped ? "secondary" : "default"}
                className="text-[11px] font-medium tracking-wide uppercase"
              >
                {isFlipped ? "Meaning (English)" : "Question (Japanese)"}
              </Badge>
            </div>

            {/* Central Content Area */}
            <div className="my-auto flex flex-col items-center justify-center text-center gap-4 py-4">
              {!isFlipped ? (
                /* Japanese Face (Front) */
                <div className="flex flex-col items-center gap-4">
                  <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-normal text-foreground font-japanese select-text">
                    {currentCard?.jpText}
                  </h1>

                  <button
                    type="button"
                    onClick={(e) => handleSpeech(e, currentCard?.jpText || "")}
                    disabled={isPlaying}
                    className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-all cursor-pointer text-xs font-semibold mt-1"
                    title="Pronounce Japanese"
                  >
                    <Volume2
                      size={16}
                      className={isPlaying ? "animate-pulse" : ""}
                    />
                    <span>Pronounce</span>
                  </button>
                </div>
              ) : (
                /* English Face (Back / Revealed) */
                <div className="flex flex-col items-center gap-3 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm font-japanese font-medium">
                    <span>{currentCard?.jpText}</span>
                    <button
                      type="button"
                      onClick={(e) =>
                        handleSpeech(e, currentCard?.jpText || "")
                      }
                      disabled={isPlaying}
                      className="p-1 rounded-full hover:text-primary hover:bg-primary/10 transition-colors"
                      title="Pronounce Japanese"
                    >
                      <Volume2 size={14} />
                    </button>
                  </div>

                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground select-text">
                    {currentCard?.enText}
                  </h1>
                </div>
              )}
            </div>

            {/* Bottom Flip Hint */}
            <div className="text-center pt-2">
              <span className="text-[11px] text-muted-foreground/80 flex items-center justify-center gap-1">
                <span>{isFlipped ? "Click card to flip back" : "Click card to reveal answer"}</span>
                <span className="font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded border border-border/60">
                  Space
                </span>
              </span>
            </div>
          </div>

          {/* Action Buttons (Rendered below card when revealed) */}
          {isFlipped ? (
            <div className="w-full grid grid-cols-2 gap-3.5 animate-in slide-in-from-bottom-3 duration-200">
              <Button
                type="button"
                variant="destructive"
                onClick={handleWrong}
                className="h-12 text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-md hover:opacity-95"
              >
                <X size={18} />
                <span>Wrong (Repeat)</span>
                <span className="text-[10px] opacity-75 font-mono ml-1 bg-black/20 px-1 py-0.5 rounded">
                  1 / ←
                </span>
              </Button>

              <Button
                type="button"
                onClick={handleRight}
                className="h-12 text-sm font-semibold flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-md"
              >
                <Check size={18} />
                <span>Right (Got it)</span>
                <span className="text-[10px] opacity-75 font-mono ml-1 bg-black/20 px-1 py-0.5 rounded">
                  2 / →
                </span>
              </Button>
            </div>
          ) : (
            <div className="w-full flex items-center justify-center py-2 text-xs text-muted-foreground">
              <span>Press <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border/60 font-mono text-[10px]">Space</kbd> or click the card to reveal translation</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
