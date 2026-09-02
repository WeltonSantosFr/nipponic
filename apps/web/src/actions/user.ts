"use server";

import { cookies } from "next/headers";

const API_URL = process.env.API_URL || "http://localhost:3001";

export async function changePasswordAction(
  newPassword: string
): Promise<{ success: boolean; message?: string }> {
  const cookieStore = await cookies();
  const token = cookieStore.get("nipponic.token")?.value;

  if (!token) {
    return { success: false, message: "User not authenticated" };
  }

  try {
    const res = await fetch(`${API_URL}/users/me`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ password: newPassword }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      return {
        success: false,
        message: data?.message || "Failed to update password",
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Error changing password:", error);
    return {
      success: false,
      message: "Network error while updating password",
    };
  }
}

export async function deleteAccountAction(): Promise<{
  success: boolean;
  message?: string;
}> {
  const cookieStore = await cookies();
  const token = cookieStore.get("nipponic.token")?.value;

  if (!token) {
    return { success: false, message: "User not authenticated" };
  }

  try {
    const res = await fetch(`${API_URL}/users/me`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      return {
        success: false,
        message: data?.message || "Failed to delete account",
      };
    }

    cookieStore.delete("nipponic.token");
    return { success: true };
  } catch (error) {
    console.error("Error deleting account:", error);
    return {
      success: false,
      message: "Network error while deleting account",
    };
  }
}
