"use server";
import { cookies } from "next/headers";
import { Card } from "@nipponic/shared";

const API_URL = process.env.API_URL || "http://localhost:3001";

export async function getCardsAction(): Promise<Card[]> {
  const cookieStore = await cookies();
  const token = cookieStore.get("nipponic.token")?.value;

  if (!token) return [];

  try {
    const res = await fetch(`${API_URL}/cards`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!res.ok) return [];
    return res.json();
  } catch (error) {
    console.error("Error fetching cards:", error);
    return [];
  }
}

export async function createCardAction(card: {
  jpText: string;
  enText: string;
}): Promise<Card | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("nipponic.token")?.value;

  if (!token) return null;

  try {
    const res = await fetch(`${API_URL}/cards`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(card),
    });

    if (!res.ok) {
      console.error("Failed to create card, status:", res.status);
      return null;
    }
    return res.json();
  } catch (error) {
    console.error("Error creating card:", error);
    return null;
  }
}

export async function updateCardAction(
  id: string,
  card: Partial<{
    jpText: string;
    enText: string;
  }>
): Promise<Card | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("nipponic.token")?.value;

  if (!token) return null;

  try {
    const res = await fetch(`${API_URL}/cards/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(card),
    });

    if (!res.ok) {
      console.error("Failed to update card, status:", res.status);
      return null;
    }
    return res.json();
  } catch (error) {
    console.error("Error updating card:", error);
    return null;
  }
}

export async function deleteCardAction(id: string): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get("nipponic.token")?.value;

  if (!token) return false;

  try {
    const res = await fetch(`${API_URL}/cards/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return res.ok;
  } catch (error) {
    console.error("Error deleting card:", error);
    return false;
  }
}
