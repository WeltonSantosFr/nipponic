"use server";

import { cookies } from "next/headers";
import type {
  CreateFeedbackTicketDto,
  UpdateFeedbackTicketDto,
  FeedbackListQueryDto,
  FeedbackTicket,
} from "@nipponic/shared";
import { API_URL } from "@/lib/api-config";

export async function submitFeedbackAction(
  data: CreateFeedbackTicketDto,
): Promise<{ success: boolean; data?: FeedbackTicket; error?: string }> {
  const cookieStore = await cookies();
  const token = cookieStore.get("nipponic.token")?.value;

  if (!token) {
    return { success: false, error: "You must be signed in to submit feedback." };
  }

  try {
    const res = await fetch(`${API_URL}/feedback`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      let error = "Failed to submit ticket";
      try {
        const body = await res.json();
        if (body?.message) {
          error = Array.isArray(body.message) ? body.message.join(", ") : body.message;
        }
      } catch {
        // ignore
      }
      return { success: false, error };
    }

    const created: FeedbackTicket = await res.json();
    return { success: true, data: created };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "An unexpected error occurred.",
    };
  }
}

export async function getAdminTicketsAction(
  query?: FeedbackListQueryDto,
): Promise<{ success: boolean; tickets: FeedbackTicket[]; error?: string }> {
  const cookieStore = await cookies();
  const token = cookieStore.get("nipponic.token")?.value;

  if (!token) {
    return { success: false, tickets: [], error: "Unauthorized access" };
  }

  const params = new URLSearchParams();
  if (query?.status) params.set("status", query.status);
  if (query?.type) params.set("type", query.type);
  if (query?.search) params.set("search", query.search);

  const queryString = params.toString() ? `?${params.toString()}` : "";

  try {
    const res = await fetch(`${API_URL}/feedback/admin${queryString}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      let error = "Unauthorized or failed to fetch tickets";
      try {
        const body = await res.json();
        if (body?.message) error = body.message;
      } catch {
        // ignore
      }
      return { success: false, tickets: [], error };
    }

    const tickets: FeedbackTicket[] = await res.json();
    return { success: true, tickets };
  } catch (err: unknown) {
    return {
      success: false,
      tickets: [],
      error: err instanceof Error ? err.message : "Failed to fetch tickets",
    };
  }
}

export async function updateAdminTicketAction(
  id: string,
  data: UpdateFeedbackTicketDto,
): Promise<{ success: boolean; ticket?: FeedbackTicket; error?: string }> {
  const cookieStore = await cookies();
  const token = cookieStore.get("nipponic.token")?.value;

  if (!token) {
    return { success: false, error: "Unauthorized access" };
  }

  try {
    const res = await fetch(`${API_URL}/feedback/admin/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      let error = "Failed to update ticket";
      try {
        const body = await res.json();
        if (body?.message) error = body.message;
      } catch {
        // ignore
      }
      return { success: false, error };
    }

    const ticket: FeedbackTicket = await res.json();
    return { success: true, ticket };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update ticket",
    };
  }
}

export async function deleteAdminTicketAction(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  const cookieStore = await cookies();
  const token = cookieStore.get("nipponic.token")?.value;

  if (!token) {
    return { success: false, error: "Unauthorized access" };
  }

  try {
    const res = await fetch(`${API_URL}/feedback/admin/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      let error = "Failed to delete ticket";
      try {
        const body = await res.json();
        if (body?.message) error = body.message;
      } catch {
        // ignore
      }
      return { success: false, error };
    }

    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to delete ticket",
    };
  }
}
