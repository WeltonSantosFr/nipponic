"use client";

import { useMemo, useCallback } from "react";
import { useFlashCards } from "@/contexts/FlashCardsContext";
import { SidebarViewMode } from "@nipponic/shared";
import { BookOpen, Layers, GraduationCap, Languages, TrendingUp, Flame } from "lucide-react";
import { isCardDue } from "@/lib/srs";

interface NavItem {
  id: SidebarViewMode;
  label: string;
  icon: typeof BookOpen;
  badge?: React.ReactNode;
}

export function BottomNavigation() {
  const {
    activeSidebarView,
    setActiveSidebarView,
    setSelectedDeckId,
    cards,
    decks,
    studyStats,
    getDueCards,
    playingDeck,
  } = useFlashCards();

  const dueCount = useMemo(() => {
    const hasDecksWithCards = (decks || []).some(
      (d) => (d.cards || []).length > 0
    );
    if (hasDecksWithCards) {
      const list = getDueCards ? getDueCards() : [];
      return list.length;
    }
    const hasLoadedCards = cards.length > 0;
    if (hasLoadedCards) {
      const list = getDueCards ? getDueCards() : cards.filter(isCardDue);
      return list.length;
    }
    if (studyStats?.cardsBreakdown?.dueToday !== undefined) {
      return studyStats.cardsBreakdown.dueToday;
    }
    const list = getDueCards ? getDueCards() : [];
    return list.length;
  }, [studyStats, getDueCards, cards, decks]);

  const streakCount = useMemo(() => {
    return studyStats?.streak?.current ?? 0;
  }, [studyStats]);

  const navItems: NavItem[] = useMemo(
    () => [
      {
        id: "notes",
        label: "Notes",
        icon: BookOpen,
      },
      {
        id: "flashcards",
        label: "Cards",
        icon: Layers,
        badge:
          dueCount > 0 ? (
            <span
              className="absolute -top-1 -right-2 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white shadow-xs animate-in zoom-in-75"
              title={`${dueCount} card${dueCount > 1 ? "s" : ""} due for review`}
            >
              {dueCount > 99 ? "99+" : dueCount}
            </span>
          ) : null,
      },
      {
        id: "tutor",
        label: "Tutor",
        icon: GraduationCap,
      },
      {
        id: "practice",
        label: "Practice",
        icon: Languages,
      },
      {
        id: "stats",
        label: "Stats",
        icon: TrendingUp,
        badge:
          streakCount > 0 ? (
            <span
              className="absolute -top-1 -right-2.5 flex h-4 px-1 items-center justify-center rounded-full bg-amber-500/15 border border-amber-500/30 text-[10px] font-bold text-amber-600 dark:text-amber-400 shadow-xs"
              title={`${streakCount} day streak`}
            >
              <Flame size={9} className="fill-current" />
              <span>{streakCount}</span>
            </span>
          ) : null,
      },
    ],
    [dueCount, streakCount]
  );

  const handleSelectTab = useCallback(
    (view: SidebarViewMode) => {
      if (view === "flashcards" && activeSidebarView === "flashcards") {
        setSelectedDeckId(null);
      }
      setActiveSidebarView(view);
    },
    [setActiveSidebarView, activeSidebarView, setSelectedDeckId]
  );

  // When full-screen flashcard study session is active, hide bottom navigation to maximize study focus
  if (playingDeck) {
    return null;
  }

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      role="tablist"
      className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-t border-border/80 px-2 pt-1 pb-[max(0.35rem,env(safe-area-inset-bottom,0px))]"
    >
      <div className="flex items-center justify-around w-full max-w-md mx-auto h-13 min-w-0">
        {navItems.map((item) => {
          const isActive = activeSidebarView === item.id;
          const IconComponent = item.icon;

          return (
            <button
              key={item.id}
              role="tab"
              aria-selected={isActive}
              aria-label={`${item.label} section`}
              onClick={() => handleSelectTab(item.id)}
              className={`flex-1 min-w-0 flex flex-col items-center justify-center py-1 px-1 h-full rounded-lg transition-all duration-150 cursor-pointer select-none relative ${
                isActive
                  ? "text-primary font-bold"
                  : "text-muted-foreground hover:text-foreground font-medium"
              }`}
            >
              <div className="relative flex items-center justify-center">
                <IconComponent
                  size={19}
                  className={`transition-transform duration-150 ${
                    isActive ? "scale-110 text-primary" : "text-muted-foreground"
                  }`}
                />
                {item.badge}
              </div>
              <span
                className={`text-[11px] truncate tracking-tight mt-0.5 ${
                  isActive ? "text-primary font-bold" : "text-muted-foreground"
                }`}
              >
                {item.label}
              </span>
              {isActive && (
                <span className="absolute bottom-0 w-8 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
