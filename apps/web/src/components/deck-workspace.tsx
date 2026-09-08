"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Deck, Card } from "@nipponic/shared";
import { useFlashCards } from "@/contexts/FlashCardsContext";
import { isCardDue, getCardSRSStage, formatDueTime } from "@/lib/srs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useSpeech } from "@/hooks/use-speech";
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

interface DeckWorkspaceProps {
  deck?: Deck;
}

export function DeckWorkspace({ deck }: DeckWorkspaceProps) {
  const {
    createDeck,
    updateDeck,
    removeCardFromDeck,
    reorderDeckCards,
    startPlayingDeck,
    isCurrentDeckOwner,
    addDeckToMyDecks,
  } = useFlashCards();

  const [filterMode, setFilterMode] = useState<"all" | "due">("all");
  const [isAddCardsModalOpen, setIsAddCardsModalOpen] = useState(false);
  const [isCloning, setIsCloning] = useState(false);
  const [revealedCardIds, setRevealedCardIds] = useState<Set<string>>(
    new Set()
  );

  const dueCards = useMemo(() => {
    if (!deck) return [];
    return deck.cards.filter(isCardDue);
  }, [deck]);

  const displayedCards = useMemo(() => {
    if (!deck) return [];
    if (filterMode === "due") return dueCards;
    return deck.cards;
  }, [deck, filterMode, dueCards]);

  const toggleRevealCard = (id: string) => {
    setRevealedCardIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleMoveCard = (currentIndex: number, direction: "left" | "right") => {
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
  };

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
    <div className="w-full max-w-5xl flex-1 flex flex-col gap-5 sm:gap-6 justify-start p-3.5 sm:p-6 md:p-8 min-w-0 max-w-full overflow-x-hidden">
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
                onToggleReveal={() => toggleRevealCard(card.id)}
                onMoveLeft={() => handleMoveCard(index, "left")}
                onMoveRight={() => handleMoveCard(index, "right")}
                onRemove={() => removeCardFromDeck(deck.id, card.id)}
              />
            );
          })}
        </div>
      )}

      {/* Add Cards to Deck Modal */}
      {isCurrentDeckOwner && (
        <AddCardsModal
          deck={deck}
          isOpen={isAddCardsModalOpen}
          onClose={() => setIsAddCardsModalOpen(false)}
        />
      )}
    </div>
  );
}

function DeckCardGridItem({
  card,
  index,
  total,
  isRevealed,
  isOwner = true,
  onToggleReveal,
  onMoveLeft,
  onMoveRight,
  onRemove,
}: {
  card: Card;
  index: number;
  total: number;
  isRevealed: boolean;
  isOwner?: boolean;
  onToggleReveal: () => void;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onRemove: () => void;
}) {
  const { speak, isPlaying } = useSpeech();
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
              onClick={onMoveLeft}
              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              title="Move left/up"
            >
              <ArrowLeft size={13} />
            </button>
            <button
              type="button"
              disabled={index === total - 1}
              onClick={onMoveRight}
              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              title="Move right/down"
            >
              <ArrowRight size={13} />
            </button>
            <button
              type="button"
              onClick={onRemove}
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
            onClick={() => speak(card.jpText, "ja-JP")}
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
          onClick={onToggleReveal}
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
}

function AddCardsModal({
  deck,
  isOpen,
  onClose,
}: {
  deck: Deck;
  isOpen: boolean;
  onClose: () => void;
}) {
  const { cards, addCardsToDeck, createCard } = useFlashCards();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCardIds, setSelectedCardIds] = useState<Set<string>>(
    new Set()
  );

  // Quick Card Creation Form State
  const [isCreatingQuickCard, setIsCreatingQuickCard] = useState(false);
  const [newJpText, setNewJpText] = useState("");
  const [newEnText, setNewEnText] = useState("");

  const prevIsOpenRef = useRef(false);
  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      setSearchQuery("");
      setSelectedCardIds(new Set());
      setIsCreatingQuickCard(false);
      setNewJpText("");
      setNewEnText("");
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen]);

  const existingDeckCardIds = new Set(deck.cards.map((c) => c.id));

  const toggleSelectCard = (id: string) => {
    setSelectedCardIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleAddSelected = async () => {
    if (selectedCardIds.size === 0) return;
    await addCardsToDeck(deck.id, Array.from(selectedCardIds));
    setSelectedCardIds(new Set());
    onClose();
  };

  const handleCreateAndAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJpText.trim() || !newEnText.trim()) return;

    const created = await createCard({
      jpText: newJpText.trim(),
      enText: newEnText.trim(),
    });

    if (created) {
      await addCardsToDeck(deck.id, [created.id]);
      setNewJpText("");
      setNewEnText("");
      setIsCreatingQuickCard(false);
      onClose();
    }
  };

  const filteredCards = cards.filter((card) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      card.jpText.toLowerCase().includes(q) ||
      card.enText.toLowerCase().includes(q)
    );
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[calc(100vw-1.5rem)] sm:max-w-2xl max-h-[85vh] p-0 flex flex-col gap-0 border-border/80 overflow-hidden">
        <DialogHeader className="p-4 sm:p-5 pb-3 border-b border-border/70">
          <div className="flex items-center justify-between gap-2">
            <div>
              <DialogTitle className="text-sm sm:text-lg font-bold truncate max-w-[200px] sm:max-w-md">
                Add Cards to &quot;{deck.name}&quot;
              </DialogTitle>
              <DialogDescription className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                Select cards from your arsenal or create a new card to insert into
                this deck.
              </DialogDescription>
            </div>
            <Button
              type="button"
              variant={isCreatingQuickCard ? "secondary" : "outline"}
              size="sm"
              onClick={() => setIsCreatingQuickCard((prev) => !prev)}
              className="text-xs gap-1.5 h-8 cursor-pointer shrink-0"
            >
              <Sparkles size={13} />
              <span className="hidden sm:inline">{isCreatingQuickCard ? "Show Arsenal" : "Create New Card"}</span>
              <span className="sm:hidden">{isCreatingQuickCard ? "Arsenal" : "New Card"}</span>
            </Button>
          </div>
        </DialogHeader>

        {isCreatingQuickCard ? (
          /* Quick Card Creation Form */
          <form
            onSubmit={handleCreateAndAdd}
            className="p-4 sm:p-6 flex flex-col gap-4 overflow-y-auto"
          >
            <div className="space-y-1.5">
              <Label htmlFor="quick-jp-text" className="text-xs font-semibold">
                Japanese Text (Card Front)
              </Label>
              <Input
                id="quick-jp-text"
                placeholder="e.g. 勉強 (べんきょう)"
                value={newJpText}
                onChange={(e) => setNewJpText(e.target.value)}
                required
                className="text-sm font-japanese"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="quick-en-text" className="text-xs font-semibold">
                English Translation (Card Back)
              </Label>
              <Input
                id="quick-en-text"
                placeholder="e.g. Study / diligence"
                value={newEnText}
                onChange={(e) => setNewEnText(e.target.value)}
                required
                className="text-sm"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCreatingQuickCard(false)}
                className="text-xs h-8 px-3"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={!newJpText.trim() || !newEnText.trim()}
                className="text-xs gap-1.5 h-8 px-3"
              >
                <Plus size={14} />
                Create & Add to Deck
              </Button>
            </div>
          </form>
        ) : (
          /* Arsenal Selection List */
          <div className="flex-1 flex flex-col min-h-0 p-3.5 sm:p-5 gap-3">
            {/* Search Input */}
            <div className="relative w-full">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              />
              <Input
                type="text"
                placeholder="Search arsenal cards by Japanese or English..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 pr-7 text-xs rounded-md bg-muted/30 border-border/70"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Cards List */}
            <div className="flex-1 overflow-y-auto space-y-2 min-h-48 max-h-72 pr-1">
              {filteredCards.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground border border-dashed rounded-lg flex flex-col items-center gap-2">
                  <Layers size={22} className="text-muted-foreground/60" />
                  <span>
                    {searchQuery.trim()
                      ? `No cards found matching "${searchQuery}"`
                      : "Your arsenal is currently empty. Click 'Create New Card' above to start adding cards."}
                  </span>
                </div>
              ) : (
                filteredCards.map((card) => {
                  const isAlreadyInDeck = existingDeckCardIds.has(card.id);
                  const isSelected = selectedCardIds.has(card.id);

                  return (
                    <div
                      key={card.id}
                      onClick={() => {
                        if (!isAlreadyInDeck) toggleSelectCard(card.id);
                      }}
                      className={`flex items-center justify-between p-2.5 sm:p-3 rounded-lg border transition-all text-xs select-none ${
                        isAlreadyInDeck
                          ? "bg-muted/40 border-border/40 opacity-60 cursor-not-allowed"
                          : isSelected
                            ? "bg-primary/10 border-primary cursor-pointer shadow-2xs"
                            : "bg-card hover:bg-muted/20 hover:border-border cursor-pointer"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 sm:gap-3 overflow-hidden min-w-0">
                        <div
                          className={`h-4 w-4 rounded flex items-center justify-center border transition-colors shrink-0 ${
                            isAlreadyInDeck
                              ? "bg-muted border-border"
                              : isSelected
                                ? "bg-primary border-primary text-primary-foreground"
                                : "border-muted-foreground/40 bg-background"
                          }`}
                        >
                          {(isSelected || isAlreadyInDeck) && (
                            <Check size={11} strokeWidth={3} />
                          )}
                        </div>

                        <div className="flex items-center gap-2 overflow-hidden truncate min-w-0">
                          <span className="font-bold text-foreground font-japanese shrink-0">
                            {card.jpText}
                          </span>
                          <span className="text-muted-foreground font-mono shrink-0">
                            →
                          </span>
                          <span className="text-muted-foreground truncate max-w-[140px] sm:max-w-xs">
                            {card.enText}
                          </span>
                        </div>
                      </div>

                      {isAlreadyInDeck && (
                        <Badge variant="outline" className="text-[10px] py-0 shrink-0 ml-2">
                          In Deck
                        </Badge>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-border/70 text-xs">
              <span className="text-muted-foreground">
                {selectedCardIds.size} {selectedCardIds.size === 1 ? "card" : "cards"} selected
              </span>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  className="h-8 px-3 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={selectedCardIds.size === 0}
                  onClick={handleAddSelected}
                  className="h-8 px-3 text-xs gap-1.5"
                >
                  <Plus size={14} />
                  <span>Add Selected</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
