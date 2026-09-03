"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import { Card, Deck } from "@nipponic/shared";
import {
  getCardsAction,
  createCardAction,
  updateCardAction,
  deleteCardAction,
} from "@/actions/cards";
import {
  getDecksAction,
  createDeckAction,
  updateDeckAction,
  deleteDeckAction,
  addCardsToDeckAction,
  removeCardFromDeckAction,
  reorderDeckCardsAction,
} from "@/actions/decks";
import { useAuth } from "./AuthContext";

export type SidebarViewMode = "notes" | "flashcards";

interface FlashCardsContextData {
  cards: Card[];
  decks: Deck[];
  selectedDeckId: string | null;
  selectedDeck: Deck | undefined;
  setSelectedDeckId: (id: string | null) => void;
  activeSidebarView: SidebarViewMode;
  setActiveSidebarView: (view: SidebarViewMode) => void;
  playingDeck: Deck | null;
  startPlayingDeck: (deck: Deck) => void;
  stopPlayingDeck: () => void;
  createCard: (data: { jpText: string; enText: string }) => Promise<Card | null>;
  updateCard: (
    id: string,
    data: Partial<{ jpText: string; enText: string }>
  ) => Promise<Card | null>;
  deleteCard: (id: string) => Promise<boolean>;
  createDeck: (name?: string, cardIds?: string[]) => Promise<Deck | null>;
  updateDeck: (
    id: string,
    data: Partial<{ name: string; isPublic: boolean }>
  ) => Promise<Deck | null>;
  deleteDeck: (id: string) => Promise<boolean>;
  addCardsToDeck: (deckId: string, cardIds: string[]) => Promise<void>;
  removeCardFromDeck: (deckId: string, cardId: string) => Promise<void>;
  reorderDeckCards: (deckId: string, cardIds: string[]) => Promise<void>;
  refreshAll: () => Promise<void>;
}

const FlashCardsContext = createContext<FlashCardsContextData>(
  {} as FlashCardsContextData
);

export function FlashCardsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [cards, setCards] = useState<Card[]>([]);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [activeSidebarView, setActiveSidebarView] =
    useState<SidebarViewMode>("notes");
  const [playingDeck, setPlayingDeck] = useState<Deck | null>(null);

  const cardsRef = useRef<Card[]>(cards);
  cardsRef.current = cards;
  const decksRef = useRef<Deck[]>(decks);
  decksRef.current = decks;

  const selectedDeck = decks.find((d) => d.id === selectedDeckId);

  const refreshAll = useCallback(async () => {
    if (isAuthenticated) {
      try {
        const [fetchedCards, fetchedDecks] = await Promise.all([
          getCardsAction(),
          getDecksAction(),
        ]);
        setCards(fetchedCards || []);
        setDecks(fetchedDecks || []);
      } catch (err) {
        console.error("Error fetching flash cards/decks:", err);
      }
    } else {
      setCards([]);
      setDecks([]);
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

  const createCard = async (data: {
    jpText: string;
    enText: string;
  }): Promise<Card | null> => {
    const tempId = `temp-card-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const optimisticCard: Card = {
      id: tempId,
      jpText: data.jpText,
      enText: data.enText,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setCards((prev) => [optimisticCard, ...prev]);

    if (!isAuthenticated) return optimisticCard;

    try {
      const created = await createCardAction(data);
      if (created && created.id) {
        setCards((prev) =>
          prev.map((c) => (c.id === tempId ? created : c))
        );
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
    data: Partial<{ jpText: string; enText: string }>
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
    cardIds: string[] = []
  ): Promise<Deck | null> => {
    const tempId = `temp-deck-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const selectedCards = cardsRef.current.filter((c) =>
      cardIds.includes(c.id)
    );

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
        selectedDeckId,
        selectedDeck,
        setSelectedDeckId,
        activeSidebarView,
        setActiveSidebarView,
        playingDeck,
        startPlayingDeck,
        stopPlayingDeck,
        createCard,
        updateCard,
        deleteCard,
        createDeck,
        updateDeck,
        deleteDeck,
        addCardsToDeck,
        removeCardFromDeck,
        reorderDeckCards,
        refreshAll,
      }}
    >
      {children}
    </FlashCardsContext.Provider>
  );
}

export const useFlashCards = () => useContext(FlashCardsContext);
