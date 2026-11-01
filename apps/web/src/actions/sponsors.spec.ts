import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cookies } from "next/headers";
import {
  getPublicSponsorsAction,
  linkGithubUsernameAction,
  mockSponsorAction,
  clearMockSponsorsAction,
} from "./sponsors";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

describe("sponsors actions (src/actions/sponsors.ts)", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.unstubAllEnvs();
  });

  describe("getPublicSponsorsAction", () => {
    it("returns list of sponsors when fetch succeeds with 200", async () => {
      const mockData = [
        {
          id: "sp1",
          githubUsername: "kenji",
          tierName: "Ramen",
          monthlyPriceInCents: 500,
          isOneTime: false,
          isActive: true,
          createdAt: new Date().toISOString(),
        },
      ];

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockData,
      });

      const result = await getPublicSponsorsAction();
      expect(result).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/sponsors"),
        expect.objectContaining({ method: "GET", cache: "no-store" })
      );
    });

    it("returns empty array when response is not ok", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      });

      const result = await getPublicSponsorsAction();
      expect(result).toEqual([]);
    });

    it("returns empty array when fetch throws an error", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      global.fetch = vi.fn().mockRejectedValue(new Error("Network connection dropped"));

      const result = await getPublicSponsorsAction();
      expect(result).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error fetching public sponsors:",
        expect.any(Error)
      );
      consoleErrorSpy.mockRestore();
    });
  });

  describe("linkGithubUsernameAction", () => {
    it("returns error if user is not authenticated (no token)", async () => {
      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn().mockReturnValue(undefined),
      } as any);

      const result = await linkGithubUsernameAction("octocat");
      expect(result).toEqual({
        success: false,
        message: "User not authenticated",
      });
    });

    it("returns success and supporter details when request succeeds", async () => {
      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn().mockReturnValue({ value: "test-auth-token" }),
      } as any);

      const mockResponse = {
        isSupporter: true,
        isActiveSupporter: true,
        tierName: "Ramen",
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await linkGithubUsernameAction("octocat");
      expect(result).toEqual({
        success: true,
        isSupporter: true,
        isActiveSupporter: true,
        tierName: "Ramen",
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/sponsors/link-github"),
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer test-auth-token",
            "Content-Type": "application/json",
          }),
          body: JSON.stringify({ githubUsername: "octocat" }),
        })
      );
    });

    it("returns error message from server when response is not ok", async () => {
      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn().mockReturnValue({ value: "test-auth-token" }),
      } as any);

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ message: "GitHub user not found" }),
      });

      const result = await linkGithubUsernameAction("unknown-user");
      expect(result).toEqual({
        success: false,
        message: "GitHub user not found",
      });
    });

    it("returns fallback error message when response is not ok and json parse fails", async () => {
      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn().mockReturnValue({ value: "test-auth-token" }),
      } as any);

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => {
          throw new Error("Invalid json");
        },
      });

      const result = await linkGithubUsernameAction("user123");
      expect(result).toEqual({
        success: false,
        message: "Failed to link GitHub account",
      });
    });

    it("handles network error and returns failure message", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn().mockReturnValue({ value: "test-auth-token" }),
      } as any);

      global.fetch = vi.fn().mockRejectedValue(new Error("DNS lookup failure"));

      const result = await linkGithubUsernameAction("user123");
      expect(result).toEqual({
        success: false,
        message: "Network error while linking GitHub username",
      });
      consoleErrorSpy.mockRestore();
    });
  });

  describe("mockSponsorAction", () => {
    const mockInput = {
      githubUsername: "tester",
      name: "Tester",
      tierName: "🌱 Green Tea",
      monthlyPriceInCents: 100,
      isOneTime: false,
      isActive: true,
    };

    it("returns error if invoked in production environment", async () => {
      vi.stubEnv("NODE_ENV", "production");

      const result = await mockSponsorAction(mockInput);
      expect(result).toEqual({
        success: false,
        message: "Mock sponsorships are not available in production",
      });
    });

    it("returns error if user is unauthenticated", async () => {
      vi.stubEnv("NODE_ENV", "development");
      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn().mockReturnValue(undefined),
      } as any);

      const result = await mockSponsorAction(mockInput);
      expect(result).toEqual({
        success: false,
        message: "User not authenticated",
      });
    });

    it("creates mock sponsor successfully when fetch succeeds", async () => {
      vi.stubEnv("NODE_ENV", "development");
      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn().mockReturnValue({ value: "auth-token-123" }),
      } as any);

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
      });

      const result = await mockSponsorAction(mockInput);
      expect(result).toEqual({ success: true });
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/sponsors/mock"),
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer auth-token-123",
          }),
          body: JSON.stringify(mockInput),
        })
      );
    });

    it("returns error message when server responds with error status", async () => {
      vi.stubEnv("NODE_ENV", "development");
      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn().mockReturnValue({ value: "auth-token-123" }),
      } as any);

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ message: "Tier not recognized" }),
      });

      const result = await mockSponsorAction(mockInput);
      expect(result).toEqual({
        success: false,
        message: "Tier not recognized",
      });
    });

    it("returns fallback message when server responds with error and unparseable json", async () => {
      vi.stubEnv("NODE_ENV", "development");
      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn().mockReturnValue({ value: "auth-token-123" }),
      } as any);

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => {
          throw new Error("Bad json");
        },
      });

      const result = await mockSponsorAction(mockInput);
      expect(result).toEqual({
        success: false,
        message: "Failed to create mock sponsor",
      });
    });

    it("returns network error message when fetch throws", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      vi.stubEnv("NODE_ENV", "development");
      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn().mockReturnValue({ value: "auth-token-123" }),
      } as any);

      global.fetch = vi.fn().mockRejectedValue(new Error("Timeout"));

      const result = await mockSponsorAction(mockInput);
      expect(result).toEqual({
        success: false,
        message: "Network error while mocking sponsor",
      });
      consoleErrorSpy.mockRestore();
    });
  });

  describe("clearMockSponsorsAction", () => {
    it("returns error if invoked in production environment", async () => {
      vi.stubEnv("NODE_ENV", "production");

      const result = await clearMockSponsorsAction();
      expect(result).toEqual({
        success: false,
        message: "Mock sponsorships are not available in production",
      });
    });

    it("returns error if user is unauthenticated", async () => {
      vi.stubEnv("NODE_ENV", "development");
      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn().mockReturnValue(undefined),
      } as any);

      const result = await clearMockSponsorsAction();
      expect(result).toEqual({
        success: false,
        message: "User not authenticated",
      });
    });

    it("clears mock sponsors successfully when fetch succeeds", async () => {
      vi.stubEnv("NODE_ENV", "development");
      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn().mockReturnValue({ value: "auth-token-123" }),
      } as any);

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
      });

      const result = await clearMockSponsorsAction();
      expect(result).toEqual({ success: true });
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/sponsors/mock"),
        expect.objectContaining({
          method: "DELETE",
          headers: { Authorization: "Bearer auth-token-123" },
        })
      );
    });

    it("returns error message when server responds with error status", async () => {
      vi.stubEnv("NODE_ENV", "development");
      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn().mockReturnValue({ value: "auth-token-123" }),
      } as any);

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ message: "Permission denied" }),
      });

      const result = await clearMockSponsorsAction();
      expect(result).toEqual({
        success: false,
        message: "Permission denied",
      });
    });

    it("returns fallback message when server responds with error and unparseable json", async () => {
      vi.stubEnv("NODE_ENV", "development");
      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn().mockReturnValue({ value: "auth-token-123" }),
      } as any);

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => {
          throw new Error("Bad json");
        },
      });

      const result = await clearMockSponsorsAction();
      expect(result).toEqual({
        success: false,
        message: "Failed to clear mock sponsors",
      });
    });

    it("returns network error message when fetch throws", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      vi.stubEnv("NODE_ENV", "development");
      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn().mockReturnValue({ value: "auth-token-123" }),
      } as any);

      global.fetch = vi.fn().mockRejectedValue(new Error("Timeout"));

      const result = await clearMockSponsorsAction();
      expect(result).toEqual({
        success: false,
        message: "Network error while clearing mock sponsors",
      });
      consoleErrorSpy.mockRestore();
    });
  });
});
