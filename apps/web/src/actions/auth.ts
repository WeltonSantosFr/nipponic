"use server";
import { cookies } from "next/headers";
import { API_URL } from "@/lib/api-config";
import type { UserPayload } from "@nipponic/shared";

export type SessionValidationResult =
  | { status: "valid"; user: UserPayload }
  | { status: "invalid"; reason?: string }
  | { status: "no_token" }
  | { status: "error"; message?: string };

export async function saveAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set("nipponic.token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
}

export async function removeAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete("nipponic.token");
}

export async function validateSessionAction(): Promise<SessionValidationResult> {
  const cookieStore = await cookies();
  const token = cookieStore.get("nipponic.token")?.value;

  if (!token) {
    return { status: "no_token" };
  }

  try {
    const res = await fetch(`${API_URL}/users/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (res.ok) {
      const user = (await res.json()) as UserPayload;
      return { status: "valid", user };
    }

    if (res.status === 401 || res.status === 403) {
      cookieStore.delete("nipponic.token");
      return { status: "invalid", reason: "Token expired or invalid" };
    }

    return { status: "error", message: `Unexpected status code: ${res.status}` };
  } catch (error) {
    console.error("Error validating session:", error);
    return { status: "error", message: "Network error" };
  }
}

