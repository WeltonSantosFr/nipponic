"use server";
import { cookies } from "next/headers";
import { Deck } from "@nipponic/shared";

const API_URL = process.env.API_URL || "http://localhost:3001";

export async function getDecksAction(): Promise<Deck[]> {
  const cookieStore = await cookies();
  const token = cookieStore.get("nipponic.token")?.value;

  if (!token) return [];

  try {
    const res = await fetch(`${API_URL}/decks`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!res.ok) return [];
    return res.json();
  } catch (error) {
    console.error("Error fetching decks:", error);
    return [];
  }
}

export async function getDeckAction(id: string): Promise<Deck | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("nipponic.token")?.value;

  if (!token) return null;

  try {
    const res = await fetch(`${API_URL}/decks/${id}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error("Error fetching deck:", error);
    return null;
  }
}

export async function createDeckAction(deck: {
  name: string;
  isPublic?: boolean;
  cardIds?: string[];
}): Promise<Deck | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("nipponic.token")?.value;

  if (!token) return null;

  try {
    const res = await fetch(`${API_URL}/decks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(deck),
    });

    if (!res.ok) {
      console.error("Failed to create deck, status:", res.status);
      return null;
    }
    return res.json();
  } catch (error) {
    console.error("Error creating deck:", error);
    return null;
  }
}

export async function updateDeckAction(
  id: string,
  deck: Partial<{
    name: string;
    isPublic: boolean;
  }>
): Promise<Deck | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("nipponic.token")?.value;

  if (!token) return null;

  try {
    const res = await fetch(`${API_URL}/decks/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(deck),
    });

    if (!res.ok) {
      console.error("Failed to update deck, status:", res.status);
      return null;
    }
    return res.json();
  } catch (error) {
    console.error("Error updating deck:", error);
    return null;
  }
}

export async function deleteDeckAction(id: string): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get("nipponic.token")?.value;

  if (!token) return false;

  try {
    const res = await fetch(`${API_URL}/decks/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return res.ok;
  } catch (error) {
    console.error("Error deleting deck:", error);
    return false;
  }
}

export async function addCardsToDeckAction(
  deckId: string,
  cardIds: string[]
): Promise<Deck | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("nipponic.token")?.value;

  if (!token) return null;

  try {
    const res = await fetch(`${API_URL}/decks/${deckId}/cards`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ cardIds }),
    });

    if (!res.ok) {
      console.error("Failed to add cards to deck, status:", res.status);
      return null;
    }
    return res.json();
  } catch (error) {
    console.error("Error adding cards to deck:", error);
    return null;
  }
}

export async function removeCardFromDeckAction(
  deckId: string,
  cardId: string
): Promise<Deck | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("nipponic.token")?.value;

  if (!token) return null;

  try {
    const res = await fetch(`${API_URL}/decks/${deckId}/cards/${cardId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      console.error("Failed to remove card from deck, status:", res.status);
      return null;
    }
    return res.json();
  } catch (error) {
    console.error("Error removing card from deck:", error);
    return null;
  }
}

export async function reorderDeckCardsAction(
  deckId: string,
  cardIds: string[]
): Promise<Deck | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("nipponic.token")?.value;

  if (!token) return null;

  try {
    const res = await fetch(`${API_URL}/decks/${deckId}/reorder`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ cardIds }),
    });

    if (!res.ok) {
      console.error("Failed to reorder deck cards, status:", res.status);
      return null;
    }
    return res.json();
  } catch (error) {
    console.error("Error reordering deck cards:", error);
    return null;
  }
}
