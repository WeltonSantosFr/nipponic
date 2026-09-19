"use server";

import { cookies } from "next/headers";
import type { ActionResponse, Sponsor, MockSponsorshipInput } from "@nipponic/shared";
import { getApiUrl } from "@/lib/api-config";

export async function getPublicSponsorsAction(): Promise<Sponsor[]> {
  try {
    const res = await fetch(`${getApiUrl()}/sponsors`, {
      method: "GET",
      cache: "no-store",
    });

    if (!res.ok) {
      return [];
    }

    return await res.json();
  } catch (error) {
    console.error("Error fetching public sponsors:", error);
    return [];
  }
}

export async function linkGithubUsernameAction(
  githubUsername: string
): Promise<ActionResponse & { isSupporter?: boolean; isActiveSupporter?: boolean; tierName?: string | null }> {
  const cookieStore = await cookies();
  const token = cookieStore.get("nipponic.token")?.value;

  if (!token) {
    return { success: false, message: "User not authenticated" };
  }

  try {
    const res = await fetch(`${getApiUrl()}/sponsors/link-github`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ githubUsername }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      return {
        success: false,
        message: data?.message || "Failed to link GitHub account",
      };
    }

    return {
      success: true,
      isSupporter: data?.isSupporter,
      isActiveSupporter: data?.isActiveSupporter,
      tierName: data?.tierName,
    };
  } catch (error) {
    console.error("Error linking GitHub username:", error);
    return {
      success: false,
      message: "Network error while linking GitHub username",
    };
  }
}

export async function mockSponsorAction(
  input: MockSponsorshipInput
): Promise<ActionResponse> {
  if (process.env.NODE_ENV === "production") {
    return {
      success: false,
      message: "Mock sponsorships are not available in production",
    };
  }

  try {
    const res = await fetch(`${getApiUrl()}/sponsors/mock`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      return {
        success: false,
        message: data?.message || "Failed to create mock sponsor",
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Error creating mock sponsor:", error);
    return {
      success: false,
      message: "Network error while mocking sponsor",
    };
  }
}

export async function clearMockSponsorsAction(): Promise<ActionResponse> {
  if (process.env.NODE_ENV === "production") {
    return {
      success: false,
      message: "Mock sponsorships are not available in production",
    };
  }

  try {
    const res = await fetch(`${getApiUrl()}/sponsors/mock`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      return {
        success: false,
        message: data?.message || "Failed to clear mock sponsors",
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Error clearing mock sponsors:", error);
    return {
      success: false,
      message: "Network error while clearing mock sponsors",
    };
  }
}
