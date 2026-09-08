"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  ReactNode,
} from "react";
import { Card, Deck, ReviewRating } from "@nipponic/shared";
import { calculateNextReview, isCardDue } from "@/lib/srs";
import { APP_DECKS } from "@/data/app-decks";
import {
  getCardsAction,
  createCardAction,
  updateCardAction,
  reviewCardAction,
  deleteCardAction,
} from "@/actions/cards";
import {
  getDecksAction,
  getPublicDecksAction,
  createDeckAction,
  updateDeckAction,
  deleteDeckAction,
  addCardsToDeckAction,
  removeCardFromDeckAction,
  reorderDeckCardsAction,
} from "@/actions/decks";
import { useAuth } from "./AuthContext";

export type SidebarViewMode = "notes" | "flashcards";
export type DeckTabMode = "my" | "app" | "public";

interface FlashCardsContextData {
  cards: Card[];
  decks: Deck[];
  appDecks: Deck[];
  publicDecks: Deck[];
  activeDeckTab: DeckTabMode;
  setActiveDeckTab: (tab: DeckTabMode) => void;
  selectedDeckId: string | null;
  selectedDeck: Deck | undefined;
  isCurrentDeckOwner: boolean;
  setSelectedDeckId: (id: string | null) => void;
  activeSidebarView: SidebarViewMode;
  setActiveSidebarView: (view: SidebarViewMode) => void;
  playingDeck: Deck | null;
  startPlayingDeck: (deck: Deck) => void;
  stopPlayingDeck: () => void;
  createCard: (
    data: {
      jpText: string;
      enText: string;
      interval?: number;
      easeFactor?: number;
      repetitions?: number;
      lapses?: number;
      nextReviewAt?: string | null;
      lastReviewedAt?: string | null;
    },
    deckId?: string
  ) => Promise<Card | null>;
  updateCard: (id: string, data: Partial<Card>) => Promise<Card | null>;
  deleteCard: (id: string) => Promise<boolean>;
  reviewCard: (cardId: string, rating: ReviewRating) => Promise<Card | null>;
  getDueCards: (deckId?: string) => Card[];
  createDeck: (
    name?: string,
    cardIds?: string[],
    preloadedCards?: Card[]
  ) => Promise<Deck | null>;
  updateDeck: (
    id: string,
    data: Partial<{ name: string; isPublic: boolean }>
  ) => Promise<Deck | null>;
  deleteDeck: (id: string) => Promise<boolean>;
  addCardsToDeck: (deckId: string, cardIds: string[]) => Promise<void>;
  removeCardFromDeck: (deckId: string, cardId: string) => Promise<void>;
  reorderDeckCards: (deckId: string, cardIds: string[]) => Promise<void>;
  addDeckToMyDecks: (deck: Deck) => Promise<Deck | null>;
  refreshAll: () => Promise<void>;
}

const FlashCardsContext = createContext<FlashCardsContextData>(
  {} as FlashCardsContextData
);

export function FlashCardsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [cards, setCards] = useState<Card[]>([]);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [publicDecks, setPublicDecks] = useState<Deck[]>([]);
  const [activeDeckTab, setActiveDeckTab] = useState<DeckTabMode>("my");
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [activeSidebarView, setActiveSidebarView] =
    useState<SidebarViewMode>("notes");
  const [playingDeck, setPlayingDeck] = useState<Deck | null>(null);

  const cardsRef = useRef<Card[]>(cards);
  cardsRef.current = cards;
  const decksRef = useRef<Deck[]>(decks);
  decksRef.current = decks;

  const appDecks = APP_DECKS;

  const selectedDeck = useMemo(() => {
    if (!selectedDeckId) return undefined;
    const myDeck = decks.find((d) => d.id === selectedDeckId);
    if (myDeck) return myDeck;
    const appDeck = appDecks.find((d) => d.id === selectedDeckId);
    if (appDeck) return appDeck;
    const pubDeck = publicDecks.find((d) => d.id === selectedDeckId);
    if (pubDeck) return pubDeck;
    return undefined;
  }, [selectedDeckId, decks, appDecks, publicDecks]);

  const isCurrentDeckOwner = useMemo(() => {
    if (!selectedDeck) return false;
    return decks.some((d) => d.id === selectedDeck.id);
  }, [selectedDeck, decks]);

  const refreshAll = useCallback(async () => {
    if (isAuthenticated) {
      try {
        const [fetchedCards, fetchedDecks, fetchedPublic] = await Promise.all([
          getCardsAction(),
          getDecksAction(),
          getPublicDecksAction(),
        ]);

        const renameMap: Record<string, string> = {
          "Hiragana (Básico)": "Hiragana (Basic)",
          "Hiragana (Avançado)": "Hiragana (Advanced)",
          "Katakana (Básico)": "Katakana (Basic)",
          "Katakana (Avançado)": "Katakana (Advanced)",
          "Hiragana (Basico)": "Hiragana (Basic)",
          "Hiragana (Avancado)": "Hiragana (Advanced)",
          "Katakana (Basico)": "Katakana (Basic)",
          "Katakana (Avancado)": "Katakana (Advanced)",
        };

        const sanitizedDecks: Deck[] = (fetchedDecks || []).map((deck) => {
          const mappedName = renameMap[deck.name];
          if (mappedName) {
            updateDeckAction(deck.id, { name: mappedName }).catch(console.error);
            return { ...deck, name: mappedName };
          }
          return deck;
        });

        setCards(fetchedCards || []);
        setDecks(sanitizedDecks);
        setPublicDecks(fetchedPublic || []);
      } catch (err) {
        console.error("Error fetching flash cards/decks:", err);
      }
    } else {
      setCards([]);
      setDecks([]);
      setPublicDecks([]);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const startPlayingDeck = (deck: Deck) => {
    setPlayingDeck(deck);
  };

  const stopPlayingDeck = () => {
    setPlayingDeck(null);
  };

  const getDueCards = useCallback(
    (deckId?: string): Card[] => {
      if (deckId) {
        const deck = decksRef.current.find((d) => d.id === deckId);
        if (!deck) return [];
        return deck.cards.filter(isCardDue);
      }
      return cardsRef.current.filter(isCardDue);
    },
    []
  );

  const createCard = async (
    data: {
      jpText: string;
      enText: string;
      interval?: number;
      easeFactor?: number;
      repetitions?: number;
      lapses?: number;
      nextReviewAt?: string | null;
      lastReviewedAt?: string | null;
    },
    deckId?: string
  ): Promise<Card | null> => {
    const tempId = `temp-card-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const optimisticCard: Card = {
      id: tempId,
      jpText: data.jpText,
      enText: data.enText,
      interval: data.interval ?? 0,
      easeFactor: data.easeFactor ?? 2.5,
      repetitions: data.repetitions ?? 0,
      lapses: data.lapses ?? 0,
      nextReviewAt: data.nextReviewAt ?? new Date().toISOString(),
      lastReviewedAt: data.lastReviewedAt ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setCards((prev) => [optimisticCard, ...prev]);

    if (deckId) {
      setDecks((prevDecks) =>
        prevDecks.map((d) =>
          d.id === deckId ? { ...d, cards: [optimisticCard, ...d.cards] } : d
        )
      );
    }

    if (!isAuthenticated) return optimisticCard;

    try {
      const created = await createCardAction(data);
      if (created && created.id) {
        setCards((prev) =>
          prev.map((c) => (c.id === tempId ? created : c))
        );

        if (deckId) {
          setDecks((prevDecks) =>
            prevDecks.map((d) =>
              d.id === deckId
                ? {
                    ...d,
                    cards: d.cards.map((c) => (c.id === tempId ? created : c)),
                  }
                : d
            )
          );
          if (!deckId.startsWith("temp-")) {
            await addCardsToDeckAction(deckId, [created.id]);
          }
        }
        return created;
      }
      return optimisticCard;
    } catch (err) {
      console.error("Error creating card:", err);
      return null;
    }
  };

  const updateCard = async (
    id: string,
    data: Partial<Card>
  ): Promise<Card | null> => {
    setCards((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              ...data,
              updatedAt: new Date().toISOString(),
            }
          : c
      )
    );

    // Also update any deck that contains this card in frontend state
    setDecks((prevDecks) =>
      prevDecks.map((d) => ({
        ...d,
        cards: d.cards.map((c) => (c.id === id ? { ...c, ...data } : c)),
      }))
    );

    if (!isAuthenticated || id.startsWith("temp-")) return null;

    try {
      const updated = await updateCardAction(id, data);
      return updated;
    } catch (err) {
      console.error("Error updating card:", err);
      return null;
    }
  };

  const reviewCard = async (
    cardId: string,
    rating: ReviewRating
  ): Promise<Card | null> => {
    let card = cardsRef.current.find((c) => c.id === cardId);
    if (!card) {
      for (const d of decksRef.current) {
        const found = d.cards.find((c) => c.id === cardId);
        if (found) {
          card = found;
          break;
        }
      }
    }
    if (!card) {
      for (const d of appDecks) {
        const found = d.cards.find((c) => c.id === cardId);
        if (found) {
          card = found;
          break;
        }
      }
    }
    if (!card) return null;

    const srsData = calculateNextReview(card, rating);
    const updatedCard: Card = {
      ...card,
      ...srsData,
      updatedAt: new Date().toISOString(),
    };

    // Optimistically update cards list
    setCards((prev) =>
      prev.map((c) => (c.id === cardId ? updatedCard : c))
    );

    // Optimistically update decks list
    setDecks((prevDecks) =>
      prevDecks.map((d) => ({
        ...d,
        cards: d.cards.map((c) => (c.id === cardId ? updatedCard : c)),
      }))
    );

    // Optimistically update playingDeck if currently playing
    setPlayingDeck((prevPlaying) => {
      if (!prevPlaying) return null;
      return {
        ...prevPlaying,
        cards: prevPlaying.cards.map((c) => (c.id === cardId ? updatedCard : c)),
      };
    });

    if (!isAuthenticated || cardId.startsWith("temp-") || cardId.startsWith("app-card-")) {
      return updatedCard;
    }

    try {
      const persisted = await reviewCardAction(cardId, rating);
      if (persisted) {
        setCards((prev) =>
          prev.map((c) => (c.id === cardId ? persisted : c))
        );
        setDecks((prevDecks) =>
          prevDecks.map((d) => ({
            ...d,
            cards: d.cards.map((c) => (c.id === cardId ? persisted : c)),
          }))
        );
        setPlayingDeck((prevPlaying) => {
          if (!prevPlaying) return null;
          return {
            ...prevPlaying,
            cards: prevPlaying.cards.map((c) => (c.id === cardId ? persisted : c)),
          };
        });
        return persisted;
      }
      return updatedCard;
    } catch (err) {
      console.error("Error reviewing card:", err);
      return updatedCard;
    }
  };

  const deleteCard = async (id: string): Promise<boolean> => {
    setCards((prev) => prev.filter((c) => c.id !== id));
    // Remove from decks state
    setDecks((prevDecks) =>
      prevDecks.map((d) => ({
        ...d,
        cards: d.cards.filter((c) => c.id !== id),
      }))
    );

    if (!isAuthenticated || id.startsWith("temp-")) return true;

    try {
      return await deleteCardAction(id);
    } catch (err) {
      console.error("Error deleting card:", err);
      return false;
    }
  };

  const createDeck = async (
    name = "New Deck",
    cardIds: string[] = [],
    preloadedCards?: Card[]
  ): Promise<Deck | null> => {
    const tempId = `temp-deck-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const selectedCards =
      preloadedCards && preloadedCards.length > 0
        ? preloadedCards
        : cardsRef.current.filter((c) => cardIds.includes(c.id));

    const optimisticDeck: Deck = {
      id: tempId,
      name,
      isPublic: false,
      cards: selectedCards,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setDecks((prev) => [optimisticDeck, ...prev]);
    setSelectedDeckId(tempId);
    setActiveDeckTab("my");

    if (!isAuthenticated) return optimisticDeck;

    try {
      const created = await createDeckAction({ name, isPublic: false, cardIds });
      if (created && created.id) {
        setDecks((prev) =>
          prev.map((d) => (d.id === tempId ? created : d))
        );
        setSelectedDeckId((prevId) => (prevId === tempId ? created.id : prevId));
        return created;
      }
      return optimisticDeck;
    } catch (err) {
      console.error("Error creating deck:", err);
      return null;
    }
  };

  const addDeckToMyDecks = async (sourceDeck: Deck): Promise<Deck | null> => {
    const createdCards: Card[] = [];
    const createdCardIds: string[] = [];

    for (const card of sourceDeck.cards) {
      const created = await createCard({
        jpText: card.jpText,
        enText: card.enText,
      });
      if (created) {
        createdCards.push(created);
        createdCardIds.push(created.id);
      }
    }

    const createdDeck = await createDeck(
      sourceDeck.name,
      createdCardIds,
      createdCards
    );

    if (createdDeck) {
      setActiveDeckTab("my");
      setSelectedDeckId(createdDeck.id);
    }

    return createdDeck;
  };

  const updateDeck = async (
    id: string,
    data: Partial<{ name: string; isPublic: boolean }>
  ): Promise<Deck | null> => {
    setDecks((prev) =>
      prev.map((d) =>
        d.id === id
          ? {
              ...d,
              ...data,
              updatedAt: new Date().toISOString(),
            }
          : d
      )
    );

    if (!isAuthenticated || id.startsWith("temp-")) return null;

    try {
      const updated = await updateDeckAction(id, data);
      return updated;
    } catch (err) {
      console.error("Error updating deck:", err);
      return null;
    }
  };

  const deleteDeck = async (id: string): Promise<boolean> => {
    setDecks((prev) => prev.filter((d) => d.id !== id));
    if (selectedDeckId === id) {
      setSelectedDeckId(null);
    }
    if (playingDeck?.id === id) {
      setPlayingDeck(null);
    }

    if (!isAuthenticated || id.startsWith("temp-")) return true;

    try {
      return await deleteDeckAction(id);
    } catch (err) {
      console.error("Error deleting deck:", err);
      return false;
    }
  };

  const addCardsToDeck = async (deckId: string, cardIds: string[]) => {
    const cardsToAdd = cardsRef.current.filter((c) => cardIds.includes(c.id));
    setDecks((prevDecks) =>
      prevDecks.map((d) => {
        if (d.id !== deckId) return d;
        const existingIds = new Set(d.cards.map((c) => c.id));
        const newCards = cardsToAdd.filter((c) => !existingIds.has(c.id));
        return {
          ...d,
          cards: [...d.cards, ...newCards],
        };
      })
    );

    if (!isAuthenticated || deckId.startsWith("temp-")) return;

    try {
      const updated = await addCardsToDeckAction(deckId, cardIds);
      if (updated) {
        setDecks((prev) =>
          prev.map((d) => (d.id === deckId ? updated : d))
        );
      }
    } catch (err) {
      console.error("Error adding cards to deck:", err);
    }
  };

  const removeCardFromDeck = async (deckId: string, cardId: string) => {
    setDecks((prevDecks) =>
      prevDecks.map((d) =>
        d.id === deckId
          ? {
              ...d,
              cards: d.cards.filter((c) => c.id !== cardId),
            }
          : d
      )
    );

    if (!isAuthenticated || deckId.startsWith("temp-")) return;

    try {
      const updated = await removeCardFromDeckAction(deckId, cardId);
      if (updated) {
        setDecks((prev) =>
          prev.map((d) => (d.id === deckId ? updated : d))
        );
      }
    } catch (err) {
      console.error("Error removing card from deck:", err);
    }
  };

  const reorderDeckCards = async (deckId: string, cardIds: string[]) => {
    setDecks((prevDecks) =>
      prevDecks.map((d) => {
        if (d.id !== deckId) return d;
        const cardMap = new Map(d.cards.map((c) => [c.id, c]));
        const reordered = cardIds
          .map((id) => cardMap.get(id))
          .filter((c): c is Card => !!c);
        return {
          ...d,
          cards: reordered,
        };
      })
    );

    if (!isAuthenticated || deckId.startsWith("temp-")) return;

    try {
      const updated = await reorderDeckCardsAction(deckId, cardIds);
      if (updated) {
        setDecks((prev) =>
          prev.map((d) => (d.id === deckId ? updated : d))
        );
      }
    } catch (err) {
      console.error("Error reordering cards:", err);
    }
  };

  return (
    <FlashCardsContext.Provider
      value={{
        cards,
        decks,
        appDecks,
        publicDecks,
        activeDeckTab,
        setActiveDeckTab,
        selectedDeckId,
        selectedDeck,
        isCurrentDeckOwner,
        setSelectedDeckId,
        activeSidebarView,
        setActiveSidebarView,
        playingDeck,
        startPlayingDeck,
        stopPlayingDeck,
        createCard,
        updateCard,
        deleteCard,
        reviewCard,
        getDueCards,
        createDeck,
        updateDeck,
        deleteDeck,
        addCardsToDeck,
        removeCardFromDeck,
        reorderDeckCards,
        addDeckToMyDecks,
        refreshAll,
      }}
    >
      {children}
    </FlashCardsContext.Provider>
  );
}

export const useFlashCards = () => useContext(FlashCardsContext);
