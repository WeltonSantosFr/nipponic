"use server";
import { cookies } from "next/headers";

const API_URL = "http://localhost:3001";

export async function getNotesAction() {
  const cookieStore = await cookies();
  const token = cookieStore.get("nipponic.token")?.value;

  if (!token) return [];

  const res = await fetch(`${API_URL}/notes`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });

  if (!res.ok) return [];
  return res.json();
}