import { describe, it, expect, vi, beforeEach } from "vitest";
import { cookies } from "next/headers";
import { getDecksAction } from "./decks";

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
  });
});
