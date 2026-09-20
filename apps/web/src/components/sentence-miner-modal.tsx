"use client";

import { useState, useEffect, useRef } from "react";
import { useFlashCards } from "@/contexts/FlashCardsContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Layers, Sparkles, Check, Plus, Loader2, Search, X } from "lucide-react";
import type { SentenceMinerModalProps } from "@nipponic/shared";

export type { SentenceMinerModalProps };

export function SentenceMinerModal({
  isOpen,
  onClose,
  word,
  reading,
  meanings,
  sentenceJp,
  sentenceEn,
}: SentenceMinerModalProps) {
  const { decks, createCard, createDeck, addCardsToDeck, selectedDeckId } = useFlashCards();

  const [jpCardText, setJpCardText] = useState("");
  const [enCardText, setEnCardText] = useState("");
  const [selectedDeckIds, setSelectedDeckIds] = useState<string[]>([]);
  const [deckSearchQuery, setDeckSearchQuery] = useState("");
  const [isCreatingNewDeck, setIsCreatingNewDeck] = useState(false);
  const [newDeckName, setNewDeckName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const prevIsOpenRef = useRef(false);

  // Initialize fields ONLY when modal opens (transitions from false to true)
  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      // Build front text: Word [reading] + contextual sentence
      const front = sentenceJp
        ? `${word}${reading && reading !== word ? ` (${reading})` : ""}\n\n「${sentenceJp}」`
        : `${word}${reading && reading !== word ? ` (${reading})` : ""}`;

      // Build back text: Dictionary meanings (definition only)
      const meaningText = (meanings || []).slice(0, 3).join(", ");
      const back = meaningText || "Meaning";

      setJpCardText(front);
      setEnCardText(back);
      setSelectedDeckIds(
        selectedDeckId
          ? [selectedDeckId]
          : decks[0]?.id
            ? [decks[0].id]
            : []
      );
      setDeckSearchQuery("");
      setIsCreatingNewDeck(false);
      setNewDeckName("");
      setSuccessMessage(null);
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, word, reading, meanings, sentenceJp, selectedDeckId, decks]);

  const toggleDeckSelection = (deckId: string) => {
    setSelectedDeckIds((prev) =>
      prev.includes(deckId)
        ? prev.filter((id) => id !== deckId)
        : [...prev, deckId]
    );
  };

  const filteredDecks = decks.filter((deck) =>
    deck.name.toLowerCase().includes(deckSearchQuery.toLowerCase().trim())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jpCardText.trim() || !enCardText.trim() || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const finalDeckIds: string[] = [...selectedDeckIds];

      if (isCreatingNewDeck && newDeckName.trim()) {
        const newDeck = await createDeck(newDeckName.trim());
        if (newDeck) {
          finalDeckIds.push(newDeck.id);
        }
      }

      const [firstDeckId, ...otherDeckIds] = finalDeckIds;

      const createdCard = await createCard(
        {
          jpText: jpCardText.trim(),
          enText: enCardText.trim(),
        },
        firstDeckId || undefined
      );

      if (createdCard && otherDeckIds.length > 0) {
        for (const otherDeckId of otherDeckIds) {
          await addCardsToDeck(otherDeckId, [createdCard.id]);
        }
      }

      const addedDeckNames = decks
        .filter((d) => finalDeckIds.includes(d.id))
        .map((d) => `"${d.name}"`);

      if (isCreatingNewDeck && newDeckName.trim()) {
        addedDeckNames.push(`"${newDeckName.trim()}"`);
      }

      const deckLabel =
        addedDeckNames.length === 1
          ? `to ${addedDeckNames[0]}`
          : addedDeckNames.length > 1
            ? `to ${addedDeckNames.length} decks`
            : "to your Arsenal";

      setSuccessMessage(`Flashcard created and added ${deckLabel}!`);
      setTimeout(() => {
        setIsSubmitting(false);
        onClose();
      }, 900);
    } catch (err) {
      console.error("Error creating card:", err);
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="gap-1">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Sparkles size={16} />
            </div>
            <div>
              <DialogTitle className="text-lg">Create Flashcard from Note</DialogTitle>
              <DialogDescription className="text-xs">
                Turn this word and its sentence context into a spaced repetition flashcard.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {successMessage ? (
          <div className="py-8 flex flex-col items-center justify-center text-center gap-2 animate-in zoom-in-95">
            <div className="h-12 w-12 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center">
              <Check size={24} />
            </div>
            <p className="font-semibold text-foreground text-sm">{successMessage}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-2">
            {/* Front of card (Japanese + Context) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-foreground">
                  Front (Prompt & Sentence Context)
                </Label>
                <Badge variant="outline" className="text-[10px]">
                  Japanese
                </Badge>
              </div>
              <Textarea
                value={jpCardText}
                onChange={(e) => setJpCardText(e.target.value)}
                className="font-japanese text-sm min-h-24 resize-none leading-relaxed"
                placeholder="Target word and sentence..."
                required
              />
            </div>

            {/* Back of card (Definition) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-foreground">
                  Back (Definition)
                </Label>
                <Badge variant="outline" className="text-[10px]">
                  English
                </Badge>
              </div>
              <Textarea
                value={enCardText}
                onChange={(e) => setEnCardText(e.target.value)}
                className="text-sm min-h-24 resize-none leading-relaxed"
                placeholder="Meaning..."
                required
              />
            </div>

            {/* Target Decks Selector */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Label className="text-xs font-semibold text-foreground">
                    Target Decks
                  </Label>
                  {selectedDeckIds.length > 0 && (
                    <Badge variant="secondary" className="text-[10px] h-4 px-1.5 font-normal">
                      {selectedDeckIds.length} selected
                    </Badge>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreatingNewDeck((prev) => !prev)}
                  className="text-[11px] text-primary hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={12} />
                  <span>{isCreatingNewDeck ? "Done creating deck" : "Create new deck"}</span>
                </button>
              </div>

              {/* New Deck Input (if toggled) */}
              {isCreatingNewDeck && (
                <div className="space-y-1 p-2.5 rounded-md border border-dashed border-primary/40 bg-primary/5">
                  <Label className="text-[11px] font-medium text-foreground">New Deck Name</Label>
                  <Input
                    value={newDeckName}
                    onChange={(e) => setNewDeckName(e.target.value)}
                    placeholder="Enter new deck name..."
                    className="h-8 text-xs bg-background"
                    autoFocus
                  />
                  <p className="text-[10px] text-muted-foreground">
                    This deck will be created and the card will be added to it.
                  </p>
                </div>
              )}

              {/* Search input for decks */}
              {decks.length > 0 && (
                <div className="relative">
                  <Search
                    size={13}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                  />
                  <Input
                    value={deckSearchQuery}
                    onChange={(e) => setDeckSearchQuery(e.target.value)}
                    placeholder="Search decks by name..."
                    className="h-8 pl-8 pr-7 text-xs"
                  />
                  {deckSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setDeckSearchQuery("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                      aria-label="Clear deck search"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              )}

              {/* Decks Checkbox List */}
              <div className="max-h-36 overflow-y-auto rounded-md border border-input bg-background/50 p-1 space-y-0.5">
                {decks.length === 0 ? (
                  <div className="py-3 text-center text-xs text-muted-foreground">
                    No decks available yet. The card will be added to your Arsenal.
                  </div>
                ) : filteredDecks.length === 0 ? (
                  <div className="py-3 text-center text-xs text-muted-foreground">
                    No decks found matching &ldquo;{deckSearchQuery}&rdquo;.
                  </div>
                ) : (
                  filteredDecks.map((deck) => {
                    const isSelected = selectedDeckIds.includes(deck.id);
                    return (
                      <label
                        key={deck.id}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors cursor-pointer select-none ${
                          isSelected
                            ? "bg-primary/10 text-foreground font-medium"
                            : "hover:bg-muted/60 text-foreground"
                        }`}
                      >
                        <div className="flex items-center gap-2 overflow-hidden min-w-0">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleDeckSelection(deck.id)}
                            className="h-3.5 w-3.5 rounded border-input text-primary focus:ring-primary/20 accent-primary cursor-pointer"
                          />
                          <span className="truncate">{deck.name}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                          {deck.cards.length} {deck.cards.length === 1 ? "card" : "cards"}
                        </span>
                      </label>
                    );
                  })
                )}
              </div>
              {selectedDeckIds.length === 0 && !newDeckName.trim() && (
                <p className="text-[10px] text-muted-foreground italic">
                  * No deck selected. Card will be saved in your unassigned Arsenal.
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                disabled={isSubmitting}
                className="text-xs h-9 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting || !jpCardText.trim() || !enCardText.trim()}
                className="text-xs h-9 gap-1.5 font-semibold cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    <span>Create Flashcard</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
