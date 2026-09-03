"use client";

import { useState } from "react";
import { Deck, Card } from "@nipponic/shared";
import { useFlashCards } from "@/contexts/FlashCardsContext";
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
  } = useFlashCards();

  const [isAddCardsModalOpen, setIsAddCardsModalOpen] = useState(false);
  const [revealedCardIds, setRevealedCardIds] = useState<Set<string>>(
    new Set()
  );

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
    if (!deck) return;
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
    <div className="w-full max-w-5xl flex-1 flex flex-col gap-6 justify-start p-6 md:p-8">
      {/* Deck Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1 flex-1">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={deck.name}
              onChange={(e) => updateDeck(deck.id, { name: e.target.value })}
              className="text-2xl sm:text-3xl font-bold bg-transparent outline-none tracking-tight text-foreground border-b border-transparent focus:border-border pb-0.5 max-w-md truncate"
              placeholder="Deck name..."
            />
            <Badge variant="secondary" className="text-xs font-semibold shrink-0">
              {deck.cards.length} {deck.cards.length === 1 ? "card" : "cards"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Cards always face Japanese side up. Reorder, practice, or manage deck
            cards below.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddCardsModalOpen(true)}
            className="gap-1.5 h-9 text-xs cursor-pointer"
          >
            <Plus size={14} />
            Add Cards
          </Button>

          <Button
            size="sm"
            disabled={deck.cards.length === 0}
            onClick={() => startPlayingDeck(deck)}
            className="gap-2 h-9 text-xs font-semibold px-4 cursor-pointer shadow-sm"
          >
            <Play size={15} className="fill-current" />
            Play Deck
          </Button>
        </div>
      </div>

      <Separator />

      {/* Grid of Cards */}
      {deck.cards.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center border border-dashed rounded-xl gap-3 text-muted-foreground">
          <Layers size={36} className="text-muted-foreground/60" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">
              No cards in this deck yet
            </p>
            <p className="text-xs text-muted-foreground max-w-sm">
              Add flashcards from your arsenal to start reviewing with this deck.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setIsAddCardsModalOpen(true)}
            className="gap-1.5 text-xs cursor-pointer mt-2"
          >
            <Plus size={14} />
            Add Cards from Arsenal
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr">
          {deck.cards.map((card, index) => {
            const isRevealed = revealedCardIds.has(card.id);
            return (
              <DeckCardGridItem
                key={card.id}
                card={card}
                index={index}
                total={deck.cards.length}
                isRevealed={isRevealed}
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
      <AddCardsModal
        deck={deck}
        isOpen={isAddCardsModalOpen}
        onClose={() => setIsAddCardsModalOpen(false)}
      />
    </div>
  );
}

function DeckCardGridItem({
  card,
  index,
  total,
  isRevealed,
  onToggleReveal,
  onMoveLeft,
  onMoveRight,
  onRemove,
}: {
  card: Card;
  index: number;
  total: number;
  isRevealed: boolean;
  onToggleReveal: () => void;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onRemove: () => void;
}) {
  const { speak, isPlaying } = useSpeech();

  return (
    <div className="group relative bg-card border border-border/80 hover:border-primary/50 transition-all rounded-xl p-4.5 flex flex-col justify-between gap-3 shadow-xs hover:shadow-md">
      {/* Top Header Row of Card */}
      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="font-mono text-[11px] opacity-70">#{index + 1}</span>

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
      </div>

      {/* Main Face (Japanese always face up) */}
      <div className="my-auto flex flex-col items-center text-center gap-2 py-2">
        <div className="flex items-center justify-center gap-2">
          <span className="text-xl sm:text-2xl font-bold font-japanese text-foreground tracking-wide">
            {card.jpText}
          </span>
          <button
            type="button"
            onClick={() => speak(card.jpText, "ja-JP")}
            disabled={isPlaying}
            className="p-1 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
            title="Listen to pronunciation"
          >
            <Volume2 size={15} />
          </button>
        </div>

        {/* Translation Preview (Revealable) */}
        {isRevealed ? (
          <div className="pt-2 text-xs font-semibold text-primary animate-in fade-in duration-150">
            {card.enText}
          </div>
        ) : (
          <div className="pt-2 text-[11px] text-muted-foreground/60 italic">
            Click eye to preview English
          </div>
        )}
      </div>

      {/* Footer / Toggle Reveal */}
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
      <DialogContent className="sm:max-w-2xl max-h-[85vh] p-0 flex flex-col gap-0 border-border/80 overflow-hidden">
        <DialogHeader className="p-5 pb-3 border-b border-border/70">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-base sm:text-lg font-bold">
                Add Cards to &quot;{deck.name}&quot;
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
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
              {isCreatingQuickCard ? "Show Arsenal" : "Create New Card"}
            </Button>
          </div>
        </DialogHeader>

        {isCreatingQuickCard ? (
          /* Quick Card Creation Form */
          <form
            onSubmit={handleCreateAndAdd}
            className="p-6 flex flex-col gap-4 overflow-y-auto"
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
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={!newJpText.trim() || !newEnText.trim()}
                className="text-xs gap-1.5"
              >
                <Plus size={14} />
                Create & Add to Deck
              </Button>
            </div>
          </form>
        ) : (
          /* Arsenal Selection List */
          <div className="flex-1 flex flex-col min-h-0 p-5 gap-3">
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
                      className={`flex items-center justify-between p-3 rounded-lg border transition-all text-xs select-none ${
                        isAlreadyInDeck
                          ? "bg-muted/40 border-border/40 opacity-60 cursor-not-allowed"
                          : isSelected
                            ? "bg-primary/10 border-primary cursor-pointer shadow-2xs"
                            : "bg-card hover:bg-muted/20 hover:border-border cursor-pointer"
                      }`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div
                          className={`h-4 w-4 rounded flex items-center justify-center border transition-colors ${
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

                        <div className="flex items-center gap-2 overflow-hidden truncate">
                          <span className="font-bold text-foreground font-japanese">
                            {card.jpText}
                          </span>
                          <span className="text-muted-foreground font-mono">
                            →
                          </span>
                          <span className="text-muted-foreground truncate">
                            {card.enText}
                          </span>
                        </div>
                      </div>

                      {isAlreadyInDeck && (
                        <Badge variant="outline" className="text-[10px] py-0">
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
                  Add Selected to Deck
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
