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
import { Layers, Sparkles, Check, Plus, Loader2 } from "lucide-react";

interface SentenceMinerModalProps {
  isOpen: boolean;
  onClose: () => void;
  word: string;
  reading?: string;
  meanings?: string[];
  sentenceJp: string;
  sentenceEn?: string;
}

export function SentenceMinerModal({
  isOpen,
  onClose,
  word,
  reading,
  meanings,
  sentenceJp,
  sentenceEn,
}: SentenceMinerModalProps) {
  const { decks, createCard, createDeck, selectedDeckId } = useFlashCards();

  const [jpCardText, setJpCardText] = useState("");
  const [enCardText, setEnCardText] = useState("");
  const [targetDeckId, setTargetDeckId] = useState<string>("");
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

      // Build back text: Dictionary meanings + English sentence translation
      const meaningText = (meanings || []).slice(0, 3).join(", ");
      const back = sentenceEn
        ? `${meaningText}\n\n"${sentenceEn}"`
        : meaningText || "Meaning";

      setJpCardText(front);
      setEnCardText(back);
      setTargetDeckId(selectedDeckId || (decks[0]?.id ?? ""));
      setIsCreatingNewDeck(false);
      setNewDeckName("");
      setSuccessMessage(null);
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, word, reading, meanings, sentenceJp, sentenceEn, selectedDeckId, decks]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jpCardText.trim() || !enCardText.trim() || isSubmitting) return;

    setIsSubmitting(true);

    try {
      let finalDeckId = targetDeckId;

      if (isCreatingNewDeck && newDeckName.trim()) {
        const newDeck = await createDeck(newDeckName.trim());
        if (newDeck) {
          finalDeckId = newDeck.id;
        }
      }

      await createCard(
        {
          jpText: jpCardText.trim(),
          enText: enCardText.trim(),
        },
        finalDeckId || undefined
      );

      const targetDeckObj = decks.find((d) => d.id === finalDeckId);
      const deckLabel = isCreatingNewDeck && newDeckName.trim()
        ? `to "${newDeckName.trim()}"`
        : targetDeckObj
          ? `to "${targetDeckObj.name}"`
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

            {/* Back of card (English + Translation) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-foreground">
                  Back (Definition & Translation)
                </Label>
                <Badge variant="outline" className="text-[10px]">
                  English
                </Badge>
              </div>
              <Textarea
                value={enCardText}
                onChange={(e) => setEnCardText(e.target.value)}
                className="text-sm min-h-24 resize-none leading-relaxed"
                placeholder="Meaning and translation..."
                required
              />
            </div>

            {/* Target Deck Selector */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-foreground">
                  Target Deck
                </Label>
                <button
                  type="button"
                  onClick={() => setIsCreatingNewDeck((prev) => !prev)}
                  className="text-[11px] text-primary hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={12} />
                  <span>{isCreatingNewDeck ? "Choose existing deck" : "Create new deck"}</span>
                </button>
              </div>

              {isCreatingNewDeck ? (
                <Input
                  value={newDeckName}
                  onChange={(e) => setNewDeckName(e.target.value)}
                  placeholder="Enter new deck name..."
                  className="h-9 text-xs"
                  required
                />
              ) : (
                <select
                  value={targetDeckId}
                  onChange={(e) => setTargetDeckId(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground shadow-xs focus:outline-hidden focus:ring-1 focus:ring-ring"
                >
                  <option value="">Arsenal (Unassigned)</option>
                  {decks.map((deck) => (
                    <option key={deck.id} value={deck.id}>
                      {deck.name} ({deck.cards.length} cards)
                    </option>
                  ))}
                </select>
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
