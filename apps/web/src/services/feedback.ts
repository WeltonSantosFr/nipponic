import type {
  CreateFeedbackTicketDto,
  UpdateFeedbackTicketDto,
  FeedbackListQueryDto,
  FeedbackTicket,
} from "@nipponic/shared";
import { API_URL } from "@/lib/api-config";

export async function submitFeedback(
  token: string,
  data: CreateFeedbackTicketDto,
): Promise<FeedbackTicket> {
  const response = await fetch(`${API_URL}/feedback`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    let message = "Failed to submit feedback. Please try again.";
    try {
      const err = await response.json();
      if (err?.message) {
        message = Array.isArray(err.message) ? err.message.join(", ") : err.message;
      }
    } catch {
      // ignore json error
    }
    throw new Error(message);
  }

  return response.json();
}

export async function fetchAdminTickets(
  token: string,
  query?: FeedbackListQueryDto,
): Promise<FeedbackTicket[]> {
  const params = new URLSearchParams();
  if (query?.status) params.set("status", query.status);
  if (query?.type) params.set("type", query.type);
  if (query?.search) params.set("search", query.search);

  const queryString = params.toString() ? `?${params.toString()}` : "";
  const response = await fetch(`${API_URL}/feedback/admin${queryString}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    let message = "Failed to fetch tickets";
    try {
      const err = await response.json();
      if (err?.message) message = err.message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  return response.json();
}

export async function updateAdminTicket(
  token: string,
  id: string,
  data: UpdateFeedbackTicketDto,
): Promise<FeedbackTicket> {
  const response = await fetch(`${API_URL}/feedback/admin/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    let message = "Failed to update ticket";
    try {
      const err = await response.json();
      if (err?.message) message = err.message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  return response.json();
}

export async function deleteAdminTicket(
  token: string,
  id: string,
): Promise<{ success: boolean; id: string }> {
  const response = await fetch(`${API_URL}/feedback/admin/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    let message = "Failed to delete ticket";
    try {
      const err = await response.json();
      if (err?.message) message = err.message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  return response.json();
}
