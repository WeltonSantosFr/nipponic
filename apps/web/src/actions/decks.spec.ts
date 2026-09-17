import { describe, it, expect, vi, beforeEach } from "vitest";
import { cookies } from "next/headers";
import { getDecksAction, getPublicDecksAction, getDeckAction } from "./decks";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

describe("decks actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getDecksAction", () => {
    it("should return empty array when authentication token cookie is missing", async () => {
      // Arrange
      const mockCookieStore = {
        get: vi.fn().mockReturnValue(undefined),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      // Act
      const result = await getDecksAction();

      // Assert
      expect(result).toEqual([]);
      expect(mockCookieStore.get).toHaveBeenCalledWith("nipponic.token");
    });

    it("should return decks when token is present and fetch succeeds", async () => {
      // Arrange
      const mockCookieStore = {
        get: vi.fn().mockReturnValue({ value: "valid-jwt-token" }),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      const mockDecks = [
        { id: "deck-1", name: "JLPT N5", isPublic: true },
        { id: "deck-2", name: "JLPT N4", isPublic: false },
      ];

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockDecks),
      });

      // Act
      const result = await getDecksAction();

      // Assert
      expect(result).toEqual(mockDecks);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/decks"),
        {
          method: "GET",
          headers: {
            Authorization: "Bearer valid-jwt-token",
          },
          cache: "no-store",
        }
      );
    });

    it("should return empty array when upstream fetch fails with non-ok status", async () => {
      // Arrange
      const mockCookieStore = {
        get: vi.fn().mockReturnValue({ value: "valid-jwt-token" }),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      });

      // Act
      const result = await getDecksAction();

      // Assert
      expect(result).toEqual([]);
    });

    it("should return empty array and log error when upstream fetch throws an error", async () => {
      // Arrange
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const mockCookieStore = {
        get: vi.fn().mockReturnValue({ value: "valid-jwt-token" }),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      global.fetch = vi.fn().mockRejectedValue(new Error("Network failure"));

      // Act
      const result = await getDecksAction();

      // Assert
      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith("Error fetching decks:", expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe("getPublicDecksAction", () => {
    it("should return empty array when authentication token cookie is missing", async () => {
      // Arrange
      const mockCookieStore = {
        get: vi.fn().mockReturnValue(undefined),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      // Act
      const result = await getPublicDecksAction();

      // Assert
      expect(result).toEqual([]);
      expect(mockCookieStore.get).toHaveBeenCalledWith("nipponic.token");
    });

    it("should return public decks when token is present and fetch succeeds", async () => {
      // Arrange
      const mockCookieStore = {
        get: vi.fn().mockReturnValue({ value: "valid-jwt-token" }),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      const mockPublicDecks = [
        { id: "pub-1", name: "JLPT N5 Public", isPublic: true },
      ];

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockPublicDecks),
      });

      // Act
      const result = await getPublicDecksAction();

      // Assert
      expect(result).toEqual(mockPublicDecks);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/decks/public"),
        {
          method: "GET",
          headers: {
            Authorization: "Bearer valid-jwt-token",
          },
          cache: "no-store",
        }
      );
    });

    it("should return empty array when upstream fetch fails with non-ok status", async () => {
      // Arrange
      const mockCookieStore = {
        get: vi.fn().mockReturnValue({ value: "valid-jwt-token" }),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
      });

      // Act
      const result = await getPublicDecksAction();

      // Assert
      expect(result).toEqual([]);
    });

    it("should return empty array and log error when upstream fetch throws an error", async () => {
      // Arrange
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const mockCookieStore = {
        get: vi.fn().mockReturnValue({ value: "valid-jwt-token" }),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      global.fetch = vi.fn().mockRejectedValue(new Error("Network failure"));

      // Act
      const result = await getPublicDecksAction();

      // Assert
      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith("Error fetching public decks:", expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe("getDeckAction", () => {
    it("should return null when authentication token cookie is missing", async () => {
      // Arrange
      const mockCookieStore = {
        get: vi.fn().mockReturnValue(undefined),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      // Act
      const result = await getDeckAction("deck-123");

      // Assert
      expect(result).toBeNull();
      expect(mockCookieStore.get).toHaveBeenCalledWith("nipponic.token");
    });
  });
});
