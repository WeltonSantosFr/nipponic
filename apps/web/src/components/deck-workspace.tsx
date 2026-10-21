"use client";

import { useState, useMemo, useRef, useEffect, memo, useCallback } from "react";
import dynamic from "next/dynamic";
import { Deck, Card, DeckCardFilterMode, DeckWorkspaceProps } from "@nipponic/shared";
import { useFlashCards } from "@/contexts/FlashCardsContext";
import { isCardDue, getCardSRSStage, formatDueTime } from "@/lib/srs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useSpeech } from "@/hooks/use-speech";
import { OfflineIndicator } from "@/components/offline-indicator";

const AddCardsModal = dynamic(
  () => import("@/components/add-cards-modal").then((mod) => mod.AddCardsModal),
  { ssr: false }
);
import {
  Layers,
  Play,
  Plus,
  Trash2,
  Volume2,
  Search,
  X,
  Check,
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
  Zap,
  Clock,
  Flame,
  Globe,
  Loader2,
} from "lucide-react";

export type { DeckCardFilterMode, DeckWorkspaceProps };

export function DeckWorkspace({ deck }: DeckWorkspaceProps) {
  const {
    decks,
    createDeck,
    updateDeck,
    removeCardFromDeck,
    reorderDeckCards,
    startPlayingDeck,
    isCurrentDeckOwner,
    addDeckToMyDecks,
  } = useFlashCards();

  const { speak, isPlaying } = useSpeech();

  const [filterMode, setFilterMode] = useState<DeckCardFilterMode>("all");
  const [isAddCardsModalOpen, setIsAddCardsModalOpen] = useState(false);
  const [isCloning, setIsCloning] = useState(false);
  const [revealedCardIds, setRevealedCardIds] = useState<Set<string>>(
    new Set()
  );

  const isAlreadyAdded = useMemo(() => {
    if (isCurrentDeckOwner || !deck) return false;
    const normalize = (n: string) =>
      n
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\bbasico\b/g, "basic")
        .replace(/\bavancado\b/g, "advanced");
    const target = normalize(deck.name);
    return decks.some((myDeck) => normalize(myDeck.name) === target);
  }, [isCurrentDeckOwner, deck, decks]);

  const dueCards = useMemo(() => {
    if (!deck) return [];
    return deck.cards.filter(isCardDue);
  }, [deck]);

  const displayedCards = useMemo(() => {
    if (!deck) return [];
    if (filterMode === "due") return dueCards;
    return deck.cards;
  }, [deck, filterMode, dueCards]);

  const toggleRevealCard = useCallback((id: string) => {
    setRevealedCardIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleMoveCard = useCallback(
    (currentIndex: number, direction: "left" | "right") => {
      if (!deck || !isCurrentDeckOwner) return;
      const targetIndex =
        direction === "left" ? currentIndex - 1 : currentIndex + 1;
      if (targetIndex < 0 || targetIndex >= deck.cards.length) return;

      const newCards = [...deck.cards];
      const [movedCard] = newCards.splice(currentIndex, 1);
      if (movedCard) {
        newCards.splice(targetIndex, 0, movedCard);
        reorderDeckCards(
          deck.id,
          newCards.map((c) => c.id)
        );
      }
    },
    [deck, isCurrentDeckOwner, reorderDeckCards]
  );

  const handleRemoveCard = useCallback(
    (cardId: string) => {
      if (!deck || !isCurrentDeckOwner) return;
      removeCardFromDeck(deck.id, cardId);
    },
    [deck, isCurrentDeckOwner, removeCardFromDeck]
  );

  const handlePlayDue = () => {
    if (!deck || dueCards.length === 0) return;
    startPlayingDeck({
      ...deck,
      cards: dueCards,
    });
  };

  if (!deck) {
    return (
      <div className="flex-1 p-8 flex flex-col items-center justify-center">
        <div className="w-full max-w-md text-center p-8 bg-card border rounded-xl shadow-xs flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Layers className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold">No deck selected</h3>
            <p className="text-xs text-muted-foreground">
              Select a deck from the sidebar or create a new pack to start
              reviewing your flashcards.
            </p>
          </div>
          <Button
            onClick={() => createDeck("New Deck")}
            className="w-full gap-1.5 cursor-pointer"
          >
            <Plus size={16} />
            Create New Deck
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl flex-1 flex flex-col gap-5 sm:gap-6 justify-start p-3.5 sm:p-6 md:p-8 min-w-0 max-w-full overflow-x-hidden pb-safe">
      {/* Deck Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="space-y-1 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {isCurrentDeckOwner ? (
              <>
                <input
                  type="text"
                  value={deck.name}
                  onChange={(e) => updateDeck(deck.id, { name: e.target.value })}
                  className="text-xl sm:text-3xl font-bold bg-transparent outline-none tracking-tight text-foreground border-b border-transparent focus:border-border pb-0.5 w-full sm:w-auto max-w-md truncate"
                  placeholder="Deck name..."
                />
                {/* Public / Private Eye Toggle Button */}
                <button
                  type="button"
                  onClick={() => updateDeck(deck.id, { isPublic: !deck.isPublic })}
                  className={`p-1.5 rounded-md border transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-medium shrink-0 ${
                    deck.isPublic
                      ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 hover:bg-blue-500/20"
                      : "bg-muted/80 text-muted-foreground border-border hover:text-foreground hover:bg-muted"
                  }`}
                  title={
                    deck.isPublic
                      ? "Public Deck: visible in Public Decks to all users (Click to make Private)"
                      : "Private Deck: only visible to you (Click to make Public)"
                  }
                >
                  {deck.isPublic ? (
                    <Eye size={14} className="text-blue-500" />
                  ) : (
                    <EyeOff size={14} />
                  )}
                  <span>{deck.isPublic ? "Public" : "Private"}</span>
                </button>
              </>
            ) : (
              <>
                <h1 className="text-xl sm:text-3xl font-bold tracking-tight text-foreground truncate max-w-md">
                  {deck.name}
                </h1>
                <Badge
                  variant="outline"
                  className="text-xs font-medium text-primary border-primary/30 bg-primary/5 shrink-0"
                >
                  {deck.id.startsWith("app-deck-") ? "App Deck" : "Public Deck"}
                </Badge>
              </>
            )}

            <Badge variant="secondary" className="text-xs font-semibold shrink-0">
              {deck.cards.length} {deck.cards.length === 1 ? "card" : "cards"}
            </Badge>
            {isCurrentDeckOwner && dueCards.length > 0 && (
              <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 text-xs font-semibold shrink-0 gap-1">
                <Zap size={12} />
                {dueCards.length} due
              </Badge>
            )}
            <OfflineIndicator />
          </div>
          <p className="text-xs text-muted-foreground">
            {isCurrentDeckOwner
              ? "Spaced Repetition System (SRS) active. Review due cards daily to lock memories into long-term retention."
              : "Preview this deck and add it to your personal collection to study with Spaced Repetition."}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap w-full sm:w-auto">
          {isCurrentDeckOwner ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAddCardsModalOpen(true)}
                className="gap-1.5 h-9 text-xs cursor-pointer flex-1 sm:flex-none justify-center"
              >
                <Plus size={14} />
                <span>Add Cards</span>
              </Button>

              {dueCards.length > 0 && (
                <Button
                  size="sm"
                  onClick={handlePlayDue}
                  className="gap-1.5 h-9 text-xs font-semibold px-3 bg-amber-600 hover:bg-amber-700 text-white cursor-pointer shadow-sm flex-1 sm:flex-none justify-center"
                  title="Review only cards that are due for study today"
                >
                  <Zap size={14} className="fill-current" />
                  <span>Review Due ({dueCards.length})</span>
                </Button>
              )}

              <Button
                size="sm"
                variant={dueCards.length > 0 ? "outline" : "default"}
                disabled={deck.cards.length === 0}
                onClick={() => startPlayingDeck(deck)}
                className="gap-2 h-9 text-xs font-semibold px-4 cursor-pointer shadow-sm flex-1 sm:flex-none justify-center"
              >
                <Play size={15} className="fill-current" />
                <span>Play All ({deck.cards.length})</span>
              </Button>
            </>
          ) : isAlreadyAdded ? (
            <Button
              size="sm"
              variant="outline"
              disabled
              className="gap-1.5 h-9 text-xs font-semibold px-3 opacity-90 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 w-full sm:w-auto justify-center cursor-default"
            >
              <Check size={14} />
              <span>Added to My Decks</span>
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={async () => {
                setIsCloning(true);
                await addDeckToMyDecks(deck);
                setIsCloning(false);
              }}
              disabled={isCloning}
              className="gap-2 h-9 text-xs font-semibold px-4 cursor-pointer shadow-sm w-full sm:w-auto justify-center"
            >
              {isCloning ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Plus size={15} />
              )}
              <span>Add to my Decks</span>
            </Button>
          )}
        </div>
      </div>

      {/* Filter Tabs & Stats Bar */}
      <div className="flex items-center justify-between gap-4 border-b pb-3 flex-wrap">
        <div className="flex items-center bg-muted p-1 rounded-lg text-xs w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setFilterMode("all")}
            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer text-center ${
              filterMode === "all"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All Cards ({deck.cards.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode("due")}
            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer flex items-center justify-center gap-1.5 text-center ${
              filterMode === "due"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Zap size={13} className={dueCards.length > 0 ? "text-amber-500 shrink-0" : "shrink-0"} />
            <span>Due for Review</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              dueCards.length > 0 ? "bg-amber-500 text-white" : "bg-muted-foreground/20 text-muted-foreground"
            }`}>
              {dueCards.length}
            </span>
          </button>
        </div>

        <div className="text-xs text-muted-foreground hidden sm:block">
          Showing <span className="font-medium text-foreground">{displayedCards.length}</span> cards
        </div>
      </div>

      {/* Grid of Cards */}
      {displayedCards.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 sm:p-12 text-center border border-dashed rounded-xl gap-3 text-muted-foreground">
          <Layers size={36} className="text-muted-foreground/60" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">
              {filterMode === "due"
                ? "All caught up! 🎉 No cards due for review."
                : "No cards in this deck yet"}
            </p>
            <p className="text-xs text-muted-foreground max-w-sm">
              {filterMode === "due"
                ? "Great job! You've completed all scheduled repetitions for today."
                : "Add flashcards from your arsenal to start reviewing with this deck."}
            </p>
          </div>
          {filterMode === "all" ? (
            <Button
              size="sm"
              onClick={() => setIsAddCardsModalOpen(true)}
              className="gap-1.5 text-xs cursor-pointer mt-2"
            >
              <Plus size={14} />
              Add Cards from Arsenal
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setFilterMode("all")}
              className="text-xs cursor-pointer mt-2"
            >
              View All Cards
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 auto-rows-fr w-full min-w-0">
          {displayedCards.map((card, index) => {
            const isRevealed = revealedCardIds.has(card.id);
            return (
              <DeckCardGridItem
                key={card.id}
                card={card}
                index={index}
                total={displayedCards.length}
                isRevealed={isRevealed}
                isOwner={isCurrentDeckOwner}
                isPlaying={isPlaying}
                onSpeak={speak}
                onToggleReveal={toggleRevealCard}
                onMoveCard={handleMoveCard}
                onRemoveCard={handleRemoveCard}
              />
            );
          })}
        </div>
      )}

      {/* Add Cards to Deck Modal */}
      {isCurrentDeckOwner && isAddCardsModalOpen && (
        <AddCardsModal
          deck={deck}
          isOpen={isAddCardsModalOpen}
          onClose={() => setIsAddCardsModalOpen(false)}
        />
      )}
    </div>
  );
}

export const DeckCardGridItem = memo(function DeckCardGridItem({
  card,
  index,
  total,
  isRevealed,
  isOwner = true,
  isPlaying = false,
  onSpeak,
  onToggleReveal,
  onMoveCard,
  onRemoveCard,
}: {
  card: Card;
  index: number;
  total: number;
  isRevealed: boolean;
  isOwner?: boolean;
  isPlaying?: boolean;
  onSpeak: (text: string, lang: "en-US" | "ja-JP") => Promise<void> | void;
  onToggleReveal: (id: string) => void;
  onMoveCard: (index: number, direction: "left" | "right") => void;
  onRemoveCard: (id: string) => void;
}) {
  const isDue = isCardDue(card);
  const srsStage = getCardSRSStage(card);

  return (
    <div className={`group relative bg-card border transition-all rounded-xl p-3.5 sm:p-4.5 flex flex-col justify-between gap-3 shadow-xs hover:shadow-md w-full min-w-0 overflow-hidden ${
      isDue ? "border-amber-500/40 bg-amber-500/[0.02]" : "border-border/80 hover:border-primary/50"
    }`}>
      {/* Top Header Row of Card */}
      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[11px] opacity-70">#{index + 1}</span>
          {isDue ? (
            <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px] py-0 h-4 gap-0.5">
              <Zap size={10} />
              Due
            </Badge>
          ) : srsStage === "mastered" ? (
            <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] py-0 h-4">
              Mastered
            </Badge>
          ) : (
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              <Clock size={10} />
              {formatDueTime(card.nextReviewAt)}
            </span>
          )}
        </div>

        {isOwner && (
          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
            {/* Reorder Buttons */}
            <button
              type="button"
              disabled={index === 0}
              onClick={() => onMoveCard(index, "left")}
              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              title="Move left/up"
            >
              <ArrowLeft size={13} />
            </button>
            <button
              type="button"
              disabled={index === total - 1}
              onClick={() => onMoveCard(index, "right")}
              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              title="Move right/down"
            >
              <ArrowRight size={13} />
            </button>
            <button
              type="button"
              onClick={() => onRemoveCard(card.id)}
              className="p-1 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors cursor-pointer ml-1"
              title="Remove from deck"
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>

      {/* Main Face (Japanese always face up) */}
      <div className="my-auto flex flex-col items-center text-center gap-2 py-2 w-full min-w-0">
        <div className="flex items-center justify-center gap-2 max-w-full">
          <span className="text-lg sm:text-2xl font-bold font-japanese text-foreground tracking-wide select-text whitespace-pre-line break-words break-all max-w-full">
            {card.jpText}
          </span>
          <button
            type="button"
            onClick={() => onSpeak(card.jpText, "ja-JP")}
            disabled={isPlaying}
            className="p-1 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer shrink-0"
            title="Listen to pronunciation"
          >
            <Volume2 size={15} />
          </button>
        </div>

        {/* Translation Preview (Revealable) */}
        {isRevealed ? (
          <div className="pt-2 text-xs font-semibold text-primary animate-in fade-in duration-150 whitespace-pre-line break-words break-all max-w-full">
            {card.enText}
          </div>
        ) : (
          <div className="pt-2 text-[11px] text-muted-foreground/60 italic">
            Click eye to preview English
          </div>
        )}
      </div>

      {/* Footer / Toggle Reveal and Stats */}
      <div className="flex items-center justify-between border-t border-border/40 pt-2 text-[11px] text-muted-foreground">
        <button
          type="button"
          onClick={() => onToggleReveal(card.id)}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          {isRevealed ? (
            <>
              <EyeOff size={13} />
              <span>Hide translation</span>
            </>
          ) : (
            <>
              <Eye size={13} />
              <span>Reveal translation</span>
            </>
          )}
        </button>

        {card.repetitions ? (
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
            <Flame size={11} className="text-amber-500" />
            {card.repetitions} rep{card.repetitions > 1 ? "s" : ""}
          </span>
        ) : null}
      </div>
    </div>
  );
});

