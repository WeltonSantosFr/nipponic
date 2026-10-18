"use server";
import { cookies } from "next/headers";
import {
  type CurriculumTopic,
  type Lesson,
  type SubmitLessonProgressDto,
  type SubmitLessonFeedbackDto,
} from "@nipponic/shared";
import { API_URL } from "@/lib/api-config";

export async function getCurriculumAction(
  level: string = "N5"
): Promise<CurriculumTopic[]> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("nipponic.token")?.value;

    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_URL}/tutor/curriculum?level=${level}`, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    if (!res.ok) {
      console.warn(`Failed to fetch curriculum (${res.status})`);
      return [];
    }

    return await res.json();
  } catch (error) {
    console.error("Error fetching curriculum:", error);
    return [];
  }
}

export async function getLessonAction(
  topicId: string
): Promise<Lesson | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("nipponic.token")?.value;

    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_URL}/tutor/topics/${topicId}/lesson`, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    if (!res.ok) {
      console.warn(`Failed to fetch lesson for topic ${topicId} (${res.status})`);
      return null;
    }

    return await res.json();
  } catch (error) {
    console.error(`Error fetching lesson for topic ${topicId}:`, error);
    return null;
  }
}

export async function submitLessonProgressAction(
  lessonId: string,
  payload: SubmitLessonProgressDto
): Promise<{ success: boolean; score?: number }> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("nipponic.token")?.value;

    if (!token) {
      return { success: false };
    }

    const res = await fetch(`${API_URL}/tutor/lessons/${lessonId}/progress`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      return { success: false };
    }

    return await res.json();
  } catch (error) {
    console.error(`Error submitting lesson progress for ${lessonId}:`, error);
    return { success: false };
  }
}

export async function submitLessonFeedbackAction(
  lessonId: string,
  payload: SubmitLessonFeedbackDto
): Promise<{ success: boolean }> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("nipponic.token")?.value;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_URL}/tutor/lessons/${lessonId}/feedback`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      return { success: false };
    }

    return await res.json();
  } catch (error) {
    console.error(`Error submitting feedback for lesson ${lessonId}:`, error);
    return { success: false };
  }
}

export async function generateNextUnitAction(
  level: string = "N5"
): Promise<CurriculumTopic[]> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("nipponic.token")?.value;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_URL}/tutor/curriculum/generate`, {
      method: "POST",
      headers,
      body: JSON.stringify({ level }),
      cache: "no-store",
    });

    if (!res.ok) {
      console.warn(`Failed to generate next unit for ${level} (${res.status})`);
      return [];
    }

    return await res.json();
  } catch (error) {
    console.error(`Error generating next unit for ${level}:`, error);
    return [];
  }
}

