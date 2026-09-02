"use server";
import { cookies } from "next/headers";
import { Note } from "@nipponic/shared";

const API_URL = process.env.API_URL || "http://localhost:3001";

export async function getNotesAction(): Promise<Note[]> {
  const cookieStore = await cookies();
  const token = cookieStore.get("nipponic.token")?.value;

  if (!token) return [];

  try {
    const res = await fetch(`${API_URL}/notes`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!res.ok) return [];
    return res.json();
  } catch (error) {
    console.error("Error fetching notes:", error);
    return [];
  }
}

export async function createNoteAction(note: {
  title: string;
  enText: string;
  jpText: string;
}): Promise<Note | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("nipponic.token")?.value;

  if (!token) return null;

  try {
    const res = await fetch(`${API_URL}/notes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(note),
    });

    if (!res.ok) {
      console.error("Failed to create note, status:", res.status);
      return null;
    }
    return res.json();
  } catch (error) {
    console.error("Error creating note:", error);
    return null;
  }
}

export async function updateNoteAction(
  id: string,
  note: Partial<{
    title: string;
    enText: string;
    jpText: string;
  }>
): Promise<Note | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("nipponic.token")?.value;

  if (!token) return null;

  try {
    const res = await fetch(`${API_URL}/notes/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(note),
    });

    if (!res.ok) {
      console.error("Failed to update note, status:", res.status);
      return null;
    }
    return res.json();
  } catch (error) {
    console.error("Error updating note:", error);
    return null;
  }
}

export async function deleteNoteAction(id: string): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get("nipponic.token")?.value;

  if (!token) return false;

  try {
    const res = await fetch(`${API_URL}/notes/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return res.ok;
  } catch (error) {
    console.error("Error deleting note:", error);
    return false;
  }
}