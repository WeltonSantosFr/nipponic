"use client";

import { useState, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { Deck, DeckTabMode, normalizeDeckName } from "@nipponic/shared";
import { useFlashCards } from "@/contexts/FlashCardsContext";
import { isCardDue } from "@/lib/srs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Layers,
  Play,
  Plus,
  Search,
  X,
  Zap,
  Globe,
  Trash2,
  Check,
  Sparkles,
  RotateCcw,
} from "lucide-react";

const DeleteDeckModal = dynamic(
  () => import("@/components/delete-deck-modal").then((mod) => mod.DeleteDeckModal),
  { ssr: false }
);

export interface DeckGridProps {
  onSelectDeck: (deckId: string) => void;
  onCreateDeck?: () => void;
}

export function DeckGrid({ onSelectDeck, onCreateDeck }: DeckGridProps) {
  const {
    decks,
    appDecks,
    publicDecks,
    activeDeckTab,
    setActiveDeckTab,
    createDeck,
    deleteDeck,
    startPlayingDeck,
    addDeckToMyDecks,
    refreshAll,
  } = useFlashCards();

  const [searchQuery, setSearchQuery] = useState("");
  const [deckToDelete, setDeckToDelete] = useState<Deck | null>(null);
  const [cloningDeckId, setCloningDeckId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    if (!refreshAll) return;
    setIsRefreshing(true);
    try {
      await refreshAll();
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshAll]);

  const myDeckNormalizedNames = useMemo(
    () => new Set(decks.map((myDeck) => normalizeDeckName(myDeck.name))),
    [decks]
  );

  const currentTabDecks = useMemo(() => {
    switch (activeDeckTab) {
      case "app":
        return appDecks;
      case "public":
        return publicDecks;
      case "my":
      default:
        return decks;
    }
  }, [activeDeckTab, decks, appDecks, publicDecks]);

  const filteredDecks = useMemo(() => {
    if (!searchQuery.trim()) return currentTabDecks;
    const q = searchQuery.toLowerCase().trim();
    return currentTabDecks.filter((deck) =>
      (deck.name || "").toLowerCase().includes(q)
    );
  }, [currentTabDecks, searchQuery]);

  const handleCreateNew = useCallback(() => {
    if (onCreateDeck) {
      onCreateDeck();
    } else {
      createDeck("New Deck");
    }
  }, [onCreateDeck, createDeck]);

  const handleAddDeckToMine = useCallback(
    async (deck: Deck) => {
      setCloningDeckId(deck.id);
      try {
        await addDeckToMyDecks(deck);
      } finally {
        setCloningDeckId(null);
      }
    },
    [addDeckToMyDecks]
  );

  return (
    <div className="w-full max-w-5xl flex-1 flex flex-col gap-5 sm:gap-6 justify-start p-3.5 sm:p-6 md:p-8 min-w-0 max-w-full overflow-x-hidden pb-safe">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 w-full min-w-0">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Layers size={18} />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate">
              Flashcard Decks
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground break-words">
            Select a deck to review flashcards, track spaced repetition mastery, or manage study items.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="text-xs gap-1.5 cursor-pointer flex-1 sm:flex-initial justify-center"
          >
            <RotateCcw size={14} className={isRefreshing ? "animate-spin" : ""} />
            <span>Refresh</span>
          </Button>

          <Button
            onClick={handleCreateNew}
            className="gap-1.5 cursor-pointer flex-1 sm:flex-initial shrink-0 justify-center text-xs sm:text-sm"
          >
            <Plus size={16} />
            <span>New Deck</span>
          </Button>
        </div>
      </div>

      {/* Navigation Tabs & Search Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-4 w-full min-w-0">
        {/* Tabs */}
        <div
          role="tablist"
          className="flex items-center gap-1 p-1 bg-muted/60 border border-border/80 rounded-xl overflow-x-auto min-w-0 max-w-full shrink-0"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeDeckTab === "my"}
            onClick={() => setActiveDeckTab("my")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeDeckTab === "my"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Layers size={13} />
            <span>My Decks</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-muted text-muted-foreground">
              {decks.length}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeDeckTab === "app"}
            onClick={() => setActiveDeckTab("app")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeDeckTab === "app"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Sparkles size={13} className="text-purple-500" />
            <span>Starter Decks</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-muted text-muted-foreground">
              {appDecks.length}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeDeckTab === "public"}
            onClick={() => setActiveDeckTab("public")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeDeckTab === "public"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Globe size={13} className="text-blue-500" />
            <span>Community</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-muted text-muted-foreground">
              {publicDecks.length}
            </span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative flex-1 sm:max-w-xs min-w-0">
          <Search
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <Input
            type="text"
            placeholder="Search decks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-8 text-xs h-9 w-full min-w-0"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X size={12} />
              <span className="sr-only">Clear search</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid Content */}
      {activeDeckTab === "my" && decks.length === 0 ? (
        /* Empty State Notice: preserved when user has no decks */
        <div className="w-full flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
          <div className="w-full max-w-md text-center p-6 sm:p-8 bg-card border rounded-2xl shadow-xs flex flex-col items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Layers className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold">No deck selected</h3>
              <p className="text-xs text-muted-foreground">
                Select a deck from the sidebar or create a new pack to start reviewing your flashcards.
              </p>
            </div>
            <Button
              onClick={handleCreateNew}
              className="w-full gap-1.5 cursor-pointer justify-center"
            >
              <Plus size={16} />
              <span>Create New Deck</span>
            </Button>
          </div>
        </div>
      ) : filteredDecks.length === 0 ? (
        /* Empty Search Results */
        <div className="w-full text-center py-12 px-4 border border-dashed rounded-2xl bg-muted/20">
          <Layers className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-60" />
          <p className="text-sm font-medium text-foreground">
            {searchQuery.trim()
              ? `No decks matching "${searchQuery}"`
              : activeDeckTab === "public"
              ? "No community decks available yet."
              : "No decks found."}
          </p>
          {searchQuery && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearchQuery("")}
              className="mt-3 text-xs cursor-pointer"
            >
              Clear search
            </Button>
          )}
        </div>
      ) : (
        /* Responsive Decks Grid */
        <div
          data-testid="decks-grid"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4 w-full min-w-0 max-w-full"
        >
          {filteredDecks.map((deck) => {
            const dueCards = (deck.cards || []).filter(isCardDue);
            const dueCount = dueCards.length;
            const hasDueCards = dueCount > 0;
            const isOwner = activeDeckTab === "my";
            const isAlreadyAdded = myDeckNormalizedNames.has(
              normalizeDeckName(deck.name)
            );
            const isCloning = cloningDeckId === deck.id;

            return (
              <Card
                key={deck.id}
                data-testid={`deck-card-${deck.id}`}
                onClick={() => onSelectDeck(deck.id)}
                className="group/card flex flex-col justify-between transition-all duration-150 hover:border-primary/50 hover:shadow-md cursor-pointer border border-border/80 bg-card rounded-2xl p-4 sm:p-5 min-w-0"
              >
                {/* Card Top: Title & Badges */}
                <div className="space-y-3 min-w-0">
                  <div className="flex items-start justify-between gap-2 min-w-0">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover/card:bg-primary group-hover/card:text-primary-foreground transition-colors">
                        {activeDeckTab === "app" ? (
                          <Sparkles size={16} />
                        ) : activeDeckTab === "public" ? (
                          <Globe size={16} />
                        ) : (
                          <Layers size={16} />
                        )}
                      </div>
                      <h2
                        className="font-semibold text-base sm:text-lg text-foreground truncate min-w-0 flex-1 tracking-tight"
                        title={deck.name}
                      >
                        {deck.name || "Untitled Deck"}
                      </h2>
                    </div>

                    {isOwner && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeckToDelete(deck);
                        }}
                        title="Delete deck"
                        className="opacity-0 group-hover/card:opacity-100 p-1.5 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all cursor-pointer shrink-0"
                      >
                        <Trash2 size={14} />
                        <span className="sr-only">Delete deck</span>
                      </button>
                    )}
                  </div>

                  {/* Card Middle: Badges and Stats */}
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <Badge variant="secondary" className="text-xs font-normal">
                      {deck.cards.length} {deck.cards.length === 1 ? "card" : "cards"}
                    </Badge>

                    {hasDueCards && (
                      <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 gap-1 text-xs font-semibold">
                        <Zap size={11} className="fill-current" />
                        <span>{dueCount} due</span>
                      </Badge>
                    )}

                    {!isOwner && isAlreadyAdded && (
                      <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 gap-1 text-xs">
                        <Check size={11} />
                        <span>Added</span>
                      </Badge>
                    )}

                    {isOwner && deck.isPublic && (
                      <Badge variant="outline" className="text-blue-500 border-blue-500/30 text-xs gap-1">
                        <Globe size={10} />
                        <span>Public</span>
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Card Bottom: Actions */}
                <div className="pt-4 mt-4 border-t border-border/60 flex items-center justify-between gap-2 min-w-0">
                  <span className="text-xs text-muted-foreground group-hover/card:text-foreground transition-colors font-medium">
                    Open deck &rarr;
                  </span>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {!isOwner && !isAlreadyAdded && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isCloning}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddDeckToMine(deck);
                        }}
                        className="h-8 text-xs gap-1 cursor-pointer"
                      >
                        <Plus size={13} />
                        <span>Add</span>
                      </Button>
                    )}

                    {deck.cards.length > 0 && (
                      <Button
                        size="sm"
                        variant={hasDueCards ? "default" : "secondary"}
                        onClick={(e) => {
                          e.stopPropagation();
                          startPlayingDeck(deck);
                        }}
                        title={hasDueCards ? `Review ${dueCount} due cards` : "Study flashcards"}
                        className={`h-8 text-xs gap-1.5 cursor-pointer ${
                          hasDueCards
                            ? "bg-amber-500 hover:bg-amber-600 text-white dark:bg-amber-600 dark:hover:bg-amber-700"
                            : ""
                        }`}
                      >
                        <Play size={12} className="fill-current" />
                        <span>{hasDueCards ? "Review" : "Study"}</span>
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deckToDelete && (
        <DeleteDeckModal
          deck={deckToDelete}
          isOpen={!!deckToDelete}
          onClose={() => setDeckToDelete(null)}
          onConfirm={() => {
            if (deckToDelete) {
              deleteDeck(deckToDelete.id);
            }
          }}
        />
      )}
    </div>
  );
}
