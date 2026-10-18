"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import type { Deck } from "@nipponic/shared";
import { useFlashCards } from "@/contexts/FlashCardsContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Plus, Search, X, Layers, Check } from "lucide-react";

export function AddCardsModal({
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

  const existingDeckCardIds = useMemo(
    () => new Set(deck.cards.map((c) => c.id)),
    [deck.cards]
  );

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

  const filteredCards = useMemo(() => {
    if (!searchQuery.trim()) return cards;
    const q = searchQuery.toLowerCase().trim();
    return cards.filter(
      (card) =>
        card.jpText.toLowerCase().includes(q) ||
        card.enText.toLowerCase().includes(q)
    );
  }, [cards, searchQuery]);

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
