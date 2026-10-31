"use server";

import { cookies } from "next/headers";
import { type StudyStats, StudyStatsSchema } from "@nipponic/shared";
import { API_URL } from "@/lib/api-config";

export async function getStudyStatsAction(): Promise<StudyStats | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("nipponic.token")?.value;

  if (!token) return null;

  try {
    const res = await fetch(`${API_URL}/stats/dashboard`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    const parsed = StudyStatsSchema.safeParse(data);
    if (!parsed.success) {
      console.error("[stats] Invalid stats response schema:", parsed.error);
      return data as StudyStats;
    }
    return parsed.data;
  } catch (error) {
    console.error("Error fetching study stats:", error);
    return null;
  }
}
